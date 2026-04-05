import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import { paged } from '../common/http/api-result';
import { notFoundError } from '../common/http/app-http.exception';
import { paginate } from '../common/utils/pagination';
import {
  assertValid,
  optionalString,
  requiredString,
} from '../common/utils/validation';
import { ShopsService } from '../shops/shops.service';
import { InMemoryStoreService } from '../store/in-memory-store.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly store: InMemoryStoreService,
    private readonly shopsService: ShopsService,
  ) {}

  listCustomers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    this.shopsService.assertShopAccess(currentUser.id, shopId);
    const search =
      typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
    const segment = typeof query.segment === 'string' ? query.segment : 'all';
    const sort = typeof query.sort === 'string' ? query.sort : undefined;

    let customers = this.store.customers
      .filter((customer) => customer.shopId === shopId)
      .map((customer) => this.serializeCustomer(customer.id));

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

  createCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    this.shopsService.assertShopAccess(currentUser.id, shopId);
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

    const existing = this.store.customers.find(
      (customer) => customer.shopId === shopId && customer.phone === phone,
    );
    if (existing) {
      existing.name = name;
      existing.township = township ?? existing.township;
      existing.address = address ?? existing.address;
      existing.notes = notes ?? existing.notes;
      return this.serializeCustomer(existing.id);
    }

    const customer = this.store.createCustomer({
      shopId,
      name,
      phone,
      township,
      address,
      notes,
    });
    return this.serializeCustomer(customer.id);
  }

  getCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    customerId: string,
  ) {
    this.shopsService.assertShopAccess(currentUser.id, shopId);
    const customer = this.store.findCustomerById(customerId);
    if (!customer || customer.shopId !== shopId) {
      throw notFoundError('Customer not found');
    }
    return this.serializeCustomer(customerId, { includeHistory: true });
  }

  updateCustomer(
    currentUser: AuthenticatedUser,
    shopId: string,
    customerId: string,
    body: Record<string, unknown>,
  ) {
    this.shopsService.assertShopAccess(currentUser.id, shopId);
    const customer = this.store.findCustomerById(customerId);
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

    if (name) {
      customer.name = name;
    }
    if (phone) {
      customer.phone = phone;
    }
    if (township !== undefined) {
      customer.township = township ?? null;
    }
    if (address !== undefined) {
      customer.address = address ?? null;
    }
    if (notes !== undefined) {
      customer.notes = notes ?? null;
    }

    return this.serializeCustomer(customer.id, { includeHistory: true });
  }

  serializeCustomer(
    customerId: string,
    options?: { includeHistory?: boolean },
  ) {
    const customer = this.store.findCustomerById(customerId);
    if (!customer) {
      throw notFoundError('Customer not found');
    }

    const orders = this.store.orders
      .filter(
        (order) =>
          order.customerId === customerId && order.status !== 'cancelled',
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const deliveredCount = orders.filter(
      (order) => order.status === 'delivered',
    ).length;
    const latestOrder = orders[0];

    const productFrequency = new Map<
      string,
      { qty: number; revenue: number }
    >();
    for (const order of orders) {
      const items = this.store.orderItems.filter(
        (item) => item.orderId === order.id,
      );
      for (const item of items) {
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
      (max, order) => Math.max(max, order.totalPrice),
      0,
    );
    const isVip = totalSpent >= 200000 || orders.length >= 10;
    const isNewThisWeek =
      Date.now() - new Date(customer.createdAt).getTime() <=
      7 * 24 * 60 * 60 * 1000;

    return {
      id: customer.id,
      shop_id: customer.shopId,
      name: customer.name,
      phone: customer.phone,
      township: customer.township,
      address: customer.address,
      notes: customer.notes,
      created_at: customer.createdAt,
      total_orders: orders.length,
      total_spent: totalSpent,
      last_order_at: latestOrder?.createdAt ?? null,
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
            recent_orders: orders.slice(0, 10).map((order) => {
              const firstItem = this.store.orderItems.find(
                (item) => item.orderId === order.id,
              );
              return {
                id: order.id,
                order_no: order.orderNo,
                status: order.status,
                total_price: order.totalPrice,
                created_at: order.createdAt,
                product_name: firstItem?.productName ?? 'Item',
              };
            }),
          }
        : {}),
    };
  }
}
