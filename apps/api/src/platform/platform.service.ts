import { Injectable } from '@nestjs/common';
import { hashPassword } from '../common/auth/password';
import {
  notFoundError,
  validationError,
  type ErrorDetail,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import type { CreatePlatformShopDto } from './dto/create-platform-shop.dto';
import type { ListPlatformShopsQueryDto } from './dto/list-platform-shops-query.dto';
import type { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import type { UpdatePlatformShopDto } from './dto/update-platform-shop.dto';
import { DEFAULT_TRIAL_PLAN_CODE } from './platform-billing.constants';

type TenantSnapshot = {
  id: string;
  name: string;
  timezone: string;
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
  plan_code: string | null;
  plan_name: string | null;
  plan_price: number | null;
  plan_currency: string | null;
  billing_period: string | null;
  status: 'active' | 'trial' | 'expiring' | 'overdue' | 'inactive';
  member_count: number;
  customer_count: number;
  total_orders: number;
  delivered_orders: number;
  total_revenue: number;
  township: string | null;
  joined_at: string;
  last_active_at: string | null;
  active_session_count: number;
  current_period_end: string | null;
  latest_invoice: {
    invoice_no: string;
    amount: number;
    currency: string;
    status: string;
    due_at: string | null;
    paid_at: string | null;
  } | null;
};

type PaymentRow = {
  id: string;
  invoice_no: string;
  shop_id: string;
  shop_name: string;
  plan_code: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  provider_ref: string | null;
  status: string;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type SupportIssue = {
  id: string;
  kind: 'billing' | 'renewal' | 'onboarding' | 'adoption';
  severity: 'high' | 'medium' | 'low';
  shop_id: string;
  shop_name: string;
  title: string;
  detail: string;
  occurred_at: string;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const tenants = await this.loadTenantSnapshots(now);
    const payments = await this.loadPaymentRows();
    const supportIssues = this.buildSupportIssues(tenants, payments, now);
    const planSummaries = this.buildPlanSummaries(tenants, payments);

    const recentShops = tenants.slice(0, 6);
    const totalOrders = tenants.reduce((sum, tenant) => sum + tenant.total_orders, 0);
    const totalRevenue = tenants.reduce(
      (sum, tenant) => sum + tenant.total_revenue,
      0,
    );
    const monthlyRecurringRevenue = planSummaries
      .filter((plan) => plan.billing_period === 'monthly')
      .reduce((sum, plan) => sum + plan.monthly_recurring_revenue, 0);
    const yearlyPlanRevenue = planSummaries
      .filter((plan) => plan.billing_period === 'yearly')
      .reduce((sum, plan) => sum + plan.collected_revenue, 0);

    return {
      overview: {
        total_shops: tenants.length,
        active_shops: tenants.filter((tenant) => tenant.status === 'active')
          .length,
        trial_shops: tenants.filter(
          (tenant) => tenant.status === 'trial' || tenant.status === 'expiring',
        ).length,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        monthly_recurring_revenue: monthlyRecurringRevenue,
        projected_arr: monthlyRecurringRevenue * 12,
        yearly_plan_revenue: yearlyPlanRevenue,
        overdue_invoices: payments.filter((payment) => payment.status === 'overdue')
          .length,
      },
      revenue_series: this.buildRevenueSeries(now, tenants),
      subscription_mix: planSummaries.map((plan) => ({
        plan_code: plan.plan_code,
        plan_name: plan.plan_name,
        billing_period: plan.billing_period,
        shop_count: plan.shop_count,
        share: plan.share,
        monthly_recurring_revenue: plan.monthly_recurring_revenue,
        collected_revenue: plan.collected_revenue,
      })),
      health: {
        active_shops: tenants.filter((tenant) => tenant.status === 'active')
          .length,
        trials_expiring_this_week: tenants.filter(
          (tenant) => tenant.status === 'expiring',
        ).length,
        overdue_payments: payments.filter((payment) => payment.status === 'overdue')
          .length,
        average_orders_per_shop:
          tenants.length > 0 ? Number((totalOrders / tenants.length).toFixed(1)) : 0,
      },
      recent_shops: recentShops,
      attention_items: supportIssues.slice(0, 4),
    };
  }

  async listShops(query: ListPlatformShopsQueryDto) {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const normalizedStatus = query.status ?? 'all';
    const normalizedPlan = query.plan?.trim().toLowerCase() ?? '';
    const tenants = await this.loadTenantSnapshots(new Date());

    const filtered = tenants.filter((tenant) => {
      if (normalizedStatus !== 'all' && tenant.status !== normalizedStatus) {
        return false;
      }

      if (normalizedPlan && tenant.plan_code?.toLowerCase() !== normalizedPlan) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        tenant.name,
        tenant.owner_name,
        tenant.owner_email ?? '',
        tenant.township ?? '',
        tenant.plan_name ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });

    const page = paginate(filtered, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async getShop(shopId: string) {
    return this.loadTenantSnapshotById(shopId, new Date());
  }

  async createShop(body: CreatePlatformShopDto) {
    const timezone = body.timezone?.trim() || 'Asia/Yangon';
    this.assertValidTimeZone(timezone);
    const ownerRoles = await this.requireShopRoles(['owner']);

    const shop = await this.prisma.$transaction(async (tx) => {
      const owner = await this.resolveOwnerForPlatformShop(tx, {
        owner_user_id: body.owner_user_id,
        owner_name: body.owner_name,
        owner_email: body.owner_email,
        owner_phone: body.owner_phone,
        owner_password: body.owner_password,
      });

      const defaultTrialPlan = await (tx as any).plan.findUnique({
        where: { code: DEFAULT_TRIAL_PLAN_CODE },
        select: { id: true },
      });

      const createdShop = await tx.shop.create({
        data: {
          ownerUserId: owner.id,
          name: body.name.trim(),
          timezone,
        },
      });

      const member = await tx.shopMember.create({
        data: {
          shopId: createdShop.id,
          userId: owner.id,
          status: 'active',
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: ownerRoles.map((role) => ({
          shopMemberId: member.id,
          roleId: role.id,
        })),
      });

      if (defaultTrialPlan) {
        const startAt = new Date();
        const endAt = new Date(startAt);
        endAt.setDate(endAt.getDate() + 7);

        await (tx as any).subscription.create({
          data: {
            shopId: createdShop.id,
            planId: defaultTrialPlan.id,
            status: 'trialing',
            startAt,
            endAt,
            autoRenews: false,
          },
        });
      }

      return createdShop;
    });

    return this.loadTenantSnapshotById(shop.id, new Date());
  }

  async updateShop(shopId: string, body: UpdatePlatformShopDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: {
          include: {
            passwordCredential: true,
          },
        },
      },
    });

    if (!shop) {
      throw notFoundError('Shop not found');
    }

    if (
      !body.name &&
      !body.timezone &&
      !body.owner_name &&
      !body.owner_email &&
      !body.owner_phone &&
      !body.owner_password
    ) {
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

    await this.prisma.$transaction(async (tx) => {
      if (body.name || body.timezone) {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            ...(body.name ? { name: body.name.trim() } : {}),
            ...(body.timezone ? { timezone: body.timezone.trim() } : {}),
          },
        });
      }

      if (body.owner_name || body.owner_email || body.owner_phone) {
        await this.assertOwnerUniqueIdentifiers(tx, shop.owner.id, {
          owner_email: body.owner_email,
          owner_phone: body.owner_phone,
        });

        await tx.user.update({
          where: { id: shop.owner.id },
          data: {
            ...(body.owner_name ? { name: body.owner_name.trim() } : {}),
            ...(body.owner_email ? { email: body.owner_email.trim().toLowerCase() } : {}),
            ...(body.owner_phone
              ? { phone: this.normalizePhone(body.owner_phone) }
              : {}),
          },
        });
      }

      if (body.owner_password) {
        await tx.passwordCredential.upsert({
          where: {
            userId: shop.owner.id,
          },
          update: {
            passwordHash: await hashPassword(body.owner_password),
          },
          create: {
            userId: shop.owner.id,
            passwordHash: await hashPassword(body.owner_password),
          },
        });
      }
    });

    return this.loadTenantSnapshotById(shopId, new Date());
  }

  async deleteShop(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });

    if (!shop) {
      throw notFoundError('Shop not found');
    }

    await this.prisma.shop.delete({
      where: { id: shopId },
    });
  }

  async getSubscriptions(query: ListPlatformSubscriptionsQueryDto) {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const normalizedStatus = query.status ?? 'all';
    const tenants = await this.loadTenantSnapshots(new Date());
    const payments = await this.loadPaymentRows();

    const filteredInvoices = payments.filter((payment) => {
      if (normalizedStatus !== 'all' && payment.status !== normalizedStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        payment.invoice_no,
        payment.shop_name,
        payment.provider_ref ?? '',
        payment.plan_name,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });

    const page = paginate(filteredInvoices, query.limit, query.cursor);
    const overdueNotice =
      filteredInvoices.find((payment) => payment.status === 'overdue') ?? null;
    const planSummaries = this.buildPlanSummaries(tenants, payments);

    return {
      overview: {
        monthly_recurring_revenue: planSummaries
          .filter((plan) => plan.billing_period === 'monthly')
          .reduce((sum, plan) => sum + plan.monthly_recurring_revenue, 0),
        projected_arr: planSummaries
          .filter((plan) => plan.billing_period === 'monthly')
          .reduce((sum, plan) => sum + plan.monthly_recurring_revenue, 0) * 12,
        yearly_plan_revenue: planSummaries
          .filter((plan) => plan.billing_period === 'yearly')
          .reduce((sum, plan) => sum + plan.collected_revenue, 0),
        overdue_invoices: payments.filter((payment) => payment.status === 'overdue')
          .length,
        paid_invoices: payments.filter((payment) => payment.status === 'paid')
          .length,
      },
      overdue_notice: overdueNotice,
      invoices: page.items,
      invoices_pagination: page.pagination,
      upcoming_renewals: tenants
        .filter((tenant) => tenant.current_period_end !== null)
        .filter((tenant) => {
          const endAt = Date.parse(tenant.current_period_end!);
          return endAt >= Date.now() && endAt <= Date.now() + THIRTY_DAYS_MS;
        })
        .sort((left, right) =>
          String(left.current_period_end).localeCompare(String(right.current_period_end)),
        )
        .map((tenant) => ({
          shop_id: tenant.id,
          shop_name: tenant.name,
          plan_code: tenant.plan_code,
          plan_name: tenant.plan_name,
          amount: tenant.plan_price,
          currency: tenant.plan_currency,
          due_at: tenant.current_period_end,
          status: tenant.status,
        })),
      plans: planSummaries,
    };
  }

  async getSupport() {
    const now = new Date();
    const tenants = await this.loadTenantSnapshots(now);
    const payments = await this.loadPaymentRows();
    const issues = this.buildSupportIssues(tenants, payments, now);

    return {
      overview: {
        open_items: issues.length,
        high_priority_items: issues.filter((issue) => issue.severity === 'high')
          .length,
        onboarding_items: issues.filter((issue) => issue.kind === 'onboarding')
          .length,
        billing_items: issues.filter((issue) => issue.kind === 'billing').length,
      },
      issues,
      health: {
        total_shops: tenants.length,
        active_shops: tenants.filter((tenant) => tenant.status === 'active')
          .length,
        inactive_shops: tenants.filter((tenant) => tenant.status === 'inactive')
          .length,
        overdue_invoices: payments.filter((payment) => payment.status === 'overdue')
          .length,
      },
      recent_activity: tenants.slice(0, 8).map((tenant) => ({
        shop_id: tenant.id,
        shop_name: tenant.name,
        status: tenant.status,
        total_orders: tenant.total_orders,
        last_active_at: tenant.last_active_at,
      })),
    };
  }

  async getSettings(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        sessions: {
          where: {
            revokedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
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
    const plans = await (this.prisma as any).plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        subscriptions: {
          include: {
            payments: true,
          },
        },
      },
    });

    return {
      profile: {
        id: user?.id ?? currentUser.id,
        name: user?.name ?? currentUser.name,
        email: user?.email ?? currentUser.email,
        phone: user?.phone ?? currentUser.phone,
        locale: user?.locale ?? currentUser.locale,
        active_sessions:
          user?.sessions.filter((session) => session.accessExpiresAt > new Date())
            .length ?? 0,
        last_seen_at:
          user?.sessions
            .map((session) => session.lastUsedAt ?? session.createdAt)
            .filter((value): value is Date => value !== null)
            .sort((left, right) => right.getTime() - left.getTime())[0]
            ?.toISOString() ?? null,
      },
      access: {
        role: currentUser.platform?.role ?? null,
        roles: currentUser.platform?.roles ?? [],
        permissions: currentUser.platform?.permissions ?? [],
        role_count: user?.roleAssignments.length ?? 0,
        permission_count: [
          ...new Set(
            user?.roleAssignments.flatMap((assignment) =>
              assignment.role.permissionAssignments.map(
                (permissionAssignment) => permissionAssignment.permission.code,
              ),
            ) ?? [],
          ),
        ].length,
      },
      plans: plans.map((plan) => {
        const paidRevenue = plan.subscriptions.reduce(
          (sum, subscription) =>
            sum +
            subscription.payments
              .filter((payment) => payment.status === 'paid')
              .reduce((total, payment) => total + payment.amount, 0),
          0,
        );

        return {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          billing_period: plan.billingPeriod,
          price: plan.price,
          currency: plan.currency,
          is_active: plan.isActive,
          shop_count: plan.subscriptions.length,
          collected_revenue: paidRevenue,
        };
      }),
    };
  }

  private async loadTenantSnapshotById(
    shopId: string,
    now: Date,
  ): Promise<TenantSnapshot> {
    const [shop] = await this.loadTenantSnapshots(now, { id: shopId });

    if (!shop) {
      throw notFoundError('Shop not found');
    }

    return shop;
  }

  private async requireShopRoles(roleCodes: string[]) {
    const roles = await this.prisma.role.findMany({
      where: {
        code: {
          in: [...new Set(roleCodes.map((roleCode) => roleCode.trim()))],
        },
        scope: 'shop',
      },
    });

    const missingRoleCodes = roleCodes.filter(
      (roleCode) => !roles.some((role) => role.code === roleCode),
    );

    if (missingRoleCodes.length > 0) {
      throw notFoundError(
        `Roles not found: ${missingRoleCodes.join(', ')}. Seed RBAC defaults first.`,
      );
    }

    return roles;
  }

  private async resolveOwnerForPlatformShop(
    tx: any,
    input: {
      owner_user_id?: string;
      owner_name?: string;
      owner_email?: string;
      owner_phone?: string;
      owner_password?: string;
    },
  ) {
    const ownerUserId = input.owner_user_id?.trim() || null;
    const ownerName = input.owner_name?.trim() || null;
    const ownerEmail = input.owner_email?.trim().toLowerCase() || null;
    const ownerPhone = this.normalizePhone(input.owner_phone);

    const ownerByUserId = ownerUserId
      ? await tx.user.findUnique({
          where: { id: ownerUserId },
          include: { passwordCredential: true },
        })
      : null;
    const ownerByEmail = ownerEmail
      ? await tx.user.findUnique({
          where: { email: ownerEmail },
          include: { passwordCredential: true },
        })
      : null;
    const ownerByPhone = ownerPhone
      ? await tx.user.findUnique({
          where: { phone: ownerPhone },
          include: { passwordCredential: true },
        })
      : null;

    if (ownerUserId && !ownerByUserId) {
      throw validationError([
        {
          field: 'owner_user_id',
          errors: ['The selected owner account was not found'],
        },
      ]);
    }

    const ownerMatches = [ownerByUserId, ownerByEmail, ownerByPhone].filter(
      Boolean,
    );

    const uniqueOwners = ownerMatches.filter(
      (owner, index, allOwners) =>
        allOwners.findIndex((candidate) => candidate.id === owner.id) === index,
    );

    if (uniqueOwners.length > 1) {
      const details: ErrorDetail[] = [];

      if (ownerByUserId) {
        details.push({
          field: 'owner_user_id',
          errors: [
            'This owner account does not match the provided email or phone. Use one owner reference only.',
          ],
        });
      }

      if (ownerByEmail) {
        details.push({
          field: 'owner_email',
          errors: [
            'This email belongs to a different existing user than the other owner identifier.',
          ],
        });
      }

      if (ownerByPhone) {
        details.push({
          field: 'owner_phone',
          errors: [
            'This phone belongs to a different existing user than the other owner identifier.',
          ],
        });
      }

      throw validationError(
        details,
        'The provided owner identifiers refer to different existing users.',
      );
    }

    const existingOwner = uniqueOwners[0] ?? null;

    if (existingOwner) {
      await this.assertOwnerUniqueIdentifiers(tx, existingOwner.id, {
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
      });

      const updatedOwner = await tx.user.update({
        where: { id: existingOwner.id },
        data: {
          ...(ownerName ? { name: ownerName } : {}),
          ...(ownerEmail ? { email: ownerEmail } : {}),
          ...(ownerPhone ? { phone: ownerPhone } : {}),
        },
      });

      if (input.owner_password && !existingOwner.passwordCredential) {
        await tx.passwordCredential.create({
          data: {
            userId: existingOwner.id,
            passwordHash: await hashPassword(input.owner_password),
          },
        });
      }

      return updatedOwner;
    }

    if (!ownerEmail) {
      throw validationError([
        {
          field: 'owner_email',
          errors: ['Owner email is required when creating a new owner account'],
        },
      ]);
    }

    if (!ownerName) {
      throw validationError([
        {
          field: 'owner_name',
          errors: ['Owner name is required when creating a new owner account'],
        },
      ]);
    }

    if (!input.owner_password) {
      throw validationError([
        {
          field: 'owner_password',
          errors: [
            'Owner password is required when creating a new owner account',
          ],
        },
      ]);
    }

    await this.assertOwnerUniqueIdentifiers(tx, null, {
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
    });

    const owner = await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        locale: 'my',
      },
    });

    await tx.passwordCredential.create({
      data: {
        userId: owner.id,
        passwordHash: await hashPassword(input.owner_password),
      },
    });

    return owner;
  }

  private async assertOwnerUniqueIdentifiers(
    tx: any,
    currentUserId: string | null,
    input: {
      owner_email?: string | null;
      owner_phone?: string | null;
    },
  ) {
    if (input.owner_email) {
      const ownerByEmail = await tx.user.findUnique({
        where: { email: input.owner_email },
        select: { id: true },
      });

      if (ownerByEmail && ownerByEmail.id !== currentUserId) {
        throw validationError([
          {
            field: 'owner_email',
            errors: ['Owner email is already used by another account'],
          },
        ]);
      }
    }

    if (input.owner_phone) {
      const ownerByPhone = await tx.user.findUnique({
        where: { phone: input.owner_phone },
        select: { id: true },
      });

      if (ownerByPhone && ownerByPhone.id !== currentUserId) {
        throw validationError([
          {
            field: 'owner_phone',
            errors: ['Owner phone is already used by another account'],
          },
        ]);
      }
    }
  }

  private async loadTenantSnapshots(
    now: Date,
    where?: Record<string, unknown>,
  ): Promise<TenantSnapshot[]> {
    const shops = (await (this.prisma as any).shop.findMany({
      ...(where ? { where } : {}),
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                sessions: {
                  where: {
                    revokedAt: null,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  select: {
                    accessExpiresAt: true,
                    lastUsedAt: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
        customers: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            township: true,
          },
        },
        orders: {
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            status: true,
            totalPrice: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscription: {
          include: {
            plan: true,
            payments: {
              orderBy: [{ dueAt: 'desc' }, { createdAt: 'desc' }],
            },
          },
        },
      },
    })) as any[];

    return shops.map((shop) => {
      const sessions = shop.members.flatMap((member) => member.user.sessions);
      const activeSessionCount = sessions.filter(
        (session) => session.accessExpiresAt > now,
      ).length;
      const lastActivity = this.pickLatestDate([
        shop.createdAt,
        ...shop.orders.flatMap((order) => [order.updatedAt, order.createdAt]),
        ...sessions.flatMap((session) => [session.lastUsedAt, session.createdAt]),
        ...((shop.subscription?.payments ?? []).flatMap((payment) => [
          payment.paidAt,
          payment.updatedAt,
          payment.createdAt,
        ]) as Array<Date | null | undefined>),
      ]);
      const latestInvoice = [...(shop.subscription?.payments ?? [])].sort((left, right) =>
        this.sortByDateDesc(
          left.paidAt ?? left.dueAt ?? left.createdAt,
          right.paidAt ?? right.dueAt ?? right.createdAt,
        ),
      )[0];

      return {
        id: shop.id,
        name: shop.name,
        timezone: shop.timezone,
        owner_name: shop.owner.name,
        owner_email: shop.owner.email,
        owner_phone: shop.owner.phone,
        plan_code: shop.subscription?.plan.code ?? null,
        plan_name: shop.subscription?.plan.name ?? null,
        plan_price: shop.subscription?.plan.price ?? null,
        plan_currency: shop.subscription?.plan.currency ?? null,
        billing_period: shop.subscription?.plan.billingPeriod ?? null,
        status: this.deriveTenantStatus(shop, now),
        member_count: shop.members.length,
        customer_count: shop.customers.length,
        total_orders: shop.orders.length,
        delivered_orders: shop.orders.filter((order) => order.status === 'delivered')
          .length,
        total_revenue: shop.orders
          .filter((order) => order.status === 'delivered')
          .reduce((sum, order) => sum + order.totalPrice, 0),
        township:
          shop.customers.find((customer) => customer.township)?.township ?? null,
        joined_at: shop.createdAt.toISOString(),
        last_active_at: lastActivity?.toISOString() ?? null,
        active_session_count: activeSessionCount,
        current_period_end: shop.subscription?.endAt?.toISOString() ?? null,
        latest_invoice: latestInvoice
          ? {
              invoice_no: latestInvoice.invoiceNo,
              amount: latestInvoice.amount,
              currency: latestInvoice.currency,
              status: latestInvoice.status,
              due_at: latestInvoice.dueAt?.toISOString() ?? null,
              paid_at: latestInvoice.paidAt?.toISOString() ?? null,
            }
          : null,
      };
    });
  }

  private async loadPaymentRows(): Promise<PaymentRow[]> {
    const payments = (await (this.prisma as any).payment.findMany({
      orderBy: [{ dueAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        subscription: {
          include: {
            shop: true,
            plan: true,
          },
        },
      },
    })) as any[];

    return payments.map((payment) => ({
      id: payment.id,
      invoice_no: payment.invoiceNo,
      shop_id: payment.subscription.shopId,
      shop_name: payment.subscription.shop.name,
      plan_code: payment.subscription.plan.code,
      plan_name: payment.subscription.plan.name,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.paymentMethod,
      provider_ref: payment.providerRef,
      status: payment.status,
      due_at: payment.dueAt?.toISOString() ?? null,
      paid_at: payment.paidAt?.toISOString() ?? null,
      created_at: payment.createdAt.toISOString(),
    }));
  }

  private buildRevenueSeries(now: Date, tenants: TenantSnapshot[]) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    return days.map((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const totalRevenue = tenants.reduce((sum, tenant) => {
        const latestInvoice = tenant.latest_invoice;
        const invoicePaidAt = latestInvoice?.paid_at;
        if (!latestInvoice || !invoicePaidAt) {
          return sum;
        }

        const paidAt = Date.parse(invoicePaidAt);
        if (paidAt >= date.getTime() && paidAt < nextDate.getTime()) {
          return sum + latestInvoice.amount;
        }

        return sum;
      }, 0);

      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: totalRevenue,
      };
    });
  }

  private buildPlanSummaries(tenants: TenantSnapshot[], payments: PaymentRow[]) {
    const grouped = new Map<
      string,
      {
        plan_code: string;
        plan_name: string;
        billing_period: string;
        shop_count: number;
        monthly_recurring_revenue: number;
        collected_revenue: number;
      }
    >();

    for (const tenant of tenants) {
      if (!tenant.plan_code || !tenant.plan_name || !tenant.billing_period) {
        continue;
      }

      const existing = grouped.get(tenant.plan_code) ?? {
        plan_code: tenant.plan_code,
        plan_name: tenant.plan_name,
        billing_period: tenant.billing_period,
        shop_count: 0,
        monthly_recurring_revenue: 0,
        collected_revenue: 0,
      };
      existing.shop_count += 1;
      if (tenant.billing_period === 'monthly') {
        existing.monthly_recurring_revenue += tenant.plan_price ?? 0;
      }
      grouped.set(tenant.plan_code, existing);
    }

    for (const payment of payments.filter((row) => row.status === 'paid')) {
      const existing = grouped.get(payment.plan_code);
      if (!existing) {
        continue;
      }
      existing.collected_revenue += payment.amount;
    }

    return [...grouped.values()]
      .sort((left, right) => right.shop_count - left.shop_count)
      .map((plan) => ({
        ...plan,
        share: tenants.length > 0 ? Number((plan.shop_count / tenants.length).toFixed(4)) : 0,
      }));
  }

  private buildSupportIssues(
    tenants: TenantSnapshot[],
    payments: PaymentRow[],
    now: Date,
  ): SupportIssue[] {
    const issues: SupportIssue[] = [];

    for (const payment of payments.filter((row) => row.status === 'overdue')) {
      issues.push({
        id: `billing:${payment.id}`,
        kind: 'billing',
        severity: 'high',
        shop_id: payment.shop_id,
        shop_name: payment.shop_name,
        title: `Overdue invoice ${payment.invoice_no}`,
        detail: `${payment.amount.toLocaleString()} ${payment.currency} is still unpaid.`,
        occurred_at: payment.due_at ?? payment.created_at,
      });
    }

    for (const tenant of tenants) {
      if (
        tenant.status === 'expiring' &&
        tenant.current_period_end &&
        Date.parse(tenant.current_period_end) - now.getTime() <= THREE_DAYS_MS
      ) {
        issues.push({
          id: `renewal:${tenant.id}`,
          kind: 'renewal',
          severity: 'medium',
          shop_id: tenant.id,
          shop_name: tenant.name,
          title: 'Trial expires soon',
          detail: `${tenant.plan_name ?? 'Trial'} ends on ${tenant.current_period_end.slice(
            0,
            10,
          )}.`,
          occurred_at: tenant.current_period_end,
        });
      }

      if (
        Date.parse(tenant.joined_at) >= now.getTime() - SEVEN_DAYS_MS &&
        tenant.total_orders === 0
      ) {
        issues.push({
          id: `onboarding:${tenant.id}`,
          kind: 'onboarding',
          severity: 'medium',
          shop_id: tenant.id,
          shop_name: tenant.name,
          title: 'New shop has no orders yet',
          detail: 'This tenant may still need onboarding help or activation support.',
          occurred_at: tenant.joined_at,
        });
      }

      if (
        tenant.last_active_at &&
        Date.parse(tenant.last_active_at) < now.getTime() - FOURTEEN_DAYS_MS &&
        tenant.status === 'active'
      ) {
        issues.push({
          id: `adoption:${tenant.id}`,
          kind: 'adoption',
          severity: 'low',
          shop_id: tenant.id,
          shop_name: tenant.name,
          title: 'Active subscription with low recent activity',
          detail: 'Follow up on adoption before this tenant becomes a churn risk.',
          occurred_at: tenant.last_active_at,
        });
      }
    }

    const severityWeight = {
      high: 3,
      medium: 2,
      low: 1,
    } as const;

    return issues.sort((left, right) => {
      const severityDiff =
        severityWeight[right.severity] - severityWeight[left.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }

      return this.sortByDateDesc(left.occurred_at, right.occurred_at);
    });
  }

  private deriveTenantStatus(shop: any, now: Date) {
    const overdueInvoice = (shop.subscription?.payments ?? []).find(
      (payment: any) => payment.status === 'overdue',
    );

    if (overdueInvoice) {
      return 'overdue';
    }

    const subscription = shop.subscription;
    if (!subscription) {
      return 'inactive';
    }

    if (subscription.status === 'trialing') {
      if (
        subscription.endAt &&
        subscription.endAt.getTime() <= now.getTime() + SEVEN_DAYS_MS
      ) {
        return 'expiring';
      }

      return 'trial';
    }

    if (['expired', 'cancelled', 'inactive'].includes(subscription.status)) {
      return 'inactive';
    }

    return 'active';
  }

  private pickLatestDate(
    dates: Array<Date | null | undefined>,
  ): Date | null {
    const normalized = dates.filter((value): value is Date => value instanceof Date);
    if (normalized.length === 0) {
      return null;
    }

    return normalized.sort((left, right) => right.getTime() - left.getTime())[0];
  }

  private sortByDateDesc(
    left: string | Date | null | undefined,
    right: string | Date | null | undefined,
  ) {
    return this.toTimestamp(right) - this.toTimestamp(left);
  }

  private toTimestamp(value: string | Date | null | undefined) {
    if (!value) {
      return 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return Date.parse(value);
  }

  private normalizePhone(value: string | undefined | null): string | null {
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
