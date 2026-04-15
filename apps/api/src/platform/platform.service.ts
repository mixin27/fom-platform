import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { hashPassword } from '../common/auth/password';
import {
  conflictError,
  notFoundError,
  validationError,
  type ErrorDetail,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import { EmailOutboxService } from '../email/email-outbox.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { CreatePlatformPlanDto } from './dto/create-platform-plan.dto';
import type { CreatePlatformShopDto } from './dto/create-platform-shop.dto';
import type { CreatePlatformInvoiceDto } from './dto/create-platform-invoice.dto';
import type { CreatePlatformSupportIssueDto } from './dto/create-platform-support-issue.dto';
import type { ListPlatformShopsQueryDto } from './dto/list-platform-shops-query.dto';
import type { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import type { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';
import type { SearchPlatformOwnerAccountsQueryDto } from './dto/search-platform-owner-accounts-query.dto';
import type { UpdatePlatformInvoiceDto } from './dto/update-platform-invoice.dto';
import type { UpdatePlatformPlanDto } from './dto/update-platform-plan.dto';
import type { UpdatePlatformSettingsProfileDto } from './dto/update-platform-settings-profile.dto';
import type { UpdatePlatformShopDto } from './dto/update-platform-shop.dto';
import type { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';
import type { UpdatePlatformSupportIssueDto } from './dto/update-platform-support-issue.dto';
import { platformSubscriptionStatuses } from './platform-billing.constants';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import {
  platformSupportIssueKinds,
  platformSupportIssueSeverities,
  platformSupportIssueSources,
  platformSupportIssueStatuses,
} from './platform-support.constants';

type TenantSnapshot = {
  id: string;
  name: string;
  timezone: string;
  owner_user_id: string;
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
  subscription_id: string;
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

type SubscriptionRow = {
  id: string;
  shop_id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string | null;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  plan_price: number;
  plan_currency: string;
  billing_period: string;
  status: string;
  auto_renews: boolean;
  start_at: string;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  latest_invoice: PaymentRow | null;
  invoice_count: number;
};

type PlanOptionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_period: string;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  items: PlanItemRow[];
  limits: PlanLimitRow[];
};

type PlanItemRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  availability_status: string;
  sort_order: number;
};

type PlanLimitRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  value: number | null;
  sort_order: number;
};

type SupportIssue = {
  id: string;
  kind: (typeof platformSupportIssueKinds)[number];
  severity: (typeof platformSupportIssueSeverities)[number];
  status: (typeof platformSupportIssueStatuses)[number];
  source: (typeof platformSupportIssueSources)[number];
  shop_id: string | null;
  shop_name: string;
  title: string;
  detail: string;
  occurred_at: string;
  assigned_to_user_id: string | null;
  assigned_to_user_name: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
};

type PlatformOwnerAccount = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active_shop_count: number;
  owned_shop_count: number;
  has_password_credential: boolean;
};

type PlatformUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  created_at: string;
  last_active_at: string | null;
  active_session_count: number;
  auth_methods: string[];
  access_type: 'platform' | 'shop_owner' | 'staff' | 'no_shop';
  platform_roles: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  platform_permissions_count: number;
  owned_shop_count: number;
  active_shop_count: number;
  shops: Array<{
    shop_id: string;
    shop_name: string;
    membership_status: string;
    role: string | null;
  }>;
};

