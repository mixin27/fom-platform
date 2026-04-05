import { Injectable } from '@nestjs/common';
import { paged } from '../common/http/api-result';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  notFoundError,
} from '../common/http/app-http.exception';
import { toLocalDate } from '../common/utils/dates';
import { generateId } from '../common/utils/id';
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

type DbClient = PrismaService | any;

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
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async listOrders(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const requestedStatus =
      typeof query.status === 'string' ? query.status.trim() : undefined;
    const requestedDate =
      typeof query.date === 'string' ? query.date.trim() : undefined;
    const search =
      typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';

    let orders = await this.prisma.order.findMany({
      where: { shopId },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (requestedStatus) {
      orders = orders.filter((order) =>
        this.matchesStatus(order.status, requestedStatus),
      );
    }

    if (requestedDate) {
      const targetDate =
        requestedDate === 'today'
          ? await this.resolveReferenceDate(shopId, shop.timezone)
          : requestedDate;
      orders = orders.filter(
        (order) => toLocalDate(order.createdAt.toISOString(), shop.timezone) === targetDate,
      );
    }

    if (search) {
      orders = orders.filter((order) =>
        [
          order.orderNo,
          order.customer.name,
          order.customer.phone,
          order.customer.address ?? '',
          order.customer.township ?? '',
          ...order.items.map((item) => item.productName),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search),
      );
    }

    const serialized = orders.map((order) => this.serializeOrderRecord(order));
    const page = paginate(
      serialized,
      query.limit as string | undefined,
      query.cursor as string | undefined,
    );
    return paged(page.items, page.pagination);
  }

  async createOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.resolveCustomer(tx, shopId, body);
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
      const order = await tx.order.create({
        data: {
          id: generateId('ord'),
          shopId,
          customerId: customer.id,
          orderNo: await this.nextOrderNumber(tx, shopId),
          status,
          totalPrice: subtotal + deliveryFee,
          currency,
          deliveryFee,
          note,
          source,
          items: {
            create: items.map((item) => ({
              id: generateId('item'),
              productName: item.productName,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.qty * item.unitPrice,
            })),
          },
          statusEvents: {
            create: {
              id: generateId('evt'),
              fromStatus: null,
              toStatus: status,
              changedByUserId: currentUser.id,
              note: note ? `Created order: ${note}` : 'Order created',
            },
          },
        },
        include: {
          customer: true,
          items: true,
          statusEvents: {
            include: { changedByUser: true },
            orderBy: { changedAt: 'desc' },
          },
        },
      });

      return this.serializeOrderRecord(order, { includeHistory: true });
    });
  }

  async getOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);
    const order = await this.requireOrderForShop(this.prisma, shopId, orderId);
    return this.serializeOrder(order.id, { includeHistory: true });
  }

  async updateOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    return this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
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

      if (customerId) {
        const customer = await this.requireCustomer(tx, customerId);
        if (customer.shopId !== shopId) {
          throw conflictError('Customer does not belong to this shop');
        }
      }

      const subtotal = await this.sumOrderItems(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          ...(deliveryFee !== undefined ? { deliveryFee } : {}),
          ...(note !== undefined ? { note: note ?? null } : {}),
          ...(currency ? { currency } : {}),
          ...(source ? { source } : {}),
          ...(customerId ? { customerId } : {}),
          totalPrice: subtotal + (deliveryFee ?? order.deliveryFee),
        },
      });

      return this.serializeOrder(order.id, { includeHistory: true }, tx);
    });
  }

  async changeStatus(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    return this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
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

      await tx.order.update({
        where: { id: order.id },
        data: { status },
      });
      await tx.orderStatusEvent.create({
        data: {
          id: generateId('evt'),
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          changedByUserId: currentUser.id,
          note,
        },
      });

      return this.serializeOrder(order.id, { includeHistory: true }, tx);
    });
  }

  async addItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    return this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
      const item = this.parseItem(body, 'item');

      const created = await tx.orderItem.create({
        data: {
          id: generateId('item'),
          orderId: order.id,
          productName: item.productName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.qty * item.unitPrice,
        },
      });

      const subtotal = await this.sumOrderItems(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          totalPrice: subtotal + order.deliveryFee,
        },
      });

      return this.serializeItemRecord(created);
    });
  }

  async updateItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    itemId: string,
    body: Record<string, unknown>,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    return this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
      const item = await tx.orderItem.findFirst({
        where: {
          id: itemId,
          orderId: order.id,
        },
      });
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

      const updated = await tx.orderItem.update({
        where: { id: item.id },
        data: {
          ...(productName ? { productName } : {}),
          ...(qty !== undefined ? { qty } : {}),
          ...(unitPrice !== undefined ? { unitPrice } : {}),
          lineTotal: (qty ?? item.qty) * (unitPrice ?? item.unitPrice),
        },
      });

      const subtotal = await this.sumOrderItems(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          totalPrice: subtotal + order.deliveryFee,
        },
      });

      return this.serializeItemRecord(updated);
    });
  }

  async removeItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    itemId: string,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    await this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });
      if (orderItems.length <= 1) {
        throw conflictError('Order must contain at least one item');
      }

      const item = orderItems.find((entry) => entry.id === itemId);
      if (!item) {
        throw notFoundError('Order item not found');
      }

      await tx.orderItem.delete({
        where: { id: item.id },
      });
      const subtotal = await this.sumOrderItems(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          totalPrice: subtotal + order.deliveryFee,
        },
      });
    });
  }

  async serializeOrder(
    orderId: string,
    options?: { includeHistory?: boolean },
    db: DbClient = this.prisma,
  ) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        statusEvents: {
          include: { changedByUser: true },
          orderBy: { changedAt: 'desc' },
        },
      },
    });
    if (!order) {
      throw notFoundError('Order not found');
    }

    return this.serializeOrderRecord(order, options);
  }

  async serializeItem(itemId: string, db: DbClient = this.prisma) {
    const item = await db.orderItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw notFoundError('Order item not found');
    }

    return this.serializeItemRecord(item);
  }

  private serializeOrderRecord(order: any, options?: { includeHistory?: boolean }) {
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
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        township: order.customer.township,
        address: order.customer.address,
      },
      items: order.items.map((item: any) => this.serializeItemRecord(item)),
    };

    return options?.includeHistory
      ? {
          ...response,
          status_history: order.statusEvents.map((event: any) => ({
            id: event.id,
            from_status: event.fromStatus,
            to_status: event.toStatus,
            changed_at: event.changedAt.toISOString(),
            note: event.note,
            changed_by: event.changedByUser
              ? {
                  id: event.changedByUser.id,
                  name: event.changedByUser.name,
                }
              : null,
          })),
        }
      : response;
  }

  private serializeItemRecord(item: any) {
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

  private async resolveCustomer(
    db: DbClient,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const customerId = optionalString(
      body.customer_id,
      'customer_id',
      errors,
      'customer ID',
    );
    if (customerId) {
      assertValid(errors);
      const customer = await this.requireCustomer(db, customerId);
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

    const existing = await db.customer.findUnique({
      where: {
        shopId_phone: {
          shopId,
          phone,
        },
      },
    });
    if (existing) {
      return db.customer.update({
        where: { id: existing.id },
        data: {
          name,
          township: township ?? existing.township,
          address: address ?? existing.address,
        },
      });
    }

    return db.customer.create({
      data: {
        id: generateId('cus'),
        shopId,
        name,
        phone,
        township: township ?? null,
        address: address ?? null,
      },
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

  private async requireOrderForShop(db: DbClient, shopId: string, orderId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.shopId !== shopId) {
      throw notFoundError('Order not found');
    }
    return order;
  }

  private async requireCustomer(db: DbClient, customerId: string) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw notFoundError('Customer not found');
    }
    return customer;
  }

  private async sumOrderItems(db: DbClient, orderId: string): Promise<number> {
    const items = await db.orderItem.findMany({
      where: { orderId },
      select: { lineTotal: true },
    });
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  private async nextOrderNumber(db: DbClient, shopId: string): Promise<string> {
    const orders = await db.order.findMany({
      where: { shopId },
      select: { orderNo: true },
    });
    const maxOrderSequence = orders.reduce((max, order) => {
      const match = order.orderNo.match(/ORD-(\d+)/);
      if (!match) {
        return max;
      }
      return Math.max(max, Number.parseInt(match[1] ?? '0', 10));
    }, 240);

    return `ORD-${String(maxOrderSequence + 1).padStart(4, '0')}`;
  }

  private matchesStatus(orderStatus: string, requestedStatus: string): boolean {
    if (requestedStatus === 'pending') {
      return ['new', 'confirmed', 'out_for_delivery'].includes(orderStatus);
    }
    return orderStatus === requestedStatus;
  }

  private assertValidTransition(current: string, next: string): void {
    if (current === 'delivered' || current === 'cancelled') {
      throw conflictError(`Order status already ${current}`);
    }

    if (next === 'cancelled') {
      return;
    }

    const rank: Record<string, number> = {
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
}
