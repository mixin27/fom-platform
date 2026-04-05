import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import { toLocalDate, toLocalHour } from '../common/utils/dates';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class SummariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async getDailySummary(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const targetDate =
      typeof query.date === 'string' && query.date.trim().length > 0
        ? query.date.trim()
        : await this.resolveReferenceDate(shopId, shop.timezone);

    const allOrders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: { not: 'cancelled' },
      },
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const dayOrders = allOrders.filter(
      (order) =>
        toLocalDate(order.createdAt.toISOString(), shop.timezone) === targetDate,
    );
    const previousDate = this.resolvePreviousDate(targetDate);
    const previousRevenue = allOrders
      .filter(
        (order) =>
          toLocalDate(order.createdAt.toISOString(), shop.timezone) === previousDate,
      )
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const totalRevenue = dayOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0,
    );
    const totalOrders = dayOrders.length;
    const customerCount = new Set(dayOrders.map((order) => order.customerId))
      .size;
    const averageOrderValue =
      totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders);

    const statusBreakdown = {
      new: dayOrders.filter((order) => order.status === 'new').length,
      confirmed: dayOrders.filter((order) => order.status === 'confirmed')
        .length,
      out_for_delivery: dayOrders.filter(
        (order) => order.status === 'out_for_delivery',
      ).length,
      delivered: dayOrders.filter((order) => order.status === 'delivered')
        .length,
    };

    const hourlyMap = new Map<
      number,
      { order_count: number; revenue: number }
    >();
    const productMap = new Map<string, { qty: number; revenue: number }>();
    const customerMap = new Map<
      string,
      { order_count: number; total_spent: number }
    >();

    for (const order of dayOrders) {
      const hour = toLocalHour(order.createdAt.toISOString(), shop.timezone);
      const hourEntry = hourlyMap.get(hour) ?? { order_count: 0, revenue: 0 };
      hourEntry.order_count += 1;
      hourEntry.revenue += order.totalPrice;
      hourlyMap.set(hour, hourEntry);

      const customerEntry = customerMap.get(order.customerId) ?? {
        order_count: 0,
        total_spent: 0,
      };
      customerEntry.order_count += 1;
      customerEntry.total_spent += order.totalPrice;
      customerMap.set(order.customerId, customerEntry);

      for (const item of order.items) {
        const productEntry = productMap.get(item.productName) ?? {
          qty: 0,
          revenue: 0,
        };
        productEntry.qty += item.qty;
        productEntry.revenue += item.lineTotal;
        productMap.set(item.productName, productEntry);
      }
    }

    return {
      id: `daily_${shopId}_${targetDate}`,
      shop_id: shopId,
      summary_date: targetDate,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      delivered_count: statusBreakdown.delivered,
      pending_count:
        statusBreakdown.new +
        statusBreakdown.confirmed +
        statusBreakdown.out_for_delivery,
      customer_count: customerCount,
      average_order_value: averageOrderValue,
      revenue_delta_vs_previous_day: totalRevenue - previousRevenue,
      delivered_rate:
        totalOrders === 0
          ? 0
          : Math.round((statusBreakdown.delivered / totalOrders) * 100),
      status_breakdown: statusBreakdown,
      hourly_breakdown: [...hourlyMap.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([hour, value]) => ({
          hour,
          label: this.formatHourLabel(hour),
          order_count: value.order_count,
          revenue: value.revenue,
        })),
      top_products: [...productMap.entries()]
        .sort((left, right) => right[1].revenue - left[1].revenue)
        .slice(0, 5)
        .map(([productName, value]) => ({
          product_name: productName,
          qty_sold: value.qty,
          revenue: value.revenue,
        })),
      top_customers: [...customerMap.entries()]
        .sort((left, right) => right[1].total_spent - left[1].total_spent)
        .slice(0, 5)
        .map(([customerId, value]) => {
          const customer = dayOrders.find(
            (order) => order.customerId === customerId,
          )?.customer;
          return {
            customer_id: customerId,
            customer_name: customer?.name ?? 'Unknown customer',
            order_count: value.order_count,
            total_spent: value.total_spent,
          };
        }),
      recent_orders: dayOrders.slice(0, 5).map((order) => ({
        id: order.id,
        order_no: order.orderNo,
        customer_name: order.customer.name,
        product_name: order.items[0]?.productName ?? 'Item',
        status: order.status,
        total_price: order.totalPrice,
        created_at: order.createdAt.toISOString(),
      })),
    };
  }

  private async resolveReferenceDate(
    shopId: string,
    timeZone: string,
  ): Promise<string> {
    const latest = await this.prisma.order.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return toLocalDate(
      latest?.createdAt.toISOString() ?? new Date().toISOString(),
      timeZone,
    );
  }

  private resolvePreviousDate(targetDate: string): string {
    const date = new Date(`${targetDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  private formatHourLabel(hour: number): string {
    if (hour === 0) {
      return '12AM';
    }
    if (hour < 12) {
      return `${hour}AM`;
    }
    if (hour === 12) {
      return '12PM';
    }
    return `${hour - 12}PM`;
  }
}