type DetectedSupportIssue = {
  issue_key: string;
  source: 'system';
  kind: (typeof platformSupportIssueKinds)[number];
  severity: (typeof platformSupportIssueSeverities)[number];
  status: 'open';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailOutbox: EmailOutboxService,
    private readonly subscriptionLifecycle: SubscriptionLifecycleService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const tenants = await this.loadTenantSnapshots(now);
    const payments = await this.loadPaymentRows();
    const supportIssues = await this.syncAndLoadSupportIssues(
      tenants,
      payments,
      now,
    );
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

  async listUsers(query: ListPlatformUsersQueryDto) {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const normalizedAccess = query.access ?? 'all';
    const users = await this.prisma.user.findMany({
      include: {
        ownedShops: {
          select: {
            id: true,
          },
        },
        memberships: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
            roleAssignments: {
              include: {
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
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
                    permission: {
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        passwordCredential: {
          select: {
            userId: true,
          },
        },
        authIdentities: {
          select: {
            provider: true,
          },
        },
        sessions: {
          where: {
            revokedAt: null,
          },
          select: {
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    const rows = users
      .map((user) => {
        const platformRoles = user.roleAssignments.map((assignment) => ({
          id: assignment.role.id,
          code: assignment.role.code,
          name: assignment.role.name,
        }));
        const platformPermissionsCount = new Set(
          user.roleAssignments.flatMap((assignment) =>
            assignment.role.permissionAssignments.map(
              (permissionAssignment) => permissionAssignment.permission.id,
            ),
          ),
        ).size;
        const shopRows = user.memberships
          .map((membership) => ({
            shop_id: membership.shop.id,
            shop_name: membership.shop.name,
            membership_status: membership.status,
            role:
              membership.roleAssignments
                .map((assignment) => assignment.role.code)
                .sort()[0] ?? null,
          }))
          .sort((left, right) => left.shop_name.localeCompare(right.shop_name));
        const activeShopCount = user.memberships.filter(
          (membership) => membership.status === 'active',
        ).length;
        const hasOwnerRole = shopRows.some((shop) => shop.role === 'owner');
        const accessType: PlatformUserRow['access_type'] =
          platformRoles.length > 0
            ? 'platform'
            : user.ownedShops.length > 0 || hasOwnerRole
              ? 'shop_owner'
              : activeShopCount > 0
                ? 'staff'
                : 'no_shop';
        const lastActiveAt = user.sessions.reduce<Date | null>((latest, session) => {
          const candidate = session.lastUsedAt ?? session.createdAt;

          if (!latest || candidate.getTime() > latest.getTime()) {
            return candidate;
          }

          return latest;
        }, null);
        const authMethods = [
          ...(user.passwordCredential ? ['password'] : []),
          ...new Set(user.authIdentities.map((identity) => identity.provider)),
        ].sort((left, right) => left.localeCompare(right));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          locale: user.locale,
          created_at: user.createdAt.toISOString(),
          last_active_at: lastActiveAt?.toISOString() ?? null,
          active_session_count: user.sessions.length,
          auth_methods: authMethods,
          access_type: accessType,
          platform_roles: platformRoles,
          platform_permissions_count: platformPermissionsCount,
          owned_shop_count: user.ownedShops.length,
          active_shop_count: activeShopCount,
          shops: shopRows,
        } satisfies PlatformUserRow;
      })
      .filter((user) => {
        if (normalizedAccess !== 'all' && user.access_type !== normalizedAccess) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          user.name,
          user.email ?? '',
          user.phone ?? '',
          ...user.auth_methods,
          ...user.platform_roles.map((role) => role.name),
          ...user.shops.map((shop) => shop.shop_name),
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        const leftLastActive = Date.parse(left.last_active_at ?? left.created_at);
        const rightLastActive = Date.parse(right.last_active_at ?? right.created_at);

        if (leftLastActive !== rightLastActive) {
          return rightLastActive - leftLastActive;
        }

        return left.name.localeCompare(right.name);
      });

    const page = paginate(rows, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async searchOwnerAccounts(query: SearchPlatformOwnerAccountsQueryDto) {
    const normalizedQuery = query.query?.trim() ?? '';
    const limit = query.limit ?? 8;

    if (!normalizedQuery) {
      return [] as PlatformOwnerAccount[];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: normalizedQuery.toLowerCase(),
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: normalizedQuery,
            },
          },
        ],
      },
      take: limit,
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
      include: {
        memberships: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
          },
        },
        ownedShops: {
          select: {
            id: true,
          },
        },
        passwordCredential: {
          select: {
            userId: true,
          },
        },
      },
    });

    const exactEmailQuery = normalizedQuery.toLowerCase();
    const normalizedPhoneQuery = this.normalizePhone(normalizedQuery) ?? normalizedQuery;

    return users
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        active_shop_count: user.memberships.length,
        owned_shop_count: user.ownedShops.length,
        has_password_credential: user.passwordCredential !== null,
      }))
      .sort((left, right) => {
        const leftExact =
          left.email?.toLowerCase() === exactEmailQuery ||
          left.phone === normalizedPhoneQuery;
        const rightExact =
          right.email?.toLowerCase() === exactEmailQuery ||
          right.phone === normalizedPhoneQuery;

        if (leftExact !== rightExact) {
          return leftExact ? -1 : 1;
        }

        if (left.active_shop_count !== right.active_shop_count) {
          return right.active_shop_count - left.active_shop_count;
        }

        return left.name.localeCompare(right.name);
      });
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

      await this.subscriptionLifecycle.createDefaultTrialSubscription(
        tx,
        createdShop.id,
      );

      return createdShop;
    });

    void this.emitPlatformInvalidation({
      resource: 'shops',
      action: 'created',
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
      !body.owner_user_id &&
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
      let effectiveOwnerId = shop.owner.id;

      if (body.name || body.timezone) {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            ...(body.name ? { name: body.name.trim() } : {}),
            ...(body.timezone ? { timezone: body.timezone.trim() } : {}),
          },
        });
      }

      const matchedExistingOwner =
        body.owner_user_id || body.owner_email || body.owner_phone
          ? await this.findExistingOwnerForPlatformShop(tx, {
              owner_user_id: body.owner_user_id,
              owner_email: body.owner_email,
              owner_phone: body.owner_phone,
            })
          : null;

      if (matchedExistingOwner && matchedExistingOwner.id !== shop.owner.id) {
        const ownerRoles = await this.requireShopRoles(['owner']);
        await this.reassignPlatformShopOwner(tx, {
          shopId,
          previousOwnerUserId: shop.owner.id,
          nextOwnerUserId: matchedExistingOwner.id,
          ownerRoleIds: ownerRoles.map((role) => role.id),
        });
        effectiveOwnerId = matchedExistingOwner.id;
      }

      if (
        body.owner_name ||
        body.owner_email ||
        body.owner_phone ||
        body.owner_user_id
      ) {
        await this.assertOwnerUniqueIdentifiers(tx, effectiveOwnerId, {
          owner_email: body.owner_email,
          owner_phone: body.owner_phone,
        });

        const ownerUpdateData = {
          ...(body.owner_name ? { name: body.owner_name.trim() } : {}),
          ...(body.owner_email
            ? { email: body.owner_email.trim().toLowerCase() }
            : {}),
          ...(body.owner_phone
            ? { phone: this.normalizePhone(body.owner_phone) }
            : {}),
        };

        if (Object.keys(ownerUpdateData).length > 0) {
          await tx.user.update({
            where: { id: effectiveOwnerId },
            data: ownerUpdateData,
          });
        }
      }

      if (body.owner_password) {
        await tx.passwordCredential.upsert({
          where: {
            userId: effectiveOwnerId,
          },
          update: {
            passwordHash: await hashPassword(body.owner_password),
          },
          create: {
            userId: effectiveOwnerId,
            passwordHash: await hashPassword(body.owner_password),
          },
        });
      }
    });

    void this.emitPlatformInvalidation({
      resource: 'shops',
      action: 'updated',
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

    void this.emitPlatformInvalidation({
      resource: 'shops',
      action: 'deleted',
    });
  }

  async getSubscriptions(query: ListPlatformSubscriptionsQueryDto) {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const normalizedStatus = query.status ?? 'all';
    const normalizedSubscriptionStatus = query.subscription_status ?? 'all';
    const normalizedPlan = query.plan?.trim().toLowerCase() ?? '';
    const tenants = await this.loadTenantSnapshots(new Date());
    const payments = await this.loadPaymentRows();
    const subscriptions = await this.loadSubscriptionRows();
    const availablePlans = await this.loadPlanOptions();

    const filteredInvoices = payments.filter((payment) => {
      if (normalizedStatus !== 'all' && payment.status !== normalizedStatus) {
        return false;
      }

      if (normalizedPlan && payment.plan_code.toLowerCase() !== normalizedPlan) {
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

    const filteredSubscriptions = subscriptions.filter((subscription) => {
      if (
        normalizedSubscriptionStatus !== 'all' &&
        subscription.status !== normalizedSubscriptionStatus
      ) {
        return false;
      }

      if (normalizedPlan && subscription.plan_code.toLowerCase() !== normalizedPlan) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        subscription.shop_name,
        subscription.owner_name,
        subscription.owner_email ?? '',
        subscription.plan_name,
        subscription.latest_invoice?.invoice_no ?? '',
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
      subscriptions: filteredSubscriptions,
      available_plans: availablePlans,
      plans: planSummaries,
    };
  }

  async updateSubscription(
    subscriptionId: string,
    body: UpdatePlatformSubscriptionDto,
  ) {
    const subscription = await (this.prisma as any).subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw notFoundError('Subscription not found');
    }

    if (
      body.plan_code === undefined &&
      body.plan_id === undefined &&
      body.status === undefined &&
      body.start_at === undefined &&
      body.end_at === undefined &&
      body.auto_renews === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const resolvedPlan = await this.resolvePlanReference({
      planId: body.plan_id,
      planCode: body.plan_code,
      currentPlanId: subscription.planId,
    });
    const nextStartAt =
      body.start_at !== undefined ? new Date(body.start_at) : subscription.startAt;
    const nextEndAt =
      body.end_at !== undefined
        ? body.end_at
          ? new Date(body.end_at)
          : null
        : subscription.endAt;

    if (nextEndAt && nextEndAt.getTime() < nextStartAt.getTime()) {
      throw validationError([
        {
          field: 'end_at',
          errors: ['End date must be on or after the start date'],
        },
      ]);
    }

    await (this.prisma as any).subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(resolvedPlan ? { planId: resolvedPlan.id } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.start_at !== undefined ? { startAt: nextStartAt } : {}),
        ...(body.end_at !== undefined ? { endAt: nextEndAt } : {}),
        ...(body.auto_renews !== undefined ? { autoRenews: body.auto_renews } : {}),
      },
    });

    void this.emitPlatformInvalidation({
      resource: 'subscriptions',
      action: 'updated',
    });

    return this.loadSubscriptionRowById(subscriptionId);
  }

  async createInvoice(
    subscriptionId: string,
    body: CreatePlatformInvoiceDto,
  ) {
    const subscription = await (this.prisma as any).subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw notFoundError('Subscription not found');
    }

    const invoiceStatus = body.status ?? 'pending';
    const paidAt = this.resolvePaidAtForCreate(invoiceStatus, body.paid_at);
    const dueAt =
      body.due_at !== undefined
        ? body.due_at
          ? new Date(body.due_at)
          : null
        : subscription.endAt ?? null;

    const createdInvoiceId = await this.prisma.$transaction(async (tx) => {
      const invoice = await (tx as any).payment.create({
        data: {
          subscriptionId,
          invoiceNo: await this.generateInvoiceNo(tx),
          amount: body.amount ?? subscription.plan.price,
          currency: body.currency?.trim() || subscription.plan.currency,
          status: invoiceStatus,
          paymentMethod: body.payment_method?.trim() || null,
          providerRef: body.provider_ref?.trim() || null,
          dueAt,
          paidAt,
        },
        select: {
          id: true,
        },
      });

      await this.syncSubscriptionStatusFromInvoices(tx, subscriptionId);
      return invoice.id;
    });

    const createdInvoice = await this.loadPaymentRowById(createdInvoiceId);
    void this.sendInvoiceNoticeEmail(createdInvoiceId, 'platform.invoice_notice');
    void this.emitPlatformInvalidation({
      resource: 'subscriptions',
      action: 'invoice_created',
    });
    return createdInvoice;
  }

  async updateInvoice(invoiceId: string, body: UpdatePlatformInvoiceDto) {
    const invoice = await (this.prisma as any).payment.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!invoice) {
      throw notFoundError('Invoice not found');
    }

    if (
      body.amount === undefined &&
      body.currency === undefined &&
      body.status === undefined &&
      body.payment_method === undefined &&
      body.provider_ref === undefined &&
      body.due_at === undefined &&
      body.paid_at === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const nextStatus = body.status ?? invoice.status;
    const nextPaidAt = this.resolvePaidAtForUpdate(invoice, nextStatus, body.paid_at);
    const nextDueAt =
      body.due_at !== undefined
        ? body.due_at
          ? new Date(body.due_at)
          : null
        : invoice.dueAt;

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).payment.update({
        where: { id: invoiceId },
        data: {
          ...(body.amount !== undefined ? { amount: body.amount } : {}),
          ...(body.currency !== undefined ? { currency: body.currency.trim() } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.payment_method !== undefined
            ? { paymentMethod: body.payment_method?.trim() || null }
            : {}),
          ...(body.provider_ref !== undefined
            ? { providerRef: body.provider_ref?.trim() || null }
            : {}),
          ...(body.due_at !== undefined ? { dueAt: nextDueAt } : {}),
          ...(body.paid_at !== undefined || body.status !== undefined
            ? { paidAt: nextPaidAt }
            : {}),
        },
      });

      await this.syncSubscriptionStatusFromInvoices(tx, invoice.subscriptionId);
    });

    const updatedInvoice = await this.loadPaymentRowById(invoiceId);
    void this.sendInvoiceNoticeEmail(
      invoiceId,
      nextStatus === 'overdue'
        ? 'platform.billing_notice'
        : 'platform.invoice_notice',
    );
    void this.emitPlatformInvalidation({
      resource: 'subscriptions',
      action: 'invoice_updated',
    });
    return updatedInvoice;
  }

  async getSupport() {
    const now = new Date();
    const tenants = await this.loadTenantSnapshots(now);
    const payments = await this.loadPaymentRows();
    const issues = await this.syncAndLoadSupportIssues(tenants, payments, now);

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

  async createSupportIssue(
    currentUser: AuthenticatedUser,
    body: CreatePlatformSupportIssueDto,
  ) {
    const shopId = body.shop_id ?? null;
    const shop = await this.resolveSupportShop(shopId);
    const assignee = await this.resolveSupportAssignee(body.assigned_to_user_id);
    const status = body.status ?? 'open';
    const isClosed = this.isSupportIssueClosed(status);
    const now = new Date();

    const issue = await (this.prisma as any).platformSupportIssue.create({
      data: {
        source: 'manual',
        kind: body.kind,
        severity: body.severity ?? 'medium',
        status,
        shopId: shop?.id ?? null,
        shopNameSnapshot: shop?.name ?? null,
        title: body.title,
        detail: body.detail,
        occurredAt: body.occurred_at ? new Date(body.occurred_at) : now,
        isActive: !isClosed,
        assignedToUserId: assignee?.id ?? null,
        resolutionNote: body.resolution_note ?? null,
        resolvedAt: isClosed ? now : null,
        createdByUserId: currentUser.id,
      },
    });

    void this.emitPlatformInvalidation({
      resource: 'support',
      action: 'created',
    });

    return this.loadSupportIssueById(issue.id);
  }

  async updateSupportIssue(issueId: string, body: UpdatePlatformSupportIssueDto) {
    const issue = await (this.prisma as any).platformSupportIssue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw notFoundError('Support issue not found');
    }

    if (
      body.kind === undefined &&
      body.severity === undefined &&
      body.status === undefined &&
      body.title === undefined &&
      body.detail === undefined &&
      body.shop_id === undefined &&
      body.assigned_to_user_id === undefined &&
      body.resolution_note === undefined &&
      body.occurred_at === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const shop = await this.resolveSupportShop(body.shop_id);
    const assignee = await this.resolveSupportAssignee(body.assigned_to_user_id);
    const nextStatus = body.status ?? issue.status;
    const nextIsClosed = this.isSupportIssueClosed(nextStatus);
    const clearsResolutionState =
      body.status !== undefined && !nextIsClosed && this.isSupportIssueClosed(issue.status);

    await (this.prisma as any).platformSupportIssue.update({
      where: { id: issueId },
      data: {
        ...(body.kind !== undefined ? { kind: body.kind } : {}),
        ...(body.severity !== undefined ? { severity: body.severity } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.detail !== undefined ? { detail: body.detail } : {}),
        ...(body.shop_id !== undefined
          ? {
              shopId: shop?.id ?? null,
              shopNameSnapshot: shop?.name ?? null,
            }
          : {}),
        ...(body.assigned_to_user_id !== undefined
          ? { assignedToUserId: assignee?.id ?? null }
          : {}),
        ...(body.resolution_note !== undefined
          ? { resolutionNote: body.resolution_note }
          : {}),
        ...(body.occurred_at !== undefined
          ? {
              occurredAt: body.occurred_at ? new Date(body.occurred_at) : issue.occurredAt,
            }
          : {}),
        ...(body.status !== undefined
          ? {
              isActive: !nextIsClosed,
              resolvedAt: nextIsClosed ? issue.resolvedAt ?? new Date() : null,
              ...(clearsResolutionState && body.resolution_note === undefined
                ? { resolutionNote: null }
                : {}),
            }
          : {}),
      },
    });

    void this.emitPlatformInvalidation({
      resource: 'support',
      action: 'updated',
    });

    return this.loadSupportIssueById(issueId);
  }

  async getSettings(currentUser: AuthenticatedUser) {
    return this.buildSettingsPayload(currentUser);
  }

  async updateSettingsProfile(
    currentUser: AuthenticatedUser,
    body: UpdatePlatformSettingsProfileDto,
  ) {
    if (
      body.name === undefined &&
      body.email === undefined &&
      body.phone === undefined &&
      body.locale === undefined &&
      body.password === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw notFoundError('User not found');
    }

    const normalizedEmail = body.email?.trim().toLowerCase();
    const normalizedPhone = body.phone?.replace(/\s+/g, ' ').trim();

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (existingEmail) {
        throw conflictError('Email is already registered');
      }
    }

    if (normalizedPhone && normalizedPhone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });

      if (existingPhone) {
        throw conflictError('Phone number is already registered');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.locale !== undefined ? { locale: body.locale } : {}),
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        },
      });

      if (body.password !== undefined) {
        await tx.passwordCredential.upsert({
          where: { userId: user.id },
          update: {
            passwordHash: await hashPassword(body.password),
          },
          create: {
            userId: user.id,
            passwordHash: await hashPassword(body.password),
          },
        });
      }
    });

    void this.emitPlatformInvalidation({
      resource: 'settings',
      action: 'updated',
    });

    return this.buildSettingsPayload(currentUser);
  }

  async updateSettingsPlan(planId: string, body: UpdatePlatformPlanDto) {
    const plan = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      select: { id: true, code: true },
    });

    if (!plan) {
      throw notFoundError('Plan not found');
    }

    if (
      body.code === undefined &&
      body.name === undefined &&
      body.description === undefined &&
      body.price === undefined &&
      body.currency === undefined &&
      body.billing_period === undefined &&
      body.is_active === undefined &&
      body.sort_order === undefined &&
      body.items === undefined &&
      body.limits === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    if (body.code && body.code !== plan.code) {
      const existingPlanCode = await (this.prisma as any).plan.findUnique({
        where: { code: body.code },
        select: { id: true },
      });

      if (existingPlanCode) {
        throw conflictError('Plan code is already in use');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).plan.update({
        where: { id: planId },
        data: {
          ...(body.code !== undefined ? { code: body.code } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.price !== undefined ? { price: body.price } : {}),
          ...(body.currency !== undefined
            ? { currency: body.currency.trim().toUpperCase() }
            : {}),
          ...(body.billing_period !== undefined
            ? { billingPeriod: body.billing_period.trim() }
            : {}),
          ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
          ...(body.sort_order !== undefined ? { sortOrder: body.sort_order } : {}),
        },
      });

      if (body.items !== undefined) {
        await this.syncPlanItems(tx, planId, body.items);
      }

      if (body.limits !== undefined) {
        await this.syncPlanLimits(tx, planId, body.limits);
      }
    });

    void this.emitPlatformInvalidation({
      resource: 'plans',
      action: 'updated',
    });

    return this.loadPlanSettingsRowById(planId);
  }

  async createSettingsPlan(body: CreatePlatformPlanDto) {
    const existingPlan = await (this.prisma as any).plan.findUnique({
      where: { code: body.code },
      select: { id: true },
    });

    if (existingPlan) {
      throw conflictError('Plan code is already in use');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const plan = await (tx as any).plan.create({
        data: {
          code: body.code,
          name: body.name,
          description: body.description ?? null,
          price: body.price,
          currency: body.currency?.trim().toUpperCase() || 'MMK',
          billingPeriod: body.billing_period.trim(),
          isActive: body.is_active ?? true,
          sortOrder: body.sort_order ?? 0,
        },
        select: { id: true },
      });

      if (body.items && body.items.length > 0) {
        await this.syncPlanItems(tx, plan.id, body.items);
      }

      if (body.limits && body.limits.length > 0) {
        await this.syncPlanLimits(tx, plan.id, body.limits);
      }

      return plan;
    });

    void this.emitPlatformInvalidation({
      resource: 'plans',
      action: 'created',
    });

    return this.loadPlanSettingsRowById(created.id);
  }

  async deleteSettingsPlan(planId: string) {
    const plan = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw notFoundError('Plan not found');
    }

    if (plan._count.subscriptions > 0) {
      throw conflictError(
        'Cannot delete a plan that still has subscriptions. Reassign or deactivate it first.',
      );
    }

    await (this.prisma as any).plan.delete({
      where: { id: planId },
    });

    void this.emitPlatformInvalidation({
      resource: 'plans',
      action: 'deleted',
    });
  }

  async getPublicPlans() {
    const plans = await this.loadPlanOptions();

    return plans.filter((plan) => plan.is_active);
  }

  private async emitPlatformInvalidation(input: {
    resource: string;
    action: string;
  }) {
    const recipientIds = await this.resolvePlatformRecipientIds();

    await Promise.allSettled(
      recipientIds.map((userId) =>
        this.realtimeService.broadcastPlatformInvalidation({
          userId,
          resource: input.resource,
          action: input.action,
        }),
      ),
    );
  }

  private async resolvePlatformRecipientIds() {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        role: {
          scope: 'platform',
        },
      },
      select: {
        userId: true,
      },
    });

    return Array.from(new Set(assignments.map((assignment) => assignment.userId)));
  }

  private async buildSettingsPayload(currentUser: AuthenticatedUser) {
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

    const plans = await this.loadPlanSettingsRows();

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
      plans,
    };
  }

  private async loadPlanSettingsRows() {
    const plans = await (this.prisma as any).plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        limits: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        subscriptions: {
          include: {
            payments: true,
          },
        },
      },
    });

    return plans.map((plan: any) => this.serializeSettingsPlan(plan));
  }

  private async loadPlanSettingsRowById(planId: string) {
    const plan = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        limits: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        subscriptions: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!plan) {
      throw notFoundError('Plan not found');
    }

    return this.serializeSettingsPlan(plan);
  }

  private serializeSettingsPlan(plan: any) {
    const paidRevenue = plan.subscriptions.reduce(
      (sum: number, subscription: any) =>
        sum +
        subscription.payments
          .filter((payment: any) => payment.status === 'paid')
          .reduce((total: number, payment: any) => total + payment.amount, 0),
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
      sort_order: plan.sortOrder,
      shop_count: plan.subscriptions.length,
      collected_revenue: paidRevenue,
      items: (plan.items ?? []).map((item: any) => this.serializePlanItem(item)),
      limits: (plan.limits ?? []).map((limit: any) =>
        this.serializePlanLimit(limit),
      ),
    };
  }

  private serializePlanItem(item: any): PlanItemRow {
    return {
      id: item.id,
      code: item.code,
      label: item.label,
      description: item.description,
      availability_status: item.availabilityStatus,
      sort_order: item.sortOrder,
    };
  }

  private serializePlanLimit(limit: any): PlanLimitRow {
    return {
      id: limit.id,
      code: limit.code,
      label: limit.label,
      description: limit.description,
      value: limit.value ?? null,
      sort_order: limit.sortOrder,
    };
  }

  private async syncPlanItems(
    tx: any,
    planId: string,
    items: Array<{
      code: string;
      label: string;
      description?: string | null;
      availability_status: string;
      sort_order?: number;
    }>,
  ) {
    await (tx as any).planItem.deleteMany({
      where: { planId },
    });

    if (items.length === 0) {
      return;
    }

    await (tx as any).planItem.createMany({
      data: items.map((item, index) => ({
        planId,
        code: item.code,
        label: item.label,
        description: item.description ?? null,
        availabilityStatus: item.availability_status,
        sortOrder: item.sort_order ?? index,
      })),
    });
  }

  private async syncPlanLimits(
    tx: any,
    planId: string,
    limits: Array<{
      code: string;
      label: string;
      description?: string | null;
      value?: number | null;
      sort_order?: number;
    }>,
  ) {
    await (tx as any).planLimit.deleteMany({
      where: { planId },
    });

    if (limits.length === 0) {
      return;
    }

    await (tx as any).planLimit.createMany({
      data: limits.map((limit, index) => ({
        planId,
        code: limit.code,
        label: limit.label,
        description: limit.description ?? null,
        value: limit.value ?? null,
        sortOrder: limit.sort_order ?? index,
      })),
    });
  }

  private async resolveSupportShop(shopId: string | null | undefined) {
    if (shopId === undefined) {
      return undefined;
    }

    const normalizedShopId = shopId?.trim() || null;
    if (!normalizedShopId) {
      return null;
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: normalizedShopId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!shop) {
      throw validationError([
        {
          field: 'shop_id',
          errors: ['Shop not found'],
        },
      ]);
    }

    return shop;
  }

  private async resolveSupportAssignee(userId: string | null | undefined) {
    if (userId === undefined) {
      return undefined;
    }

    const normalizedUserId = userId?.trim() || null;
    if (!normalizedUserId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      throw validationError([
        {
          field: 'assigned_to_user_id',
          errors: ['Assignee user not found'],
        },
      ]);
    }

    return user;
  }

  private isSupportIssueClosed(status: string) {
    return status === 'resolved' || status === 'dismissed';
  }

  private isSupportIssueOpen(status: string) {
    return status === 'open' || status === 'in_progress';
  }

  private async loadSupportIssueById(issueId: string): Promise<SupportIssue> {
    const issue = await (this.prisma as any).platformSupportIssue.findUnique({
      where: { id: issueId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!issue) {
      throw notFoundError('Support issue not found');
    }

    return this.serializeSupportIssue(issue);
  }

  private async syncAndLoadSupportIssues(
    tenants: TenantSnapshot[],
    payments: PaymentRow[],
    now: Date,
  ) {
    const detectedIssues = this.buildSupportIssues(tenants, payments, now);
    await this.syncDetectedSupportIssues(detectedIssues, now);
    return this.loadSupportIssueQueue();
  }

  private async syncDetectedSupportIssues(
    detectedIssues: DetectedSupportIssue[],
    now: Date,
  ) {
    const existingSystemIssues = (await (this.prisma as any).platformSupportIssue.findMany(
      {
        where: {
          source: 'system',
        },
        select: {
          id: true,
          issueKey: true,
          status: true,
        },
      },
    )) as Array<{ id: string; issueKey: string | null; status: string }>;

    const existingByKey = new Map<
      string,
      { id: string; issueKey: string | null; status: string }
    >(
      existingSystemIssues
        .filter((issue) => issue.issueKey !== null)
        .map((issue) => [issue.issueKey as string, issue]),
    );

    for (const detectedIssue of detectedIssues) {
      const existingIssue = existingByKey.get(detectedIssue.issue_key);

      if (!existingIssue) {
        await (this.prisma as any).platformSupportIssue.create({
          data: {
            issueKey: detectedIssue.issue_key,
            source: detectedIssue.source,
            kind: detectedIssue.kind,
            severity: detectedIssue.severity,
            status: detectedIssue.status,
            shopId: detectedIssue.shop_id,
            shopNameSnapshot: detectedIssue.shop_name,
            title: detectedIssue.title,
            detail: detectedIssue.detail,
            occurredAt: new Date(detectedIssue.occurred_at),
            isActive: true,
            lastDetectedAt: now,
          },
        });
        continue;
      }

      const shouldReopenIssue = this.isSupportIssueClosed(existingIssue.status);

      await (this.prisma as any).platformSupportIssue.update({
        where: { id: existingIssue.id },
        data: {
          source: detectedIssue.source,
          kind: detectedIssue.kind,
          severity: detectedIssue.severity,
          shopId: detectedIssue.shop_id,
          shopNameSnapshot: detectedIssue.shop_name,
          title: detectedIssue.title,
          detail: detectedIssue.detail,
          occurredAt: new Date(detectedIssue.occurred_at),
          isActive: true,
          lastDetectedAt: now,
          ...(shouldReopenIssue
            ? {
                status: 'open',
                resolvedAt: null,
              }
            : {}),
        },
      });
    }

    const detectedIssueKeys = new Set(
      detectedIssues.map((issue) => issue.issue_key),
    );
    const staleIssueIds = existingSystemIssues
      .filter(
        (issue) =>
          issue.issueKey &&
          !detectedIssueKeys.has(issue.issueKey) &&
          this.isSupportIssueOpen(issue.status),
      )
      .map((issue) => issue.id);

    if (staleIssueIds.length > 0) {
      await (this.prisma as any).platformSupportIssue.updateMany({
        where: {
          id: {
            in: staleIssueIds,
          },
        },
        data: {
          isActive: false,
        },
      });
    }
  }

  private async loadSupportIssueQueue(): Promise<SupportIssue[]> {
    const issues = await (this.prisma as any).platformSupportIssue.findMany({
      where: {
        OR: [
          {
            source: 'manual',
            status: {
              in: ['open', 'in_progress'],
            },
          },
          {
            source: 'system',
            isActive: true,
            status: {
              in: ['open', 'in_progress'],
            },
          },
        ],
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const severityWeight: Record<
      (typeof platformSupportIssueSeverities)[number],
      number
    > = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const statusWeight: Record<(typeof platformSupportIssueStatuses)[number], number> =
      {
        open: 2,
        in_progress: 1,
        resolved: 0,
        dismissed: 0,
      };

    return issues
      .map((issue: any) => this.serializeSupportIssue(issue))
      .sort((left, right) => {
        const severityDiff =
          (severityWeight[right.severity] ?? 0) -
          (severityWeight[left.severity] ?? 0);

        if (severityDiff !== 0) {
          return severityDiff;
        }

        const statusDiff =
          (statusWeight[right.status] ?? 0) - (statusWeight[left.status] ?? 0);
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return this.sortByDateDesc(left.occurred_at, right.occurred_at);
      });
  }

  private serializeSupportIssue(issue: any): SupportIssue {
    const normalizedKind = platformSupportIssueKinds.includes(issue.kind)
      ? issue.kind
      : 'other';
    const normalizedSeverity = platformSupportIssueSeverities.includes(
      issue.severity,
    )
      ? issue.severity
      : 'medium';
    const normalizedStatus = platformSupportIssueStatuses.includes(issue.status)
      ? issue.status
      : 'open';
    const normalizedSource = platformSupportIssueSources.includes(issue.source)
      ? issue.source
      : 'manual';

    return {
      id: issue.id,
      kind: normalizedKind,
      severity: normalizedSeverity,
      status: normalizedStatus,
      source: normalizedSource,
      shop_id: issue.shopId ?? issue.shop?.id ?? null,
      shop_name: issue.shop?.name ?? issue.shopNameSnapshot ?? 'Unknown shop',
      title: issue.title,
      detail: issue.detail,
      occurred_at: issue.occurredAt.toISOString(),
      assigned_to_user_id: issue.assignedToUserId ?? issue.assignedToUser?.id ?? null,
      assigned_to_user_name: issue.assignedToUser?.name ?? null,
      resolution_note: issue.resolutionNote ?? null,
      resolved_at: issue.resolvedAt?.toISOString() ?? null,
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

  private async findExistingOwnerForPlatformShop(
    tx: any,
    input: {
      owner_user_id?: string;
      owner_email?: string;
      owner_phone?: string;
    },
  ) {
    const ownerUserId = input.owner_user_id?.trim() || null;
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

    return uniqueOwners[0] ?? null;
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
    const ownerName = input.owner_name?.trim() || null;
    const ownerEmail = input.owner_email?.trim().toLowerCase() || null;
    const ownerPhone = this.normalizePhone(input.owner_phone);

    const existingOwner = await this.findExistingOwnerForPlatformShop(tx, {
      owner_user_id: input.owner_user_id,
      owner_email: input.owner_email,
      owner_phone: input.owner_phone,
    });

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

  private async reassignPlatformShopOwner(
    tx: any,
    input: {
      shopId: string;
      previousOwnerUserId: string;
      nextOwnerUserId: string;
      ownerRoleIds: string[];
    },
  ) {
    if (input.previousOwnerUserId === input.nextOwnerUserId) {
      return;
    }

    const nextOwnerMember = await tx.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: input.shopId,
          userId: input.nextOwnerUserId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const ensuredNextOwnerMember = nextOwnerMember
      ? nextOwnerMember.status === 'active'
        ? nextOwnerMember
        : await tx.shopMember.update({
            where: { id: nextOwnerMember.id },
            data: { status: 'active' },
            select: {
              id: true,
              status: true,
            },
          })
      : await tx.shopMember.create({
          data: {
            shopId: input.shopId,
            userId: input.nextOwnerUserId,
            status: 'active',
          },
          select: {
            id: true,
            status: true,
          },
        });

    await tx.shopMemberRoleAssignment.createMany({
      data: input.ownerRoleIds.map((roleId) => ({
        shopMemberId: ensuredNextOwnerMember.id,
        roleId,
      })),
      skipDuplicates: true,
    });

    const previousOwnerMember = await tx.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: input.shopId,
          userId: input.previousOwnerUserId,
        },
      },
      select: {
        id: true,
      },
    });

    if (previousOwnerMember) {
      await tx.shopMemberRoleAssignment.deleteMany({
        where: {
          shopMemberId: previousOwnerMember.id,
          roleId: {
            in: input.ownerRoleIds,
          },
        },
      });

      const remainingRoleCount = await tx.shopMemberRoleAssignment.count({
        where: {
          shopMemberId: previousOwnerMember.id,
        },
      });

      if (remainingRoleCount === 0) {
        await tx.shopMember.update({
          where: { id: previousOwnerMember.id },
          data: { status: 'disabled' },
        });
      }
    }

    await tx.shop.update({
      where: { id: input.shopId },
      data: {
        ownerUserId: input.nextOwnerUserId,
      },
    });
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
    await this.subscriptionLifecycle.expireElapsedTrials(now);

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
        owner_user_id: shop.owner.id,
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
      subscription_id: payment.subscriptionId,
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

  private async loadPaymentRowById(paymentId: string): Promise<PaymentRow> {
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: paymentId },
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
      throw notFoundError('Invoice not found');
    }

    return {
      id: payment.id,
      subscription_id: payment.subscriptionId,
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
    };
  }

  private async loadSubscriptionRows(): Promise<SubscriptionRow[]> {
    await this.subscriptionLifecycle.expireElapsedTrials();

    const subscriptions = (await (this.prisma as any).subscription.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        shop: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        plan: true,
        payments: {
          orderBy: [{ dueAt: 'desc' }, { createdAt: 'desc' }],
          include: {
            subscription: {
              include: {
                shop: true,
                plan: true,
              },
            },
          },
        },
      },
    })) as any[];

    return subscriptions.map((subscription) => {
      const latestPayment =
        subscription.payments.length > 0
          ? {
              id: subscription.payments[0].id,
              subscription_id: subscription.payments[0].subscriptionId,
              invoice_no: subscription.payments[0].invoiceNo,
              shop_id: subscription.shopId,
              shop_name: subscription.shop.name,
              plan_code: subscription.plan.code,
              plan_name: subscription.plan.name,
              amount: subscription.payments[0].amount,
              currency: subscription.payments[0].currency,
              payment_method: subscription.payments[0].paymentMethod,
              provider_ref: subscription.payments[0].providerRef,
              status: subscription.payments[0].status,
              due_at: subscription.payments[0].dueAt?.toISOString() ?? null,
              paid_at: subscription.payments[0].paidAt?.toISOString() ?? null,
              created_at: subscription.payments[0].createdAt.toISOString(),
            }
          : null;

      return {
        id: subscription.id,
        shop_id: subscription.shopId,
        shop_name: subscription.shop.name,
        owner_name: subscription.shop.owner.name,
        owner_email: subscription.shop.owner.email,
        plan_id: subscription.planId,
        plan_code: subscription.plan.code,
        plan_name: subscription.plan.name,
        plan_price: subscription.plan.price,
        plan_currency: subscription.plan.currency,
        billing_period: subscription.plan.billingPeriod,
        status: subscription.status,
        auto_renews: subscription.autoRenews,
        start_at: subscription.startAt.toISOString(),
        end_at: subscription.endAt?.toISOString() ?? null,
        created_at: subscription.createdAt.toISOString(),
        updated_at: subscription.updatedAt.toISOString(),
        latest_invoice: latestPayment,
        invoice_count: subscription.payments.length,
      };
    });
  }

  private async loadSubscriptionRowById(
    subscriptionId: string,
  ): Promise<SubscriptionRow> {
    const subscriptions = await this.loadSubscriptionRows();
    const subscription = subscriptions.find((row) => row.id === subscriptionId);

    if (!subscription) {
      throw notFoundError('Subscription not found');
    }

    return subscription;
  }

  private async loadPlanOptions(): Promise<PlanOptionRow[]> {
    const plans = await (this.prisma as any).plan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        limits: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return plans.map((plan: any) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      billing_period: plan.billingPeriod,
      price: plan.price,
      currency: plan.currency,
      is_active: plan.isActive,
      sort_order: plan.sortOrder,
      items: (plan.items ?? []).map((item: any) => this.serializePlanItem(item)),
      limits: (plan.limits ?? []).map((limit: any) =>
        this.serializePlanLimit(limit),
      ),
    }));
  }

  private async resolvePlanReference(input: {
    planId?: string;
    planCode?: string;
    currentPlanId?: string;
  }) {
    const planId = input.planId?.trim() || null;
    const planCode = input.planCode?.trim() || null;

    if (!planId && !planCode) {
      return null;
    }

    const [planById, planByCode] = await Promise.all([
      planId
        ? (this.prisma as any).plan.findUnique({
            where: { id: planId },
            select: { id: true, code: true },
          })
        : null,
      planCode
        ? (this.prisma as any).plan.findUnique({
            where: { code: planCode },
            select: { id: true, code: true },
          })
        : null,
    ]);

    if (planId && !planById) {
      throw validationError([
        {
          field: 'plan_id',
          errors: ['Plan not found'],
        },
      ]);
    }

    if (planCode && !planByCode) {
      throw validationError([
        {
          field: 'plan_code',
          errors: ['Plan not found'],
        },
      ]);
    }

    if (planById && planByCode && planById.id !== planByCode.id) {
      throw validationError([
        {
          field: 'plan_id',
          errors: ['Plan ID does not match the provided plan code'],
        },
        {
          field: 'plan_code',
          errors: ['Plan code does not match the provided plan ID'],
        },
      ]);
    }

    const resolvedPlan = planById ?? planByCode ?? null;

    if (resolvedPlan && resolvedPlan.id === input.currentPlanId) {
      return null;
    }

    return resolvedPlan;
  }

  private resolvePaidAtForCreate(status: string, paidAt?: string | null) {
    if (status === 'paid') {
      return paidAt ? new Date(paidAt) : new Date();
    }

    return paidAt ? new Date(paidAt) : null;
  }

  private resolvePaidAtForUpdate(
    invoice: any,
    nextStatus: string,
    paidAt?: string | null,
  ) {
    if (paidAt !== undefined) {
      return paidAt ? new Date(paidAt) : null;
    }

    if (nextStatus === 'paid') {
      return invoice.paidAt ?? new Date();
    }

    if (invoice.status !== nextStatus) {
      return null;
    }

    return invoice.paidAt;
  }

  private async generateInvoiceNo(tx: any) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
      const candidate = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${suffix}`;
      const existing = await (tx as any).payment.findUnique({
        where: { invoiceNo: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    return `INV-${Date.now()}`;
  }

  private async syncSubscriptionStatusFromInvoices(tx: any, subscriptionId: string) {
    const subscription = await (tx as any).subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        payments: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      return;
    }

    if (['cancelled', 'expired', 'inactive'].includes(subscription.status)) {
      return;
    }

    const hasOverdueInvoice = subscription.payments.some(
      (payment: { status: string }) => payment.status === 'overdue',
    );
    const isExpiredTrial =
      subscription.plan.billingPeriod === 'trial' &&
      subscription.endAt &&
      subscription.endAt.getTime() <= Date.now();
    const nextStatus = hasOverdueInvoice
      ? 'overdue'
      : isExpiredTrial
        ? 'expired'
        : subscription.plan.billingPeriod === 'trial'
        ? 'trialing'
        : 'active';

    if (
      platformSubscriptionStatuses.includes(
        nextStatus as (typeof platformSubscriptionStatuses)[number],
      ) &&
      subscription.status !== nextStatus
    ) {
      await (tx as any).subscription.update({
        where: { id: subscriptionId },
        data: {
          status: nextStatus,
        },
      });
    }
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

    const totalShopsWithPlan = tenants.filter(t => t.plan_code).length;

    return [...grouped.values()]
      .sort((left, right) => right.shop_count - left.shop_count)
      .map((plan) => ({
        ...plan,
        share: totalShopsWithPlan > 0 ? Number((plan.shop_count / totalShopsWithPlan).toFixed(4)) : 0,
      }));
  }

  private buildSupportIssues(
    tenants: TenantSnapshot[],
    payments: PaymentRow[],
    now: Date,
  ): DetectedSupportIssue[] {
    const issues: DetectedSupportIssue[] = [];

    for (const payment of payments.filter((row) => row.status === 'overdue')) {
      issues.push({
        issue_key: `billing:${payment.id}`,
        source: 'system',
        kind: 'billing',
        severity: 'high',
        status: 'open',
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
          issue_key: `renewal:${tenant.id}`,
          source: 'system',
          kind: 'renewal',
          severity: 'medium',
          status: 'open',
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
          issue_key: `onboarding:${tenant.id}`,
          source: 'system',
          kind: 'onboarding',
          severity: 'medium',
          status: 'open',
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
          issue_key: `adoption:${tenant.id}`,
          source: 'system',
          kind: 'adoption',
          severity: 'low',
          status: 'open',
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
      if (subscription.endAt && subscription.endAt.getTime() <= now.getTime()) {
        return 'inactive';
      }

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

  private async sendInvoiceNoticeEmail(
    invoiceId: string,
    templateKey: 'platform.invoice_notice' | 'platform.billing_notice',
  ) {
    const invoice = await (this.prisma as any).payment.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: {
          include: {
            plan: true,
            shop: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    const owner = invoice?.subscription?.shop?.owner;
    if (!invoice || !owner?.email) {
      return;
    }

    const shop = invoice.subscription.shop;
    const plan = invoice.subscription.plan;
    const statusLabel = this.toTitleCase(invoice.status);
    const amountLine = `Amount: ${invoice.amount.toLocaleString()} ${invoice.currency}`;
    const dueAtLine = invoice.dueAt
      ? `Due date: ${this.formatDateLabel(invoice.dueAt)}`
      : 'Due date: No due date assigned';
    const statusLine = `Status: ${statusLabel}`;
    const planLine = `Plan: ${plan.name} (${plan.billingPeriod})`;

    await this.emailOutbox.queueAndSendTemplatedEmail({
      userId: owner.id,
      shopId: shop.id,
      toEmail: owner.email,
      recipientName: owner.name,
      templateKey,
      variables: {
        subject:
          templateKey === 'platform.billing_notice'
            ? `[${shop.name}] Billing follow-up for ${invoice.invoiceNo}`
            : `[${shop.name}] Invoice ${invoice.invoiceNo}`,
        title:
          templateKey === 'platform.billing_notice'
            ? `Billing follow-up for ${invoice.invoiceNo}`
            : `Invoice ${invoice.invoiceNo}`,
        intro:
          templateKey === 'platform.billing_notice'
            ? `There is a billing action required for ${shop.name}.`
            : `A subscription invoice is available for ${shop.name}.`,
        amountLine,
        dueAtLine,
        statusLine,
        planLine,
        ctaLabel: 'Open billing',
        ctaUrl: `${this.getWebAppBaseUrl()}/dashboard/settings`,
        footerText:
          invoice.paymentMethod || invoice.providerRef
            ? `Payment method: ${invoice.paymentMethod ?? 'n/a'}${
                invoice.providerRef ? ` · Ref: ${invoice.providerRef}` : ''
              }`
            : `Invoice status: ${statusLabel}`,
      },
    });
  }

  private getWebAppBaseUrl() {
    return (
      process.env.WEB_APP_BASE_URL?.trim() ||
      process.env.APP_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private formatDateLabel(value: Date) {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeZone: 'Asia/Yangon',
    }).format(value);
  }

  private toTitleCase(value: string) {
    return value
      .replaceAll('_', ' ')
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
      .join(' ');
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
