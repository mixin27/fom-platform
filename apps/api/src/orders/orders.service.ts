import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import { paged } from '../common/http/api-result';
import {
  conflictError,
  notFoundError,
} from '../common/http/app-http.exception';
import { toLocalDate } from '../common/utils/dates';
import { paginate } from '../common/utils/pagination';
import {
  assertValid,
  asEnum,
  isRecord,
  optionalNumber,
  optionalString,
  requiredArray,
  requiredNumber,
  requiredRecord,
  requiredString,
} from '../common/utils/validation';
import { ShopsService } from '../shops/shops.service';
import { InMemoryStoreService } from '../store/in-memory-store.service';
import type {
  CustomerRecord,
  OrderRecord,
  OrderStatus,
} from '../store/store.types';

type NewOrderItem = {
  productName: string;
  qty: number;
  unitPrice: number;
};

@Injectable()
export class OrdersService {
  private readonly validStatuses = [
    'new',
    'confirmed',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ] as const;

  constructor(
    private readonly store: InMemoryStoreService,
    private readonly shopsService: ShopsService,
  ) {}

  listOrders(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    const { shop } = this.shopsService.assertShopAccess(currentUser.id, shopId);
    const requestedStatus =
      typeof query.status === 'string' ? query.status.trim() : undefined;
    const requestedDate =
      typeof query.date === 'string' ? query.date.trim() : undefined;
    const search =
      typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';

    let orders = this.store.orders
      .filter((order) => order.shopId === shopId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    if (requestedStatus) {
      orders = orders.filter((order) =>
        this.matchesStatus(order.status, requestedStatus),
      );
    }

    if (requestedDate) {
      const targetDate =
        requestedDate === 'today'
          ? this.resolveReferenceDate(shopId, shop.timezone)
          : requestedDate;
      orders = orders.filter(
        (order) => toLocalDate(order.createdAt, shop.timezone) === targetDate,
      );
    }

    if (search) {
      orders = orders.filter((order) => {
        const customer = this.requireCustomer(order.customerId);
        const items = this.store.orderItems.filter(
          (item) => item.orderId === order.id,
        );
        return [
          order.orderNo,
          customer.name,
          customer.phone,
          customer.address ?? '',
          customer.township ?? '',
          ...items.map((item) => item.productName),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });
    }

    const serialized = orders.map((order) => this.serializeOrder(order.id));
    const page = paginate(
      serialized,
      query.limit as string | undefined,
      query.cursor as string | undefined,
    );
    return paged(page.items, page.pagination);
  }

  createOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    this.shopsService.assertShopAccess(currentUser.id, shopId);

    const customer = this.resolveCustomer(shopId, body);
    const items = this.extractItems(body);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const deliveryFee =
      optionalNumber(body.delivery_fee, 'delivery_fee', errors, {
        min: 0,
        label: 'delivery fee',
      }) ?? 0;
    const note = optionalString(body.note, 'note', errors, 'note') ?? null;
    const currency =
      optionalString(body.currency, 'currency', errors, 'currency') ?? 'MMK';
    const source =
      asEnum(body.source, 'source', ['messenger', 'manual'] as const, errors, {
        label: 'source',
      }) ?? 'manual';
    const status =
      asEnum(body.status, 'status', this.validStatuses, errors, {
        label: 'status',
      }) ?? 'new';
    assertValid(errors);

    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0,
    );
    const order: OrderRecord = {
      id: this.store.generateId('ord'),
      shopId,
      customerId: customer.id,
      orderNo: this.store.nextOrderNumber(shopId),
      status,
      totalPrice: subtotal + deliveryFee,
      currency,
      deliveryFee,
      note,
      source,
      createdAt: this.store.now(),
      updatedAt: this.store.now(),
    };
    this.store.orders.push(order);

    for (const item of items) {
      this.store.orderItems.push({
        id: this.store.generateId('item'),
        orderId: order.id,
        productId: null,
        productName: item.productName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.qty * item.unitPrice,
      });
    }

    this.store.orderStatusEvents.push({
      id: this.store.generateId('evt'),
      orderId: order.id,
      fromStatus: null,
      toStatus: status,
      changedByUserId: currentUser.id,
      changedAt: this.store.now(),
      note: note ? `Created order: ${note}` : 'Order created',
    });

    return this.serializeOrder(order.id, { includeHistory: true });
  }

