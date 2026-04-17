import { Injectable } from '@nestjs/common';
import { forbiddenError } from '../common/http/app-http.exception';
import { permissions } from '../common/http/rbac.constants';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { subscriptionFeatures } from '../platform/subscription-feature.constants';
import { SubscriptionLifecycleService } from '../platform/subscription-lifecycle.service';
import type { ListEnterpriseWorkspaceQueryDto } from './dto/list-enterprise-workspace-query.dto';

type WorkspaceShopRecord = any;

@Injectable()
export class EnterpriseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionLifecycle: SubscriptionLifecycleService,
  ) {}

  async getWorkspace(
    currentUser: AuthenticatedUser,
    query: ListEnterpriseWorkspaceQueryDto,
  ) {
    const memberships = (currentUser.shops ?? []).filter((shopAccess) =>
      shopAccess.permissions.includes(permissions.summariesRead),
    );

    if (memberships.length === 0) {
      throw forbiddenError(
        'This account does not have cross-shop reporting access.',
      );
    }

    const now = new Date();
    await this.subscriptionLifecycle.processSubscriptionExpirations(now);

    const shops = (await this.prisma.shop.findMany({
      where: {
        id: {
          in: memberships.map((membership) => membership.shop_id),
        },
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            status: true,
          },
        },
        customers: {
          select: {
            id: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNo: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
    })) as WorkspaceShopRecord[];

    const snapshots = shops.map((shop) => {
      const availableFeatures = new Set(
        (shop.subscription?.plan?.items ?? [])
          .filter((item: any) => item.availabilityStatus === 'available')
          .map((item: any) => item.code),
      );
      const deliveredOrders = shop.orders.filter(
        (order: any) => order.status === 'delivered',
      );
      const totalRevenue = deliveredOrders.reduce(
        (sum: number, order: any) => sum + order.totalPrice,
        0,
      );
      const latestActivity = [...shop.orders]
        .sort(
          (left: any, right: any) =>
            right.updatedAt.getTime() - left.updatedAt.getTime(),
        )[0]?.updatedAt;
      const subscriptionStatus = shop.subscription?.status ?? 'inactive';

      return {
        id: shop.id,
        name: shop.name,
        timezone: shop.timezone,
        owner_name: shop.owner.name,
        owner_email: shop.owner.email,
        plan_code: shop.subscription?.plan?.code ?? null,
        plan_name: shop.subscription?.plan?.name ?? null,
        status: this.deriveWorkspaceStatus(shop, now),
        subscription_status: subscriptionStatus,
        member_count: shop.members.length,
        active_member_count: shop.members.filter(
          (member: any) => member.status === 'active',
        ).length,
        customer_count: shop.customers.length,
        total_orders: shop.orders.length,
        delivered_orders: deliveredOrders.length,
        total_revenue: totalRevenue,
        average_order_value:
          deliveredOrders.length > 0
            ? Math.round(totalRevenue / deliveredOrders.length)
            : 0,
        last_active_at: latestActivity?.toISOString() ?? null,
        enterprise_enabled: availableFeatures.has(
          subscriptionFeatures.multiShopManagement,
        ),
        analytics_enabled: availableFeatures.has(
          subscriptionFeatures.analyticsAdvanced,
        ),
        priority_support_enabled: availableFeatures.has(
          subscriptionFeatures.supportPriority,
        ),
      };
    });

    const statusFilter = query.status ?? 'all';
    const filteredSnapshots = snapshots.filter((snapshot) =>
      statusFilter === 'all' ? true : snapshot.status === statusFilter,
    );
    const entitledSnapshots = filteredSnapshots.filter(
      (snapshot) => snapshot.enterprise_enabled,
    );
    const eligibleShopCount = entitledSnapshots.length;
    const lockedShopCount = Math.max(
      filteredSnapshots.length - entitledSnapshots.length,
      0,
    );

    let selectedSnapshots = entitledSnapshots;
    if (query.shop_id) {
      const selectedShop = entitledSnapshots.find(
        (snapshot) => snapshot.id === query.shop_id,
      );
      selectedSnapshots = selectedShop ? [selectedShop] : [];
    }

    const selectedShopIds = selectedSnapshots.map((snapshot) => snapshot.id);
    const recentOrders =
      selectedShopIds.length > 0
        ? await this.prisma.order.findMany({
            where: {
              shopId: {
                in: selectedShopIds,
              },
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
            take: 12,
            include: {
              shop: {
                select: {
                  id: true,
                  name: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [];

    const totalOrders = selectedSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.total_orders,
      0,
    );
    const totalRevenue = selectedSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.total_revenue,
      0,
    );
    const deliveredOrders = selectedSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.delivered_orders,
      0,
    );
    const customerCount = selectedSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.customer_count,
      0,
    );

    return {
      entitlements: {
        multi_shop_enabled: eligibleShopCount >= 2,
        eligible_shop_count: eligibleShopCount,
        locked_shop_count: lockedShopCount,
        analytics_enabled: entitledSnapshots.some(
          (snapshot) => snapshot.analytics_enabled,
        ),
        priority_support_enabled: entitledSnapshots.some(
          (snapshot) => snapshot.priority_support_enabled,
        ),
      },
      filters: {
        shop_id: query.shop_id ?? null,
        status: statusFilter,
      },
      shop_options: filteredSnapshots.map((snapshot) => ({
        id: snapshot.id,
        name: snapshot.name,
        owner_name: snapshot.owner_name,
        owner_email: snapshot.owner_email,
        status: snapshot.status,
        subscription_status: snapshot.subscription_status,
        plan_name: snapshot.plan_name,
        member_count: snapshot.member_count,
        active_member_count: snapshot.active_member_count,
        customer_count: snapshot.customer_count,
        total_orders: snapshot.total_orders,
        delivered_orders: snapshot.delivered_orders,
        average_order_value: snapshot.average_order_value,
        total_revenue: snapshot.total_revenue,
        enterprise_enabled: snapshot.enterprise_enabled,
        analytics_enabled: snapshot.analytics_enabled,
        priority_support_enabled: snapshot.priority_support_enabled,
        last_active_at: snapshot.last_active_at,
      })),
      overview: {
        accessible_shops: filteredSnapshots.length,
        selected_shops: selectedSnapshots.length,
        total_orders: totalOrders,
        delivered_orders: deliveredOrders,
        total_revenue: totalRevenue,
        average_order_value:
          deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0,
        customer_count: customerCount,
      },
      status_breakdown: [
        'new',
        'confirmed',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ].map((status) => ({
        status,
        count: recentOrders.filter((order) => order.status === status).length,
      })),
      top_shops: [...selectedSnapshots]
        .sort((left, right) => right.total_revenue - left.total_revenue)
        .slice(0, 8),
      recent_orders: recentOrders.map((order) => ({
        id: order.id,
        order_no: order.orderNo,
        shop_id: order.shopId,
        shop_name: order.shop.name,
        status: order.status,
        total_price: order.totalPrice,
        customer_name: order.customer.name,
        updated_at: order.updatedAt.toISOString(),
        created_at: order.createdAt.toISOString(),
      })),
    };
  }

  private deriveWorkspaceStatus(shop: WorkspaceShopRecord, now: Date) {
    const subscription = shop.subscription;

    if (!subscription || !subscription.plan) {
      return 'inactive';
    }

    if (subscription.status === 'overdue') {
      return 'overdue';
    }

    if (subscription.status === 'trialing') {
      if (!subscription.endAt) {
        return 'trial';
      }

      const daysRemaining =
        (subscription.endAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

      return daysRemaining <= 7 ? 'expiring' : 'trial';
    }

    if (subscription.status === 'active') {
      return 'active';
    }

    return 'inactive';
  }
}
