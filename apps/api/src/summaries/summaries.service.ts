import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { toLocalDate, toLocalHour } from '../common/utils/dates';
import { ShopsService } from '../shops/shops.service';
import { GetDailySummaryQueryDto } from './dto/get-daily-summary-query.dto';
import { GetMonthlyReportQueryDto } from './dto/get-monthly-report-query.dto';
import { GetWeeklyReportQueryDto } from './dto/get-weekly-report-query.dto';

@Injectable()
export class SummariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async getDailySummary(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: GetDailySummaryQueryDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const targetDate =
      query.date ?? (await this.resolveReferenceDate(shopId, shop.timezone));

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

  async getWeeklyReport(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: GetWeeklyReportQueryDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const anchorDate =
      query.date ?? (await this.resolveReferenceDate(shopId, shop.timezone));
    const range = this.resolveWeekRange(anchorDate);
    const allOrders = await this.loadReportOrders(shopId);

    return this.buildPeriodReport({
      allOrders,
      shopId,
      reportType: 'weekly',
      periodKey: range.startDate,
      periodLabel: this.formatDateRangeLabel(range.startDate, range.endDate),
      startDate: range.startDate,
      endDate: range.endDate,
      comparisonStartDate: this.shiftDate(range.startDate, -7),
      comparisonEndDate: this.shiftDate(range.startDate, -1),
      timeZone: shop.timezone,
    });
  }

  async getMonthlyReport(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: GetMonthlyReportQueryDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const monthKey =
      query.month ??
      this.toMonthKey(await this.resolveReferenceDate(shopId, shop.timezone));
    const range = this.resolveMonthRange(monthKey);
    const previousMonthKey = this.shiftMonth(monthKey, -1);
    const previousRange = this.resolveMonthRange(previousMonthKey);
    const allOrders = await this.loadReportOrders(shopId);

    return this.buildPeriodReport({
      allOrders,
      shopId,
      reportType: 'monthly',
      periodKey: monthKey,
      periodLabel: this.formatMonthLabel(monthKey),
      startDate: range.startDate,
      endDate: range.endDate,
      comparisonStartDate: previousRange.startDate,
      comparisonEndDate: previousRange.endDate,
      timeZone: shop.timezone,
    });
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

  private async loadReportOrders(shopId: string) {
    return this.prisma.order.findMany({
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
  }

  private buildPeriodReport(options: {
    allOrders: any[];
    shopId: string;
    reportType: 'weekly' | 'monthly';
    periodKey: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
    comparisonStartDate: string;
    comparisonEndDate: string;
    timeZone: string;
  }) {
    const periodOrders = options.allOrders.filter((order) => {
      const orderDate = toLocalDate(order.createdAt.toISOString(), options.timeZone);
      return orderDate >= options.startDate && orderDate <= options.endDate;
    });
    const comparisonRevenue = options.allOrders
      .filter((order) => {
        const orderDate = toLocalDate(
          order.createdAt.toISOString(),
          options.timeZone,
        );
        return (
          orderDate >= options.comparisonStartDate &&
          orderDate <= options.comparisonEndDate
        );
      })
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const totalRevenue = periodOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0,
    );
    const totalOrders = periodOrders.length;
    const customerCount = new Set(periodOrders.map((order) => order.customerId))
      .size;
    const averageOrderValue =
      totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders);

    const statusBreakdown = {
      new: periodOrders.filter((order) => order.status === 'new').length,
      confirmed: periodOrders.filter((order) => order.status === 'confirmed')
        .length,
      out_for_delivery: periodOrders.filter(
        (order) => order.status === 'out_for_delivery',
      ).length,
      delivered: periodOrders.filter((order) => order.status === 'delivered')
        .length,
    };

    const dailyMap = new Map<
      string,
      { order_count: number; revenue: number; delivered_count: number }
    >();
    const productMap = new Map<string, { qty: number; revenue: number }>();
    const customerMap = new Map<
      string,
      { order_count: number; total_spent: number; customer_name: string }
    >();

    for (const order of periodOrders) {
      const orderDate = toLocalDate(order.createdAt.toISOString(), options.timeZone);
      const dayEntry = dailyMap.get(orderDate) ?? {
        order_count: 0,
        revenue: 0,
        delivered_count: 0,
      };
      dayEntry.order_count += 1;
      dayEntry.revenue += order.totalPrice;
      if (order.status === 'delivered') {
        dayEntry.delivered_count += 1;
      }
      dailyMap.set(orderDate, dayEntry);

      const customerEntry = customerMap.get(order.customerId) ?? {
        order_count: 0,
        total_spent: 0,
        customer_name: order.customer.name,
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
      id: `${options.reportType}_${options.shopId}_${options.periodKey}`,
      shop_id: options.shopId,
      report_type: options.reportType,
      period_key: options.periodKey,
      period_label: options.periodLabel,
      period_start_date: options.startDate,
      period_end_date: options.endDate,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      delivered_count: statusBreakdown.delivered,
      pending_count:
        statusBreakdown.new +
        statusBreakdown.confirmed +
        statusBreakdown.out_for_delivery,
      customer_count: customerCount,
      average_order_value: averageOrderValue,
      revenue_delta_vs_previous_period: totalRevenue - comparisonRevenue,
      delivered_rate:
        totalOrders === 0
          ? 0
          : Math.round((statusBreakdown.delivered / totalOrders) * 100),
      status_breakdown: statusBreakdown,
      daily_breakdown: this.enumerateDates(options.startDate, options.endDate).map(
        (date) => {
          const value = dailyMap.get(date) ?? {
            order_count: 0,
            revenue: 0,
            delivered_count: 0,
          };
          return {
            date,
            label: this.formatShortDateLabel(date),
            order_count: value.order_count,
            revenue: value.revenue,
            delivered_count: value.delivered_count,
            pending_count: value.order_count - value.delivered_count,
          };
        },
      ),
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
        .map(([customerId, value]) => ({
          customer_id: customerId,
          customer_name: value.customer_name,
          order_count: value.order_count,
          total_spent: value.total_spent,
        })),
      recent_orders: periodOrders.slice(0, 5).map((order) => ({
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

  private resolveWeekRange(anchorDate: string) {
    const date = new Date(`${anchorDate}T00:00:00.000Z`);
    const dayOfWeek = date.getUTCDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    date.setUTCDate(date.getUTCDate() - diffToMonday);
    const startDate = date.toISOString().slice(0, 10);
    const endDate = this.shiftDate(startDate, 6);
    return { startDate, endDate };
  }

  private resolveMonthRange(monthKey: string) {
    const startDate = `${monthKey}-01`;
    const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
    const endDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    return { startDate, endDate };
  }

  private shiftDate(dateString: string, days: number): string {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private shiftMonth(monthKey: string, delta: number): string {
    const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    return date.toISOString().slice(0, 7);
  }

  private toMonthKey(dateString: string): string {
    return dateString.slice(0, 7);
  }

  private enumerateDates(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      dates.push(cursor);
      cursor = this.shiftDate(cursor, 1);
    }
    return dates;
  }

  private formatShortDateLabel(dateString: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${dateString}T00:00:00.000Z`));
  }

  private formatDateRangeLabel(startDate: string, endDate: string): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${formatter.format(new Date(`${startDate}T00:00:00.000Z`))} - ${formatter.format(new Date(`${endDate}T00:00:00.000Z`))}`;
  }

  private formatMonthLabel(monthKey: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${monthKey}-01T00:00:00.000Z`));
  }
}