  getOrder(currentUser: AuthenticatedUser, shopId: string, orderId: string) {
    this.requireOrderForShop(currentUser.id, shopId, orderId);
    return this.serializeOrder(orderId, { includeHistory: true });
  }

  updateOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    const order = this.requireOrderForShop(currentUser.id, shopId, orderId);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const deliveryFee = optionalNumber(
      body.delivery_fee,
      'delivery_fee',
      errors,
      {
        min: 0,
        label: 'delivery fee',
      },
    );
    const note = optionalString(body.note, 'note', errors, 'note');
    const currency = optionalString(
      body.currency,
      'currency',
      errors,
      'currency',
    );
    const source = asEnum(
      body.source,
      'source',
      ['messenger', 'manual'] as const,
      errors,
      {
        label: 'source',
      },
    );
    const customerId = optionalString(
      body.customer_id,
      'customer_id',
      errors,
      'customer ID',
    );
    assertValid(errors);

    if (deliveryFee !== undefined) {
      order.deliveryFee = deliveryFee;
    }
    if (note !== undefined) {
      order.note = note ?? null;
    }
    if (currency) {
      order.currency = currency;
    }
    if (source) {
      order.source = source;
    }
    if (customerId) {
      const customer = this.requireCustomer(customerId);
      if (customer.shopId !== shopId) {
        throw conflictError('Customer does not belong to this shop');
      }
      order.customerId = customer.id;
    }

    this.recalculateTotal(order.id);
    order.updatedAt = this.store.now();

