import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import type {
  AuthenticatedUser,
  SessionRequestMetadata,
} from '../common/http/request-context';
import {
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailOutboxService } from '../email/email-outbox.service';
import {
  permissionCatalog,
  permissions,
  type Permission,
} from '../common/http/rbac.constants';
import { subscriptionLimits } from '../platform/subscription-limit.constants';
import type { SubscriptionFeatureCode } from '../platform/subscription-feature.constants';
import { SubscriptionLifecycleService } from '../platform/subscription-lifecycle.service';
import { AddShopMemberDto } from './dto/add-shop-member.dto';
import { CreateShopPaymentProofDto } from './dto/create-shop-payment-proof.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { CreateShopRoleDto } from './dto/create-shop-role.dto';
import { UpdateShopMemberDto } from './dto/update-shop-member.dto';
import { UpdateShopRoleDto } from './dto/update-shop-role.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

type ShopWithCount = any & {
  _count: {
    members: number;
  };
};

type MemberWithAccess = any;
type RoleWithAccess = any;
type AuditLogRecord = any;
type ShopTransaction = Prisma.TransactionClient;
const allowedOperationalSubscriptionStatuses = new Set([
  'trialing',
  'active',
  'overdue',
]);
const ownerRoleCode = 'owner';
const STAFF_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailOutbox: EmailOutboxService,
    private readonly subscriptionLifecycle: SubscriptionLifecycleService,
  ) {}

  async listUserShops(userId: string) {
    await this.subscriptionLifecycle.expireElapsedTrials();

    const memberships = await this.prisma.shopMember.findMany({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        shop: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((member) => {
      const access = this.extractMemberAccess(member);

      return {
        ...this.serializeShopRecord(member.shop),
        membership: {
          id: member.id,
          role: access.primaryRole,
          roles: access.roles,
          status: member.status,
          permissions: access.permissions,
        },
      };
    });
  }

  async listShops(
    currentUser: AuthenticatedUser,
    query: CursorPaginationQueryDto,
  ) {
    const shops = await this.listUserShops(currentUser.id);
    const page = paginate(shops, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async createShop(currentUser: AuthenticatedUser, body: CreateShopDto) {
    const timezone = body.timezone ?? 'Asia/Yangon';
    this.assertValidTimeZone(timezone);

    const created = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          ownerUserId: currentUser.id,
          name: body.name,
          timezone,
        },
      });
      const ownerRole = await this.requireRolesByCodes(['owner'], shop.id);

      const member = await tx.shopMember.create({
        data: {
          shopId: shop.id,
          userId: currentUser.id,
          status: 'active',
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: ownerRole.map((role) => ({
          shopMemberId: member.id,
          roleId: role.id,
        })),
      });

      await this.subscriptionLifecycle.createDefaultTrialSubscription(tx, shop.id, {
        required: true,
      });

      return shop;
    });

    return this.serializeShop(created.id);
  }

  async getShop(currentUser: AuthenticatedUser, shopId: string) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsRead);
    return this.serializeShop(shopId);
  }

  async getBilling(currentUser: AuthenticatedUser, shopId: string) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsRead);
    await this.subscriptionLifecycle.expireElapsedTrials();

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                items: {
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
                limits: {
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
              },
            },
            payments: {
              orderBy: [{ dueAt: 'desc' }, { createdAt: 'desc' }],
            },
          },
        },
      },
    });

    if (!shop) {
      throw notFoundError('Shop not found');
    }

    const subscription = shop.subscription;
    const plan = subscription?.plan ?? null;
    const payments = [...(subscription?.payments ?? [])];
    const outstandingStatuses = new Set(['pending', 'overdue', 'failed']);
    const outstandingInvoices = payments.filter((payment) =>
      outstandingStatuses.has(payment.status),
    );
    const latestInvoice = [...payments].sort((left, right) => {
      const leftDate = left.paidAt ?? left.dueAt ?? left.createdAt;
      const rightDate = right.paidAt ?? right.dueAt ?? right.createdAt;
      return rightDate.getTime() - leftDate.getTime();
    })[0];
    const latestPaidInvoice = [...payments]
      .filter((payment) => payment.paidAt)
      .sort((left, right) => right.paidAt!.getTime() - left.paidAt!.getTime())[0];
    const nextDueInvoice = [...outstandingInvoices]
      .filter((payment) => payment.dueAt)
      .sort((left, right) => left.dueAt!.getTime() - right.dueAt!.getTime())[0];

    const paymentProofs = await this.prisma.paymentProofSubmission.findMany({
      where: {
        shopId,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
      include: {
        reviewedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      shop_id: shop.id,
      shop_name: shop.name,
      overview: {
        status: subscription?.status ?? null,
        auto_renews: subscription?.autoRenews ?? false,
        plan_code: plan?.code ?? null,
        plan_name: plan?.name ?? null,
        plan_price: plan?.price ?? null,
        plan_currency: plan?.currency ?? null,
        billing_period: plan?.billingPeriod ?? null,
        current_period_start: subscription?.startAt?.toISOString() ?? null,
        current_period_end: subscription?.endAt?.toISOString() ?? null,
        outstanding_balance: outstandingInvoices.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        ),
        overdue_invoice_count: payments.filter(
          (payment) => payment.status === 'overdue',
        ).length,
        next_due_at: nextDueInvoice?.dueAt?.toISOString() ?? null,
        latest_invoice_status: latestInvoice?.status ?? null,
        latest_paid_at: latestPaidInvoice?.paidAt?.toISOString() ?? null,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            auto_renews: subscription.autoRenews,
            start_at: subscription.startAt.toISOString(),
            end_at: subscription.endAt?.toISOString() ?? null,
            created_at: subscription.createdAt.toISOString(),
            updated_at: subscription.updatedAt.toISOString(),
          }
        : null,
      plan: plan
        ? {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            billing_period: plan.billingPeriod,
            is_active: plan.isActive,
            items: (plan.items ?? []).map((item) => ({
              id: item.id,
              code: item.code,
              label: item.label,
              description: item.description,
              availability_status: item.availabilityStatus,
              sort_order: item.sortOrder,
            })),
            limits: (plan.limits ?? []).map((limit) => ({
              id: limit.id,
              code: limit.code,
              label: limit.label,
              description: limit.description,
              value: limit.value ?? null,
              sort_order: limit.sortOrder,
            })),
          }
        : null,
      invoices: payments.map((payment) => ({
        id: payment.id,
        invoice_no: payment.invoiceNo,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.paymentMethod,
        provider_ref: payment.providerRef,
        due_at: payment.dueAt?.toISOString() ?? null,
        paid_at: payment.paidAt?.toISOString() ?? null,
        created_at: payment.createdAt.toISOString(),
        updated_at: payment.updatedAt.toISOString(),
      })),
      payment_proofs: paymentProofs.map((proof) => ({
        id: proof.id,
        payment_id: proof.paymentId,
        invoice_no: proof.invoiceNoSnapshot,
        amount_claimed: proof.amountClaimed,
        currency_claimed: proof.currencyClaimed,
        payment_channel: proof.paymentChannel,
        paid_at: proof.paidAt?.toISOString() ?? null,
        sender_name: proof.senderName,
        sender_phone: proof.senderPhone,
        transaction_ref: proof.transactionRef,
        note: proof.note,
        status: proof.status,
        admin_note: proof.adminNote,
        reviewed_at: proof.reviewedAt?.toISOString() ?? null,
        reviewed_by:
          proof.reviewedByUser === null
            ? null
            : {
                id: proof.reviewedByUser.id,
                name: proof.reviewedByUser.name,
              },
        created_at: proof.createdAt.toISOString(),
      })),
    };
  }

  async submitPaymentProof(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateShopPaymentProofDto,
  ) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsRead);

    const invoiceNo = body.invoice_no.trim();
    const payment = await this.prisma.payment.findFirst({
      where: {
        invoiceNo,
        subscription: {
          shopId,
        },
      },
      include: {
        subscription: {
          include: {
            shop: true,
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      throw validationError([
        {
          field: 'invoice_no',
          errors: ['Invoice not found for this shop.'],
        },
      ]);
    }

    const proof = await this.prisma.paymentProofSubmission.create({
      data: {
        shopId,
        paymentId: payment.id,
        invoiceNoSnapshot: payment.invoiceNo,
        amountClaimed: body.amount_claimed,
        currencyClaimed: body.currency_claimed?.trim() || payment.currency,
        paymentChannel: body.payment_channel.trim(),
        paidAt: body.paid_at ? new Date(body.paid_at) : null,
        senderName: body.sender_name?.trim() || null,
        senderPhone: body.sender_phone?.trim() || null,
        transactionRef: body.transaction_ref?.trim() || null,
        note: body.note?.trim() || null,
        status: 'submitted',
      },
    });

    await this.emailOutbox.queueAndSendEmail({
      shopId,
      category: 'payment_proof',
      toEmail:
        process.env.PUBLIC_CONTACT_INBOX_EMAIL?.trim() ||
        process.env.EMAIL_SUPPORT_EMAIL?.trim() ||
        'support@fom-platform.local',
      subject: `[FOM Billing] Payment proof ${payment.invoiceNo} (${payment.subscription.shop.name})`,
      textBody: [
        `Shop: ${payment.subscription.shop.name}`,
        `Invoice: ${payment.invoiceNo}`,
        `Claimed amount: ${body.amount_claimed.toLocaleString()} ${body.currency_claimed?.trim() || payment.currency}`,
        `Channel: ${body.payment_channel.trim()}`,
        body.transaction_ref?.trim()
          ? `Transaction ref: ${body.transaction_ref.trim()}`
          : null,
        body.sender_name?.trim() ? `Sender: ${body.sender_name.trim()}` : null,
        body.sender_phone?.trim() ? `Sender phone: ${body.sender_phone.trim()}` : null,
        body.note?.trim() ? `Note: ${body.note.trim()}` : null,
        `Proof ID: ${proof.id}`,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: {
        payment_proof_id: proof.id,
        invoice_no: payment.invoiceNo,
        shop_id: shopId,
      },
    });

    return {
      id: proof.id,
      status: proof.status,
      invoice_no: proof.invoiceNoSnapshot,
      created_at: proof.createdAt.toISOString(),
    };
  }

  async updateShop(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: UpdateShopDto,
  ) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsWrite);
    if (!body.name && !body.timezone) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    if (body.timezone) {
      this.assertValidTimeZone(body.timezone);
    }

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
      },
    });

    return this.serializeShop(shopId);
  }

  async listMembers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: CursorPaginationQueryDto,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersRead,
    );
    const members = (
      await this.prisma.shopMember.findMany({
        where: { shopId },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    ).map((member) => this.serializeMemberRecord(member));

    const page = paginate(members, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async listRoles(currentUser: AuthenticatedUser, shopId: string) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersRead,
    );

    const roles = await this.prisma.role.findMany({
      where: this.buildShopRoleScopeFilter(shopId),
      include: {
        permissionAssignments: {
          include: {
            permission: true,
          },
        },
        memberAssignments: {
          where: {
            shopMember: {
              shopId,
            },
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return {
      roles: roles.map((role) => this.serializeRoleRecord(role)),
      available_permissions: permissionCatalog
        .filter((permission) => permission.scope === 'shop')
        .map((permission) => ({
          code: permission.code,
          name: permission.name,
          description: permission.description,
        })),
    };
  }

  async createRole(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateShopRoleDto,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const name = body.name.trim();
    const description = body.description?.trim() || null;
    const permissionsForRole = await this.requireShopPermissions(
      body.permission_codes,
    );

    await this.assertUniqueCustomRoleName(shopId, name);

    const createdRole = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          shopId,
          code: await this.generateCustomRoleCode(tx, shopId, name),
          scope: 'shop',
          name,
          description,
          isSystem: false,
        },
      });

      await tx.rolePermissionAssignment.createMany({
        data: permissionsForRole.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });

      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.role.created',
        entityType: 'role',
        entityId: role.id,
        summary: `Created custom role ${name}.`,
        metadata: {
          role_id: role.id,
          role_name: name,
          permission_codes: permissionsForRole.map((permission) => permission.code),
        },
      });

      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissionAssignments: {
            include: {
              permission: true,
            },
          },
          memberAssignments: {
            where: {
              shopMember: {
                shopId,
              },
            },
          },
        },
      });
    });

    return this.serializeRoleRecord(createdRole);
  }

  async updateRole(
    currentUser: AuthenticatedUser,
    shopId: string,
    roleId: string,
    body: UpdateShopRoleDto,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const existingRole = await this.requireCustomShopRole(shopId, roleId);

    if (
      body.name === undefined &&
      body.description === undefined &&
      body.permission_codes === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide name, description, or permission_codes to update the role'],
        },
      ]);
    }

    const name = body.name?.trim();
    const description = body.description === undefined
      ? undefined
      : body.description?.trim() || null;
    const permissionsForRole =
      body.permission_codes !== undefined
        ? await this.requireShopPermissions(body.permission_codes)
        : null;

    if (name && name.toLowerCase() !== existingRole.name.toLowerCase()) {
      await this.assertUniqueCustomRoleName(shopId, name, existingRole.id);
    }

    const updatedRole = await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: existingRole.id },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });

      if (permissionsForRole) {
        await tx.rolePermissionAssignment.deleteMany({
          where: {
            roleId: existingRole.id,
          },
        });

        await tx.rolePermissionAssignment.createMany({
          data: permissionsForRole.map((permission) => ({
            roleId: existingRole.id,
            permissionId: permission.id,
          })),
        });
      }

      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.role.updated',
        entityType: 'role',
        entityId: existingRole.id,
        summary: `Updated custom role ${name ?? existingRole.name}.`,
        metadata: {
          role_id: existingRole.id,
          role_name: name ?? existingRole.name,
          permission_codes:
            permissionsForRole?.map((permission) => permission.code) ?? null,
        },
      });

      return tx.role.findUnique({
        where: { id: existingRole.id },
        include: {
          permissionAssignments: {
            include: {
              permission: true,
            },
          },
          memberAssignments: {
            where: {
              shopMember: {
                shopId,
              },
            },
          },
        },
      });
    });

    return this.serializeRoleRecord(updatedRole);
  }

  async deleteRole(
    currentUser: AuthenticatedUser,
    shopId: string,
    roleId: string,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const role = await this.requireCustomShopRole(shopId, roleId);
    const activeAssignments = await this.prisma.shopMemberRoleAssignment.count({
      where: {
        roleId,
        shopMember: {
          shopId,
        },
      },
    });

    if (activeAssignments > 0) {
      throw conflictError(
        'Remove this role from shop members before deleting it.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.role.deleted',
        entityType: 'role',
        entityId: role.id,
        summary: `Deleted custom role ${role.name}.`,
        metadata: {
          role_id: role.id,
          role_name: role.name,
        },
      });

      await tx.role.delete({
        where: {
          id: role.id,
        },
      });
    });

    return {
      id: role.id,
      deleted: true,
    };
  }

  async listAuditLogs(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: CursorPaginationQueryDto,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const records = await this.prisma.shopAuditLog.findMany({
      where: {
        shopId,
      },
      include: {
        actorUser: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const rows = records.map((record) => this.serializeAuditLogRecord(record));
    const page = paginate(rows, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async addMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: AddShopMemberDto,
    metadata?: SessionRequestMetadata,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const userId = body.user_id ?? null;
    const phone = this.normalizePhone(body.phone);
    const email = body.email ?? null;
    const name = body.name ?? null;
    const roles = await this.resolveRequestedRoles(shopId, {
      roleIds: body.role_ids,
      roleCodes: body.role_codes,
      fallbackRoleCodes: ['staff'],
    });
    const requestedRoleCodes = new Set(roles.map((role) => role.code));

    if (requestedRoleCodes.has(ownerRoleCode)) {
      throw conflictError(
        'The owner role is reserved for the primary shop owner account.',
      );
    }

    if (!userId && !email && !phone) {
      throw validationError([
        {
          field: 'user_id',
          errors: ['Provide user_id, email, or phone to identify the member'],
        },
      ]);
    }

    if (!requestedRoleCodes.has(ownerRoleCode)) {
      await this.assertStaffSeatAvailability(shopId, {
        additionalSeats: 1,
      });
    }

    let targetUser =
      (userId &&
        (await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            passwordCredential: true,
            authIdentities: true,
          },
        }))) ||
      (email &&
        (await this.prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
          include: {
            passwordCredential: true,
            authIdentities: true,
          },
        }))) ||
      (phone &&
        (await this.prisma.user.findUnique({
          where: { phone: phone.replace(/\s+/g, ' ').trim() },
          include: {
            passwordCredential: true,
            authIdentities: true,
          },
        })));

    if (!targetUser) {
      if (!name || (!email && !phone)) {
        throw validationError([
          {
            field: 'name',
            errors: [
              'Provide name with email or phone when creating a new shop member',
            ],
          },
        ]);
      }

      targetUser = await this.prisma.user.create({
        data: {
          name,
          email: email?.trim().toLowerCase() ?? null,
          phone: phone?.replace(/\s+/g, ' ').trim() ?? null,
        },
        include: {
          passwordCredential: true,
          authIdentities: true,
        },
      });
    }

    const memberStatus: 'active' | 'invited' = 'invited';

    const existingMember = await this.prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId: targetUser.id,
        },
      },
    });
    if (existingMember) {
      throw conflictError('User is already a member of this shop');
    }
    const member = await this.prisma.$transaction(async (tx) => {
      const createdMember = await tx.shopMember.create({
        data: {
          shopId,
          userId: targetUser.id,
          status: memberStatus,
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: roles.map((role) => ({
          shopMemberId: createdMember.id,
          roleId: role.id,
        })),
      });

      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.member.created',
        entityType: 'shop_member',
        entityId: createdMember.id,
        summary: `Added ${targetUser.name} to the shop team.`,
        metadata: {
          member_id: createdMember.id,
          target_user_id: targetUser.id,
          target_user_name: targetUser.name,
          role_ids: roles.map((role) => role.id),
          role_codes: roles.map((role) => role.code),
          status: memberStatus,
        },
      });

      return tx.shopMember.findUnique({
        where: { id: createdMember.id },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const invitationSent = await this.queueStaffInvitationEmail(
      member.user,
      shopId,
      member.id,
      roles.map((r) => r.name),
      metadata,
    );

    return {
      ...this.serializeMemberRecord(member),
      invitation_sent: invitationSent,
    };
  }

  async resendMemberInvitation(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    metadata?: SessionRequestMetadata,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const member = await this.prisma.shopMember.findFirst({
      where: {
        id: memberId,
        shopId,
      },
      include: {
        shop: true,
        user: {
          include: {
            passwordCredential: true,
            authIdentities: true,
          },
        },
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!member) {
      throw notFoundError('Shop member not found');
    }

    if (member.status === 'disabled') {
      throw conflictError('Disabled members cannot receive an invitation link.');
    }

    if (this.userCanAuthenticateDirectly(member.user)) {
      throw conflictError(
        'This member already has direct sign-in access. No invitation link is needed.',
      );
    }

    if (!member.user.email) {
      throw conflictError(
        'This member does not have an email address that can receive an invitation.',
      );
    }

    const sent = await this.queueStaffInvitationEmail(
      member.user,
      shopId,
      member.id,
      member.roleAssignments.map((assignment) => assignment.role.name),
      metadata,
    );

    if (!sent) {
      throw conflictError('Invitation email could not be queued right now.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.member.invitation_resent',
        entityType: 'shop_member',
        entityId: member.id,
        summary: `Resent invitation to ${member.user.name}.`,
        metadata: {
          member_id: member.id,
          target_user_id: member.userId,
          target_user_name: member.user.name,
        },
      });
    });

    return {
      id: member.id,
      invitation_sent: true,
    };
  }

  async updateMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    body: UpdateShopMemberDto,
  ) {
    const access = await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );
    const shop = access.shop;
    const member = await this.prisma.shopMember.findFirst({
      where: {
        id: memberId,
        shopId,
      },
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    if (!body.status && !body.role_ids && !body.role_codes) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide status, role_ids, or role_codes to update the shop member'],
        },
      ]);
    }

    const roles =
      body.role_ids || body.role_codes
        ? await this.resolveRequestedRoles(shopId, {
            roleIds: body.role_ids,
            roleCodes: body.role_codes,
          })
        : null;
    const currentRoleCodes = member.roleAssignments.map(
      (assignment) => assignment.role.code,
    );
    const nextRoleCodes = roles
      ? roles.map((role) => role.code)
      : currentRoleCodes;
    const nextStatus = body.status ?? member.status;
    const isPrimaryOwnerMember = member.userId === shop.ownerUserId;

    if (isPrimaryOwnerMember && nextStatus !== 'active') {
      throw conflictError(
        'The primary shop owner cannot be disabled or removed from active access.',
      );
    }

    if (isPrimaryOwnerMember && !nextRoleCodes.includes(ownerRoleCode)) {
      throw conflictError(
        'The primary shop owner must keep the owner role.',
      );
    }

    if (
      !isPrimaryOwnerMember &&
      nextRoleCodes.includes(ownerRoleCode)
    ) {
      throw conflictError(
        'The owner role is reserved for the primary shop owner account.',
      );
    }

    if (this.countsTowardActiveStaffSeat(nextStatus, nextRoleCodes)) {
      await this.assertStaffSeatAvailability(shopId, {
        excludeMemberId: member.id,
        additionalSeats: 1,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (body.status) {
        await tx.shopMember.update({
          where: { id: member.id },
          data: {
            status: body.status,
          },
        });
      }

      if (roles) {
        await tx.shopMemberRoleAssignment.deleteMany({
          where: { shopMemberId: member.id },
        });
        await tx.shopMemberRoleAssignment.createMany({
          data: roles.map((role) => ({
            shopMemberId: member.id,
            roleId: role.id,
          })),
        });
      }

      await this.recordAuditLog(tx, {
        shopId,
        actorUser: currentUser,
        action: 'shop.member.updated',
        entityType: 'shop_member',
        entityId: member.id,
        summary: `Updated access for ${member.user.name}.`,
        metadata: {
          member_id: member.id,
          target_user_id: member.userId,
          target_user_name: member.user.name,
          previous_status: member.status,
          next_status: nextStatus,
          previous_role_codes: currentRoleCodes,
          next_role_codes: nextRoleCodes,
        },
      });

      return tx.shopMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    return this.serializeMemberRecord(updated);
  }

  async assertShopAccess(userId: string, shopId: string) {
    const member = await this.prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId,
        },
      },
      include: {
        shop: true,
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member || member.status !== 'active') {
      throw forbiddenError();
    }

    return {
      shop: member.shop,
      member,
      access: this.extractMemberAccess(member),
    };
  }

  async assertPermission(
    userId: string,
    shopId: string,
    requiredPermissions: Permission | Permission[],
  ) {
    const result = await this.assertShopAccess(userId, shopId);
    const required = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const missing = required.filter(
      (permission) => !result.access.permissions.includes(permission),
    );
    if (missing.length > 0) {
      throw forbiddenError('You do not have permission to perform this action');
    }

    return result;
  }

  async assertPlanFeatures(
    userId: string,
    shopId: string,
    requiredFeatures: SubscriptionFeatureCode | SubscriptionFeatureCode[],
  ) {
    const result = await this.assertShopAccess(userId, shopId);
    const requested = Array.isArray(requiredFeatures)
      ? requiredFeatures
      : [requiredFeatures];

    const planContext = await this.loadOperationalPlanContext(shopId);
    const availableFeatures = planContext.availableFeatures;
    const missing = requested.filter((feature) => !availableFeatures.has(feature));

    if (missing.length > 0) {
      throw forbiddenError(
        'This feature is not available on the current subscription plan.',
      );
    }

    return {
      ...result,
      subscription: planContext.subscription,
      availableFeatures: [...availableFeatures],
      planLimits: Object.fromEntries(planContext.planLimits),
    };
  }

  private async loadOperationalPlanContext(shopId: string) {
    await this.subscriptionLifecycle.expireElapsedTrials();

    const subscription = await this.prisma.subscription.findUnique({
      where: { shopId },
      include: {
        plan: {
          include: {
            items: true,
            limits: true,
          },
        },
      },
    });

    if (!subscription?.plan) {
      throw forbiddenError(
        'This shop does not have an active subscription plan right now.',
      );
    }

    if (!allowedOperationalSubscriptionStatuses.has(subscription.status)) {
      throw forbiddenError(
        'This shop subscription is not active for operational access right now.',
      );
    }

    const availableFeatures = new Set(
      subscription.plan.items
        .filter((item) => item.availabilityStatus === 'available')
        .map((item) => item.code),
    );
    const planLimits = new Map<string, number | null>(
      (subscription.plan.limits ?? []).map((limit) => [
        limit.code,
        limit.value ?? null,
      ]),
    );

    return {
      subscription,
      availableFeatures,
      planLimits,
    };
  }

  private countsTowardActiveStaffSeat(
    status: string,
    roleCodes: string[],
  ): boolean {
    return status === 'active' && !roleCodes.includes(ownerRoleCode);
  }

  private async assertStaffSeatAvailability(
    shopId: string,
    input: {
      excludeMemberId?: string;
      additionalSeats: number;
    },
  ) {
    if (input.additionalSeats <= 0) {
      return;
    }

    const planContext = await this.loadOperationalPlanContext(shopId);
    const limitValue = planContext.planLimits.get(
      subscriptionLimits.activeStaffMembers,
    );

    if (limitValue === undefined || limitValue === null) {
      return;
    }

    const activeStaffCount = await this.prisma.shopMember.count({
      where: {
        shopId,
        status: 'active',
        ...(input.excludeMemberId
          ? {
              NOT: {
                id: input.excludeMemberId,
              },
            }
          : {}),
        roleAssignments: {
          none: {
            role: {
              code: ownerRoleCode,
            },
          },
        },
      },
    });

    if (activeStaffCount + input.additionalSeats > limitValue) {
      throw conflictError(
        `This subscription only allows up to ${limitValue} active staff account${limitValue === 1 ? '' : 's'} for this shop.`,
        {
          limit_code: subscriptionLimits.activeStaffMembers,
          limit_value: limitValue,
        },
      );
    }
  }

  async assertInvitedMemberCanActivate(shopId: string, memberId: string) {
    const member = await this.prisma.shopMember.findFirst({
      where: {
        id: memberId,
        shopId,
      },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const roleCodes = member.roleAssignments.map((assignment) => assignment.role.code);
    if (this.countsTowardActiveStaffSeat('active', roleCodes)) {
      await this.assertStaffSeatAvailability(shopId, {
        excludeMemberId: member.id,
        additionalSeats: 1,
      });
    }
  }

  async serializeShop(shopId: string) {
    await this.subscriptionLifecycle.expireElapsedTrials();

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
    if (!shop) {
      throw notFoundError('Shop not found');
    }

    return this.serializeShopRecord(shop);
  }

  async serializeMember(memberId: string) {
    const member = await this.prisma.shopMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    return this.serializeMemberRecord(member);
  }

  private buildShopRoleScopeFilter(shopId: string): Prisma.RoleWhereInput {
    return {
      scope: 'shop',
      OR: [{ isSystem: true, shopId: null }, { shopId }],
    };
  }

  private userCanAuthenticateDirectly(user: {
    email?: string | null;
    phone?: string | null;
    passwordCredential?: unknown | null;
    authIdentities?: Array<unknown>;
  }) {
    return (
      Boolean(user.passwordCredential) ||
      Boolean(user.phone) ||
      (user.authIdentities?.length ?? 0) > 0
    );
  }

  private async requireRolesByCodes(roleCodes: string[], shopId: string) {
    const uniqueRoleCodes = [
      ...new Set(
        roleCodes
          .map((role) => role.trim())
          .filter((role) => role.length > 0),
      ),
    ].sort();

    if (uniqueRoleCodes.length === 0) {
      throw validationError([
        {
          field: 'role_codes',
          errors: ['Provide at least one role code'],
        },
      ]);
    }

    const roles = await this.prisma.role.findMany({
      where: {
        ...this.buildShopRoleScopeFilter(shopId),
        code: {
          in: uniqueRoleCodes,
        },
      },
    });

    const missingRoleCodes = uniqueRoleCodes.filter(
      (code) => !roles.some((role) => role.code === code),
    );
    if (missingRoleCodes.length > 0) {
      throw notFoundError(`Roles not found: ${missingRoleCodes.join(', ')}.`);
    }

    return roles.sort((left, right) => left.name.localeCompare(right.name));
  }

  private async requireRolesByIds(roleIds: string[], shopId: string) {
    const uniqueRoleIds = [
      ...new Set(
        roleIds
          .map((roleId) => roleId.trim())
          .filter((roleId) => roleId.length > 0),
      ),
    ].sort();

    if (uniqueRoleIds.length === 0) {
      throw validationError([
        {
          field: 'role_ids',
          errors: ['Provide at least one role id'],
        },
      ]);
    }

    const roles = await this.prisma.role.findMany({
      where: {
        ...this.buildShopRoleScopeFilter(shopId),
        id: {
          in: uniqueRoleIds,
        },
      },
    });

    const missingRoleIds = uniqueRoleIds.filter(
      (roleId) => !roles.some((role) => role.id === roleId),
    );
    if (missingRoleIds.length > 0) {
      throw notFoundError(`Roles not found: ${missingRoleIds.join(', ')}.`);
    }

    return roles.sort((left, right) => left.name.localeCompare(right.name));
  }

  private async resolveRequestedRoles(
    shopId: string,
    input: {
      roleIds?: string[];
      roleCodes?: string[];
      fallbackRoleCodes?: string[];
    },
  ) {
    if (input.roleIds && input.roleIds.length > 0) {
      return this.requireRolesByIds(input.roleIds, shopId);
    }

    if (input.roleCodes && input.roleCodes.length > 0) {
      return this.requireRolesByCodes(input.roleCodes, shopId);
    }

    if (input.fallbackRoleCodes && input.fallbackRoleCodes.length > 0) {
      return this.requireRolesByCodes(input.fallbackRoleCodes, shopId);
    }

    throw validationError([
      {
        field: 'role_ids',
        errors: ['Provide at least one role to assign'],
      },
    ]);
  }

  private async requireShopPermissions(permissionCodes: string[]) {
    const uniqueCodes = [
      ...new Set(
        permissionCodes
          .map((permissionCode) => permissionCode.trim())
          .filter((permissionCode) => permissionCode.length > 0),
      ),
    ].sort();

    const permissionRecords = await this.prisma.permission.findMany({
      where: {
        scope: 'shop',
        code: {
          in: uniqueCodes,
        },
      },
    });

    const missingPermissionCodes = uniqueCodes.filter(
      (permissionCode) =>
        !permissionRecords.some(
          (permissionRecord) => permissionRecord.code === permissionCode,
        ),
    );

    if (missingPermissionCodes.length > 0) {
      throw validationError([
        {
          field: 'permission_codes',
          errors: [
            `Unknown permission codes: ${missingPermissionCodes.join(', ')}.`,
          ],
        },
      ]);
    }

    return permissionRecords.sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  }

  private async assertUniqueCustomRoleName(
    shopId: string,
    name: string,
    excludeRoleId?: string,
  ) {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        shopId,
        scope: 'shop',
        isSystem: false,
        ...(excludeRoleId
          ? {
              NOT: {
                id: excludeRoleId,
              },
            }
          : {}),
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingRole) {
      throw conflictError('A custom role with this name already exists.');
    }
  }

  private async requireCustomShopRole(shopId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        shopId,
        scope: 'shop',
        isSystem: false,
      },
      include: {
        permissionAssignments: {
          include: {
            permission: true,
          },
        },
        memberAssignments: {
          where: {
            shopMember: {
              shopId,
            },
          },
        },
      },
    });

    if (!role) {
      throw notFoundError('Custom shop role not found');
    }

    return role;
  }

  private async generateCustomRoleCode(
    tx: ShopTransaction,
    shopId: string,
    roleName: string,
  ) {
    const prefix = `shop.${shopId}.`;
    const baseSlug = this.buildRoleSlug(roleName);

    for (let index = 0; index < 100; index += 1) {
      const suffix = index === 0 ? '' : `_${index + 1}`;
      const code = `${prefix}${baseSlug}${suffix}`;
      const existingRole = await tx.role.findUnique({
        where: { code },
      });

      if (!existingRole) {
        return code;
      }
    }

    throw conflictError('Unable to generate a unique role code right now.');
  }

  private buildRoleSlug(roleName: string) {
    const slug = roleName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32);

    return slug.length > 0 ? slug : 'custom_role';
  }

  private extractMemberAccess(member: MemberWithAccess) {
    const shopScopedAssignments = member.roleAssignments.filter(
      (assignment: { role: { scope: string } }) => assignment.role.scope === 'shop',
    );

    const roles = [...shopScopedAssignments]
      .map((assignment) => assignment.role)
      .sort((left, right) => {
        if (left.isSystem !== right.isSystem) {
          return left.isSystem ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      })
      .map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        is_system: role.isSystem,
      }));

    const permissionCodes = [
      ...new Set(
        shopScopedAssignments.flatMap((assignment) =>
          assignment.role.permissionAssignments.map(
            (permissionAssignment) => permissionAssignment.permission.code,
          ),
        ),
      ),
    ].sort();

    return {
      primaryRole: roles[0]?.code ?? null,
      primaryRoleName: roles[0]?.name ?? null,
      roles,
      permissions: permissionCodes,
    };
  }

  private serializeShopRecord(shop: ShopWithCount) {
    return {
      id: shop.id,
      owner_user_id: shop.ownerUserId,
      name: shop.name,
      timezone: shop.timezone,
      member_count: shop._count.members,
      created_at: shop.createdAt.toISOString(),
    };
  }

  private serializeMemberRecord(member: MemberWithAccess | null) {
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const access = this.extractMemberAccess(member);

    return {
      id: member.id,
      shop_id: member.shopId,
      user_id: member.userId,
      role: access.primaryRole,
      role_name: access.primaryRoleName,
      role_ids: access.roles.map((role) => role.id),
      roles: access.roles,
      status: member.status,
      created_at: member.createdAt.toISOString(),
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.user.phone,
        locale: member.user.locale,
      },
      permissions: access.permissions,
    };
  }

  private serializeRoleRecord(role: RoleWithAccess | null) {
    if (!role) {
      throw notFoundError('Shop role not found');
    }

    const permissionAssignments = [...(role.permissionAssignments ?? [])].sort(
      (left, right) => left.permission.code.localeCompare(right.permission.code),
    );

    return {
      id: role.id,
      shop_id: role.shopId ?? null,
      code: role.code,
      name: role.name,
      description: role.description,
      is_system: role.isSystem,
      member_count: role.memberAssignments?.length ?? 0,
      assignable: role.code !== ownerRoleCode,
      editable: !role.isSystem,
      deletable: !role.isSystem && (role.memberAssignments?.length ?? 0) === 0,
      permissions: permissionAssignments.map((assignment) => ({
        id: assignment.permission.id,
        code: assignment.permission.code,
        name: assignment.permission.name,
        description: assignment.permission.description,
      })),
      permission_codes: permissionAssignments.map(
        (assignment) => assignment.permission.code,
      ),
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
    };
  }

  private serializeAuditLogRecord(record: AuditLogRecord | null) {
    if (!record) {
      throw notFoundError('Shop audit log not found');
    }

    return {
      id: record.id,
      shop_id: record.shopId,
      action: record.action,
      entity_type: record.entityType,
      entity_id: record.entityId,
      summary: record.summary,
      metadata: record.metadata ?? null,
      created_at: record.createdAt.toISOString(),
      actor: record.actorUser
        ? {
            id: record.actorUser.id,
            name: record.actorUser.name,
          }
        : record.actorNameSnapshot
          ? {
              id: null,
              name: record.actorNameSnapshot,
            }
          : null,
    };
  }

  private async recordAuditLog(
    tx: ShopTransaction,
    input: {
      shopId: string;
      actorUser: AuthenticatedUser;
      action: string;
      entityType: string;
      entityId?: string | null;
      summary: string;
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    await tx.shopAuditLog.create({
      data: {
        shopId: input.shopId,
        actorUserId: input.actorUser.id,
        actorNameSnapshot: input.actorUser.name,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata ?? Prisma.JsonNull }
          : {}),
      },
    });
  }

  private async queueStaffInvitationEmail(
    user: {
      id: string;
      name: string;
      email: string | null;
    },
    shopId: string,
    memberId: string,
    roleNames: string[],
    metadata?: SessionRequestMetadata,
  ) {
    if (!user.email) {
      return false;
    }

    try {
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          name: true,
        },
      });

      const issuedToken = await this.issueEmailActionTokenForInvite(
        user,
        metadata,
      );

      await this.emailOutbox.queueAndSendTemplatedEmail({
        userId: user.id,
        shopId,
        toEmail: user.email,
        recipientName: user.name,
        templateKey: 'auth.staff_invitation',
        variables: {
          recipientName: user.name,
          shopName: shop?.name ?? 'shop workspace',
          roleNames: roleNames.join(', '),
          roleLine:
            roleNames.length > 0
              ? `Assigned roles: ${roleNames.join(', ')}`
              : null,
          ctaLabel: 'Set password and join',
          ctaUrl: `${this.getWebAppBaseUrl()}/accept-invite?token=${encodeURIComponent(
            issuedToken.rawToken,
          )}`,
          expiryText: `This invitation link expires in ${this.describeDuration(
            STAFF_INVITATION_TTL_MS,
          )}.`,
        },
        metadata: {
          purpose: 'staff_invitation',
          shop_id: shopId,
          member_id: memberId,
        },
      });

      return true;
    } catch {
      return false;
    }
  }

  private async issueEmailActionTokenForInvite(
    user: {
      id: string;
      email: string | null;
    },
    metadata?: SessionRequestMetadata,
  ) {
    if (!user.email) {
      throw conflictError('An email address is required for invitation delivery');
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashEmailActionToken(rawToken);
    const expiresAt = new Date(Date.now() + STAFF_INVITATION_TTL_MS);

    const token = await this.prisma.$transaction(async (tx) => {
      await tx.emailActionToken.updateMany({
        where: {
          userId: user.id,
          email: user.email!,
          purpose: 'staff_invitation',
          consumedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return tx.emailActionToken.create({
        data: {
          userId: user.id,
          email: user.email!,
          purpose: 'staff_invitation',
          tokenHash,
          expiresAt,
          requestedIpAddress: metadata?.ipAddress ?? null,
          requestedUserAgent: metadata?.userAgent ?? null,
        },
      });
    });

    return {
      rawToken,
      record: token,
    };
  }

  private hashEmailActionToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private getWebAppBaseUrl() {
    return (
      process.env.WEB_APP_BASE_URL?.trim() ||
      process.env.APP_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private describeDuration(valueMs: number) {
    const minutes = Math.floor(valueMs / 60_000);

    if (minutes % (24 * 60) === 0) {
      const days = minutes / (24 * 60);
      return `${days} day${days === 1 ? '' : 's'}`;
    }

    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  private normalizePhone(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private assertValidTimeZone(timeZone: string) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone });
    } catch {
      throw validationError([
        {
          field: 'timezone',
          errors: ['Timezone must be a valid IANA timezone'],
        },
      ]);
    }
  }
}
