import { Injectable } from '@nestjs/common';
import { paged } from '../common/http/api-result';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import { notFoundError } from '../common/http/app-http.exception';
import { paginate } from '../common/utils/pagination';
import {
  assertValid,
  optionalString,
  requiredString,
} from '../common/utils/validation';
import { ShopsService } from '../shops/shops.service';
import { generateId } from '../common/utils/id';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async listCustomers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const search =
      typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
    const segment = typeof query.segment === 'string' ? query.segment : 'all';
    const sort = typeof query.sort === 'string' ? query.sort : undefined;

    let customers = (
      await this.prisma.customer.findMany({
        where: { shopId },
        include: {
          orders: {
            where: { status: { not: 'cancelled' } },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    ).map((customer) => this.serializeCustomerRecord(customer));

    if (search) {
      customers = customers.filter((customer) =>
        [customer.name, customer.phone, customer.township, customer.address]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search),
      );
    }

    if (segment === 'vip') {
      customers = customers.filter((customer) => customer.is_vip);
    } else if (segment === 'new_this_week') {
      customers = customers.filter((customer) => customer.is_new_this_week);
    } else if (segment === 'top_spenders') {
      customers = [...customers].sort(
        (left, right) => right.total_spent - left.total_spent,
      );
    }

    if (sort === 'recent') {
      customers = [...customers].sort((left, right) =>
        (right.last_order_at ?? '').localeCompare(left.last_order_at ?? ''),
      );
    } else if (sort === 'top_spenders' && segment !== 'top_spenders') {
      customers = [...customers].sort(
        (left, right) => right.total_spent - left.total_spent,
      );
    } else if (segment !== 'top_spenders') {
      customers = [...customers].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    }

    const page = paginate(
      customers,
      query.limit as string | undefined,
      query.cursor as string | undefined,
    );
    return paged(page.items, page.pagination);
  }

  async createCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = requiredString(body.name, 'name', errors, 'customer name');
    const phone = requiredString(body.phone, 'phone', errors, 'phone number');
    const township = optionalString(
      body.township,
      'township',
      errors,
      'township',
    );
    const address = optionalString(body.address, 'address', errors, 'address');
    const notes = optionalString(body.notes, 'notes', errors, 'notes');
    assertValid(errors);

    const existing = await this.prisma.customer.findUnique({
      where: {
        shopId_phone: {
          shopId,
          phone,
        },
      },
    });

    const customer = existing
      ? await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            name,
            township: township ?? existing.township,
            address: address ?? existing.address,
            notes: notes ?? existing.notes,
          },
          include: {
            orders: {
              where: { status: { not: 'cancelled' } },
              include: { items: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        })
      : await this.prisma.customer.create({
          data: {
            id: generateId('cus'),
            shopId,
            name,
            phone,
            township: township ?? null,
            address: address ?? null,
            notes: notes ?? null,
          },
          include: {
            orders: {
              where: { status: { not: 'cancelled' } },
              include: { items: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

    return this.serializeCustomerRecord(customer);
  }

  async getCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    customerId: string,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer || customer.shopId !== shopId) {
      throw notFoundError('Customer not found');
    }

    return this.serializeCustomerRecord(customer, { includeHistory: true });
  }

  async updateCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    customerId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.shopId !== shopId) {
      throw notFoundError('Customer not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = optionalString(body.name, 'name', errors, 'customer name');
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    const township = optionalString(
      body.township,
      'township',
      errors,
      'township',
    );
    const address = optionalString(body.address, 'address', errors, 'address');
    const notes = optionalString(body.notes, 'notes', errors, 'notes');
    assertValid(errors);

    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(township !== undefined ? { township: township ?? null } : {}),
        ...(address !== undefined ? { address: address ?? null } : {}),
        ...(notes !== undefined ? { notes: notes ?? null } : {}),
      },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.serializeCustomerRecord(updated, { includeHistory: true });
  }

  private serializeCustomerRecord(
    customer: any,
    options?: { includeHistory?: boolean },
  ) {
    const orders = [...customer.orders].sort((left, right) =>
      right.createdAt.toISOString().localeCompare(left.createdAt.toISOString()),
    );
    const totalSpent = orders.reduce(
      (sum: number, order: any) => sum + order.totalPrice,
      0,
    );
    const deliveredCount = orders.filter(
      (order: any) => order.status === 'delivered',
    ).length;
    const latestOrder = orders[0];

    const productFrequency = new Map<string, { qty: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const current = productFrequency.get(item.productName) ?? {
          qty: 0,
          revenue: 0,
        };
        current.qty += item.qty;
        current.revenue += item.lineTotal;
        productFrequency.set(item.productName, current);
      }
    }

    const favouriteItem =
      [...productFrequency.entries()].sort(
        (left, right) => right[1].qty - left[1].qty,
      )[0]?.[0] ?? null;
    const largestOrder = orders.reduce(
      (max: number, order: any) => Math.max(max, order.totalPrice),
      0,
    );
    const isVip = totalSpent >= 200000 || orders.length >= 10;
    const isNewThisWeek =
      Date.now() - customer.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;

    return {
      id: customer.id,
      shop_id: customer.shopId,
      name: customer.name,
      phone: customer.phone,
      township: customer.township,
      address: customer.address,
      notes: customer.notes,
      created_at: customer.createdAt.toISOString(),
      total_orders: orders.length,
      total_spent: totalSpent,
      last_order_at: latestOrder?.createdAt.toISOString() ?? null,
      delivered_rate:
        orders.length === 0
          ? 0
          : Math.round((deliveredCount / orders.length) * 100),
      is_vip: isVip,
      is_new_this_week: isNewThisWeek,
      largest_order_total: largestOrder,
      favourite_item: favouriteItem,
      ...(options?.includeHistory
        ? {
            recent_orders: orders.slice(0, 10).map((order: any) => ({
              id: order.id,
              order_no: order.orderNo,
              status: order.status,
              total_price: order.totalPrice,
              created_at: order.createdAt.toISOString(),
              product_name: order.items[0]?.productName ?? 'Item',
            })),
          }
        : {}),
    };
  }
}