    return this.serializeOrder(order.id, { includeHistory: true });
  }

  changeStatus(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    const order = this.requireOrderForShop(currentUser.id, shopId, orderId);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const status = asEnum(body.status, 'status', this.validStatuses, errors, {
      required: true,
      label: 'status',
    });
    const note = optionalString(body.note, 'note', errors, 'note') ?? null;
    assertValid(errors);

    if (!status) {
      throw conflictError('Status is required');
    }

    if (order.status === status) {
      throw conflictError(`Order status already ${status}`);
    }

    this.assertValidTransition(order.status, status);
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = this.store.now();

    this.store.orderStatusEvents.push({
      id: this.store.generateId('evt'),
      orderId: order.id,
      fromStatus: previousStatus,
      toStatus: status,
      changedByUserId: currentUser.id,
      changedAt: order.updatedAt,
      note,
    });

    return this.serializeOrder(order.id, { includeHistory: true });
  }

  addItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    const order = this.requireOrderForShop(currentUser.id, shopId, orderId);
    const item = this.parseItem(body, 'item');

    const created = {
      id: this.store.generateId('item'),
      orderId: order.id,
      productId: null,
      productName: item.productName,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.qty * item.unitPrice,
    };
    this.store.orderItems.push(created);
    this.recalculateTotal(order.id);
    order.updatedAt = this.store.now();

    return this.serializeItem(created.id);
  }

  updateItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    itemId: string,
    body: Record<string, unknown>,
  ) {
    const order = this.requireOrderForShop(currentUser.id, shopId, orderId);
    const item = this.store.orderItems.find(
      (entry) => entry.id === itemId && entry.orderId === order.id,
    );
    if (!item) {
      throw notFoundError('Order item not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const productName = optionalString(
      body.product_name,
      'product_name',
      errors,
      'product name',
    );
    const qty = optionalNumber(body.qty, 'qty', errors, {
      min: 1,
      integer: true,
      label: 'quantity',
    });
    const unitPrice = optionalNumber(body.unit_price, 'unit_price', errors, {
      min: 0,
      label: 'unit price',
    });
    assertValid(errors);

    if (productName) {
      item.productName = productName;
    }
    if (qty !== undefined) {
      item.qty = qty;
    }
    if (unitPrice !== undefined) {
      item.unitPrice = unitPrice;
    }
    item.lineTotal = item.qty * item.unitPrice;

    this.recalculateTotal(order.id);
    order.updatedAt = this.store.now();

    return this.serializeItem(item.id);
  }

  removeItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    itemId: string,
  ) {
    const order = this.requireOrderForShop(currentUser.id, shopId, orderId);
    const orderItems = this.store.orderItems.filter(
      (item) => item.orderId === order.id,
    );
    if (orderItems.length <= 1) {
      throw conflictError('Order must contain at least one item');
    }

    const index = this.store.orderItems.findIndex(
      (item) => item.id === itemId && item.orderId === order.id,
    );
    if (index < 0) {
      throw notFoundError('Order item not found');
    }

    this.store.orderItems.splice(index, 1);
    this.recalculateTotal(order.id);
    order.updatedAt = this.store.now();
  }

  serializeOrder(orderId: string, options?: { includeHistory?: boolean }) {
    const order = this.store.findOrderById(orderId);
    if (!order) {
      throw notFoundError('Order not found');
    }

    const customer = this.requireCustomer(order.customerId);
    const items = this.store.orderItems
      .filter((item) => item.orderId === order.id)
      .map((item) => this.serializeItem(item.id));
    const statusHistory = this.store.orderStatusEvents
      .filter((event) => event.orderId === order.id)
      .sort((left, right) => right.changedAt.localeCompare(left.changedAt))
      .map((event) => {
        const actor = this.store.findUserById(event.changedByUserId);
        return {
          id: event.id,
          from_status: event.fromStatus,
          to_status: event.toStatus,
          changed_at: event.changedAt,
          note: event.note,
          changed_by: actor
            ? {
                id: actor.id,
                name: actor.name,
              }
            : null,
        };
      });

    const response = {
      id: order.id,
      shop_id: order.shopId,
      customer_id: order.customerId,
      order_no: order.orderNo,
      status: order.status,
      total_price: order.totalPrice,
      currency: order.currency,
      delivery_fee: order.deliveryFee,
      note: order.note,
      source: order.source,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        township: customer.township,
        address: customer.address,
      },
      items,
    };

    return options?.includeHistory
      ? {
          ...response,
          status_history: statusHistory,
        }
      : response;
  }

  serializeItem(itemId: string) {
    const item = this.store.orderItems.find((entry) => entry.id === itemId);
    if (!item) {
      throw notFoundError('Order item not found');
    }

    return {
      id: item.id,
      order_id: item.orderId,
      product_id: item.productId,
      product_name: item.productName,
      qty: item.qty,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    };
  }

  private resolveCustomer(
    shopId: string,
    body: Record<string, unknown>,
  ): CustomerRecord {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const customerId = optionalString(
      body.customer_id,
      'customer_id',
      errors,
      'customer ID',
    );
    if (customerId) {
      assertValid(errors);
      const customer = this.requireCustomer(customerId);
      if (customer.shopId !== shopId) {
        throw conflictError('Customer does not belong to this shop');
      }
      return customer;
    }

    const source = isRecord(body.customer) ? body.customer : body;
    const name = requiredString(
      source.customer_name ?? source.name,
      'customer_name',
      errors,
      'customer name',
    );
    const phone = requiredString(source.phone, 'phone', errors, 'phone number');
    const township = optionalString(
      source.township,
      'township',
      errors,
      'township',
    );
    const address = optionalString(
      source.address,
      'address',
      errors,
      'address',
    );
    assertValid(errors);

    const existing = this.store.customers.find(
      (customer) => customer.shopId === shopId && customer.phone === phone,
    );
    if (existing) {
      existing.name = name;
      existing.township = township ?? existing.township;
      existing.address = address ?? existing.address;
      return existing;
    }

    return this.store.createCustomer({
      shopId,
      name,
      phone,
      township,
      address,
    });
  }

  private extractItems(body: Record<string, unknown>): NewOrderItem[] {
    const errors: Array<{ field: string; errors: string[] }> = [];

    if (body.items !== undefined) {
      const rawItems = requiredArray(body.items, 'items', errors, 'items');
      const items = rawItems.map((rawItem, index) => {
        const record = requiredRecord(
          rawItem,
          `items.${index}`,
          errors,
          `item ${index + 1}`,
        );
        return this.parseItem(record, `items.${index}`, errors);
      });
      assertValid(errors);
      return items;
    }

    const item = this.parseItem(body, 'item', errors);
    assertValid(errors);
    return [item];
  }

  private parseItem(
    value: Record<string, unknown>,
    fieldPrefix: string,
    inheritedErrors?: Array<{ field: string; errors: string[] }>,
  ): NewOrderItem {
    const errors = inheritedErrors ?? [];
    const productName = requiredString(
      value.product_name ?? value.productName,
      `${fieldPrefix}.product_name`,
      errors,
      'product name',
    );
    const qty = requiredNumber(value.qty, `${fieldPrefix}.qty`, errors, {
      min: 1,
      integer: true,
      label: 'quantity',
    });
    const unitPrice = requiredNumber(
      value.unit_price ?? value.unitPrice,
      `${fieldPrefix}.unit_price`,
      errors,
      {
        min: 0,
        label: 'unit price',
      },
    );

    if (!inheritedErrors) {
      assertValid(errors);
    }

    return { productName, qty, unitPrice };
  }

  private requireOrderForShop(userId: string, shopId: string, orderId: string) {
    this.shopsService.assertShopAccess(userId, shopId);
    const order = this.store.findOrderById(orderId);
    if (!order || order.shopId !== shopId) {
      throw notFoundError('Order not found');
    }
    return order;
  }

  private requireCustomer(customerId: string) {
    const customer = this.store.findCustomerById(customerId);
    if (!customer) {
      throw notFoundError('Customer not found');
    }
    return customer;
  }

  private recalculateTotal(orderId: string): void {
    const order = this.store.findOrderById(orderId);
    if (!order) {
      throw notFoundError('Order not found');
    }

    const subtotal = this.store.orderItems
      .filter((item) => item.orderId === orderId)
      .reduce((sum, item) => sum + item.lineTotal, 0);
    order.totalPrice = subtotal + order.deliveryFee;
  }

  private matchesStatus(
    orderStatus: OrderStatus,
    requestedStatus: string,
  ): boolean {
    if (requestedStatus === 'pending') {
      return ['new', 'confirmed', 'out_for_delivery'].includes(orderStatus);
    }
    return orderStatus === requestedStatus;
  }

  private assertValidTransition(current: OrderStatus, next: OrderStatus): void {
    if (current === 'delivered' || current === 'cancelled') {
      throw conflictError(`Order status already ${current}`);
    }

    if (next === 'cancelled') {
      return;
    }

    const rank: Record<OrderStatus, number> = {
      new: 0,
      confirmed: 1,
      out_for_delivery: 2,
      delivered: 3,
      cancelled: 4,
    };

    if (rank[next] < rank[current]) {
      throw conflictError(
        `Cannot move order status backwards from ${current} to ${next}`,
      );
    }
  }

  private resolveReferenceDate(shopId: string, timeZone: string): string {
    const latest = this.store.orders
      .filter((order) => order.shopId === shopId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    return toLocalDate(latest?.createdAt ?? this.store.now(), timeZone);
  }
}
