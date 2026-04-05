import { Injectable } from '@nestjs/common';
import { paged } from '../common/http/api-result';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paginate } from '../common/utils/pagination';
import { ShopsService } from '../shops/shops.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async listCustomers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: ListCustomersQueryDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const search = query.search?.trim().toLowerCase() ?? '';
    const segment = query.segment ?? 'all';
    const sort = query.sort;

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

    const page = paginate(customers, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async createCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateCustomerDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const phone = this.normalizePhone(body.phone);

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
            name: body.name,
            township: body.township ?? existing.township,
            address: body.address ?? existing.address,
            notes: body.notes ?? existing.notes,
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
            shopId,
            name: body.name,
            phone,
            township: body.township ?? null,
            address: body.address ?? null,
            notes: body.notes ?? null,
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
    body: UpdateCustomerDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.shopId !== shopId) {
      throw notFoundError('Customer not found');
    }

    if (
      !body.name &&
      !body.phone &&
      body.township === undefined &&
      body.address === undefined &&
      body.notes === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const phone = body.phone ? this.normalizePhone(body.phone) : undefined;

    if (phone && phone !== customer.phone) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: {
          shopId_phone: {
            shopId,
            phone,
          },
        },
      });
      if (existingCustomer && existingCustomer.id !== customer.id) {
        throw conflictError('Another customer with this phone already exists');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(phone ? { phone } : {}),
        ...(body.township !== undefined
          ? { township: body.township ?? null }
          : {}),
        ...(body.address !== undefined
          ? { address: body.address ?? null }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
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

    const productFrequency = new Map<
      string,
      { qty: number; revenue: number }
    >();
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

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, ' ').trim();
  }
}
