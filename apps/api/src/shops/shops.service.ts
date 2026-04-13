import { Injectable } from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { permissions, type Permission } from '../common/http/rbac.constants';
import type { SubscriptionFeatureCode } from '../platform/subscription-feature.constants';
import { SubscriptionLifecycleService } from '../platform/subscription-lifecycle.service';
import { AddShopMemberDto } from './dto/add-shop-member.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopMemberDto } from './dto/update-shop-member.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

type ShopWithCount = any & {
  _count: {
    members: number;
  };
};

type MemberWithAccess = any;
const allowedOperationalSubscriptionStatuses = new Set([
  'trialing',
  'active',
  'overdue',
]);

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
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

    const ownerRole = await this.requireRolesByCodes(['owner']);

    const created = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          ownerUserId: currentUser.id,
          name: body.name,
          timezone,
        },
      });

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
    await this.assertPermission(currentUser.id, shopId, permissions.shopsWrite);
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

  async addMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: AddShopMemberDto,
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
    const roleCodes = body.role_codes ?? ['staff'];

    if (!userId && !email && !phone) {
      throw validationError([
        {
          field: 'user_id',
          errors: ['Provide user_id, email, or phone to identify the member'],
        },
      ]);
    }

    let targetUser =
      (userId &&
        (await this.prisma.user.findUnique({
          where: { id: userId },
        }))) ||
      (email &&
        (await this.prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        }))) ||
      (phone &&
        (await this.prisma.user.findUnique({
          where: { phone: phone.replace(/\s+/g, ' ').trim() },
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
      });
    }

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

    const roles = await this.requireRolesByCodes(roleCodes);
    const member = await this.prisma.$transaction(async (tx) => {
      const createdMember = await tx.shopMember.create({
        data: {
          shopId,
          userId: targetUser.id,
          status: 'active',
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: roles.map((role) => ({
          shopMemberId: createdMember.id,
          roleId: role.id,
        })),
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

    return this.serializeMemberRecord(member);
  }

  async updateMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    body: UpdateShopMemberDto,
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

    if (!body.status && !body.role_codes) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide status or role_codes to update the shop member'],
        },
      ]);
    }

    const roles = body.role_codes
      ? await this.requireRolesByCodes(body.role_codes)
      : null;

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

    await this.subscriptionLifecycle.expireElapsedTrials();

    const subscription = await this.prisma.subscription.findUnique({
      where: { shopId },
      include: {
        plan: {
          include: {
            items: true,
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
    const missing = requested.filter((feature) => !availableFeatures.has(feature));

    if (missing.length > 0) {
      throw forbiddenError(
        'This feature is not available on the current subscription plan.',
      );
    }

    return {
      ...result,
      subscription,
      availableFeatures: [...availableFeatures],
    };
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

  private async requireRolesByCodes(roleCodes: string[]) {
    const uniqueRoleCodes = [
      ...new Set(roleCodes.map((role) => role.trim())),
    ].sort();
    const roles = await this.prisma.role.findMany({
      where: {
        code: {
          in: uniqueRoleCodes,
        },
        scope: 'shop',
      },
    });

    const missingRoleCodes = uniqueRoleCodes.filter(
      (code) => !roles.some((role) => role.code === code),
    );
    if (missingRoleCodes.length > 0) {
      throw notFoundError(
        `Roles not found: ${missingRoleCodes.join(', ')}. Seed RBAC defaults first.`,
      );
    }

    return roles.sort((left, right) => left.code.localeCompare(right.code));
  }

  private extractMemberAccess(member: MemberWithAccess) {
    const shopScopedAssignments = member.roleAssignments.filter(
      (assignment: { role: { scope: string } }) => assignment.role.scope === 'shop',
    );

    const roles = [...shopScopedAssignments]
      .map((assignment) => assignment.role)
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
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
