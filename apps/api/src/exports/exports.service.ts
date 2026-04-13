import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { permissions } from '../common/http/rbac.constants';
import { ShopsService } from '../shops/shops.service';

type CsvFile = {
  filename: string;
  content: string;
};

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async exportShopOrdersCsv(userId: string, shopId: string): Promise<CsvFile> {
    await this.shopsService.assertPermission(userId, shopId, permissions.ordersRead);
    await this.shopsService.assertPlanFeatures(userId, shopId, 'exports.csv');

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true },
    });
    const orders = await this.prisma.order.findMany({
      where: { shopId },
      orderBy: [{ createdAt: 'desc' }, { orderNo: 'desc' }],
      select: {
        orderNo: true,
        status: true,
        source: true,
        currency: true,
        totalPrice: true,
        deliveryFee: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        customer: true,
        items: true,
      },
    });

    return {
      filename: this.buildFilename(shop?.name ?? 'shop', 'orders'),
      content: this.toCsv(
        [
          'order_no',
          'status',
          'source',
          'currency',
          'total_price',
          'delivery_fee',
          'customer_name',
          'customer_phone',
          'customer_township',
          'customer_address',
          'items',
          'note',
          'created_at',
          'updated_at',
        ],
        orders.map((order) => ({
          order_no: order.orderNo,
          status: order.status,
          source: order.source,
          currency: order.currency,
          total_price: order.totalPrice,
          delivery_fee: order.deliveryFee,
          customer_name: order.customer.name,
          customer_phone: order.customer.phone,
          customer_township: order.customer.township,
          customer_address: order.customer.address,
          items: order.items
            .map((item) => `${item.productName} x${item.qty} @ ${item.unitPrice}`)
            .join(' | '),
          note: order.note,
          created_at: order.createdAt.toISOString(),
          updated_at: order.updatedAt.toISOString(),
        })),
      ),
    };
  }

  async exportShopCustomersCsv(userId: string, shopId: string): Promise<CsvFile> {
    await this.shopsService.assertPermission(
      userId,
      shopId,
      permissions.customersRead,
    );
    await this.shopsService.assertPlanFeatures(userId, shopId, 'exports.csv');

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true },
    });
    const customers = await this.prisma.customer.findMany({
      where: { shopId },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      include: {
        orders: {
          select: {
            totalPrice: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      filename: this.buildFilename(shop?.name ?? 'shop', 'customers'),
      content: this.toCsv(
        [
          'name',
          'phone',
          'township',
          'address',
          'notes',
          'total_orders',
          'total_spent',
          'last_order_at',
          'created_at',
        ],
        customers.map((customer) => {
          const totalSpent = customer.orders.reduce(
            (sum, order) => sum + order.totalPrice,
            0,
          );
          const lastOrderAt =
            [...customer.orders]
              .sort(
                (left, right) =>
                  right.createdAt.getTime() - left.createdAt.getTime(),
              )[0]
              ?.createdAt.toISOString() ?? null;

          return {
            name: customer.name,
            phone: customer.phone,
            township: customer.township,
            address: customer.address,
            notes: customer.notes,
            total_orders: customer.orders.length,
            total_spent: totalSpent,
            last_order_at: lastOrderAt,
            created_at: customer.createdAt.toISOString(),
          };
        }),
      ),
    };
  }

  async exportShopDeliveriesCsv(userId: string, shopId: string): Promise<CsvFile> {
    await this.shopsService.assertPermission(
      userId,
      shopId,
      permissions.deliveriesRead,
    );
    await this.shopsService.assertPlanFeatures(userId, shopId, 'exports.csv');

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true },
    });
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        order: {
          shopId,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        status: true,
        deliveryFee: true,
        addressSnapshot: true,
        scheduledAt: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        driverUser: true,
        order: {
          select: {
            orderNo: true,
            customer: true,
          },
        },
      },
    });

    return {
      filename: this.buildFilename(shop?.name ?? 'shop', 'deliveries'),
      content: this.toCsv(
        [
          'order_no',
          'status',
          'driver_name',
          'driver_phone',
          'customer_name',
          'customer_phone',
          'delivery_fee',
          'address_snapshot',
          'scheduled_at',
          'delivered_at',
          'created_at',
          'updated_at',
        ],
        deliveries.map((delivery) => ({
          order_no: delivery.order.orderNo,
          status: delivery.status,
          driver_name: delivery.driverUser.name,
          driver_phone: delivery.driverUser.phone,
          customer_name: delivery.order.customer.name,
          customer_phone: delivery.order.customer.phone,
          delivery_fee: delivery.deliveryFee,
          address_snapshot: delivery.addressSnapshot,
          scheduled_at: delivery.scheduledAt?.toISOString() ?? null,
          delivered_at: delivery.deliveredAt?.toISOString() ?? null,
          created_at: delivery.createdAt.toISOString(),
          updated_at: delivery.updatedAt.toISOString(),
        })),
      ),
    };
  }

  async exportShopMembersCsv(userId: string, shopId: string): Promise<CsvFile> {
    await this.shopsService.assertPermission(userId, shopId, permissions.membersRead);
    await this.shopsService.assertPlanFeatures(userId, shopId, [
      'exports.csv',
      'team.members',
    ]);

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true },
    });
    const members = await this.prisma.shopMember.findMany({
      where: { shopId },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      filename: this.buildFilename(shop?.name ?? 'shop', 'staffs'),
      content: this.toCsv(
        ['name', 'email', 'phone', 'status', 'roles', 'created_at'],
        members.map((member) => ({
          name: member.user.name,
          email: member.user.email,
          phone: member.user.phone,
          status: member.status,
          roles: member.roleAssignments
            .map((assignment) => assignment.role.code)
            .sort()
            .join(' | '),
          created_at: member.createdAt.toISOString(),
        })),
      ),
    };
  }

  async exportPlatformShopsCsv(): Promise<CsvFile> {
    const shops = await this.prisma.shop.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        name: true,
        timezone: true,
        createdAt: true,
        owner: true,
        subscription: {
          select: {
            status: true,
            plan: true,
          },
        },
        _count: {
          select: {
            members: true,
            customers: true,
            orders: true,
          },
        },
      },
    });

    return {
      filename: this.buildFilename('platform', 'shops'),
      content: this.toCsv(
        [
          'shop_name',
          'owner_name',
          'owner_email',
          'owner_phone',
          'timezone',
          'plan_code',
          'plan_name',
          'subscription_status',
          'member_count',
          'customer_count',
          'order_count',
          'created_at',
        ],
        shops.map((shop) => ({
          shop_name: shop.name,
          owner_name: shop.owner.name,
          owner_email: shop.owner.email,
          owner_phone: shop.owner.phone,
          timezone: shop.timezone,
          plan_code: shop.subscription?.plan.code ?? null,
          plan_name: shop.subscription?.plan.name ?? null,
          subscription_status: shop.subscription?.status ?? null,
          member_count: shop._count.members,
          customer_count: shop._count.customers,
          order_count: shop._count.orders,
          created_at: shop.createdAt.toISOString(),
        })),
      ),
    };
  }

  async exportPlatformUsersCsv(): Promise<CsvFile> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        name: true,
        email: true,
        phone: true,
        locale: true,
        createdAt: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
        memberships: {
          select: {
            status: true,
            shop: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      filename: this.buildFilename('platform', 'users'),
      content: this.toCsv(
        [
          'name',
          'email',
          'phone',
          'locale',
          'platform_roles',
          'shop_count',
          'shops',
          'created_at',
        ],
        users.map((user) => ({
          name: user.name,
          email: user.email,
          phone: user.phone,
          locale: user.locale,
          platform_roles: user.roleAssignments
            .map((assignment) => assignment.role.code)
            .sort()
            .join(' | '),
          shop_count: user.memberships.length,
          shops: user.memberships
            .map((member) => `${member.shop.name}:${member.status}`)
            .join(' | '),
          created_at: user.createdAt.toISOString(),
        })),
      ),
    };
  }

  async exportPlatformSubscriptionsCsv(): Promise<CsvFile> {
    const subscriptions = await this.prisma.subscription.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        status: true,
        autoRenews: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        updatedAt: true,
        plan: true,
        shop: {
          select: {
            name: true,
            owner: true,
          },
        },
      },
    });

    return {
      filename: this.buildFilename('platform', 'subscriptions'),
      content: this.toCsv(
        [
          'shop_name',
          'owner_name',
          'owner_email',
          'plan_code',
          'plan_name',
          'plan_price',
          'currency',
          'billing_period',
          'status',
          'auto_renews',
          'start_at',
          'end_at',
          'created_at',
          'updated_at',
        ],
        subscriptions.map((subscription) => ({
          shop_name: subscription.shop.name,
          owner_name: subscription.shop.owner.name,
          owner_email: subscription.shop.owner.email,
          plan_code: subscription.plan.code,
          plan_name: subscription.plan.name,
          plan_price: subscription.plan.price,
          currency: subscription.plan.currency,
          billing_period: subscription.plan.billingPeriod,
          status: subscription.status,
          auto_renews: subscription.autoRenews,
          start_at: subscription.startAt.toISOString(),
          end_at: subscription.endAt?.toISOString() ?? null,
          created_at: subscription.createdAt.toISOString(),
          updated_at: subscription.updatedAt.toISOString(),
        })),
      ),
    };
  }

  async exportPlatformInvoicesCsv(): Promise<CsvFile> {
    const invoices = await this.prisma.payment.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        invoiceNo: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        providerRef: true,
        dueAt: true,
        paidAt: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            shop: {
              select: {
                name: true,
                owner: true,
              },
            },
          },
        },
      },
    });

    return {
      filename: this.buildFilename('platform', 'invoices'),
      content: this.toCsv(
        [
          'invoice_no',
          'shop_name',
          'owner_name',
          'plan_code',
          'plan_name',
          'amount',
          'currency',
          'status',
          'payment_method',
          'provider_ref',
          'due_at',
          'paid_at',
          'created_at',
        ],
        invoices.map((invoice) => ({
          invoice_no: invoice.invoiceNo,
          shop_name: invoice.subscription.shop.name,
          owner_name: invoice.subscription.shop.owner.name,
          plan_code: invoice.subscription.plan.code,
          plan_name: invoice.subscription.plan.name,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          payment_method: invoice.paymentMethod,
          provider_ref: invoice.providerRef,
          due_at: invoice.dueAt?.toISOString() ?? null,
          paid_at: invoice.paidAt?.toISOString() ?? null,
          created_at: invoice.createdAt.toISOString(),
        })),
      ),
    };
  }

  private buildFilename(scope: string, dataset: string) {
    const normalizedScope = this.slugify(scope);
    const date = new Date().toISOString().slice(0, 10);
    return `${normalizedScope}-${dataset}-${date}.csv`;
  }

  private slugify(value: string) {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'export'
    );
  }

  private toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((header) => this.escapeCsvValue(row[header])).join(','),
      ),
    ];

    return lines.join('\n');
  }

  private escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) {
      return '""';
    }

    const normalized =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);

    return `"${normalized.replace(/"/g, '""')}"`;
  }
}
