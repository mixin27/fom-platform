import { Injectable, Logger } from '@nestjs/common';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { permissions } from '../common/http/rbac.constants';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { toLocalDate } from '../common/utils/dates';
import { paginate } from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ShopsService } from '../shops/shops.service';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import {
  orderStatuses,
  type OrderStatusValue,
} from './dto/order.constants';
import { ParseOrderMessageDto } from './dto/parse-order-message.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderMessageParserService } from './order-message-parser.service';

type DbClient = PrismaService | any;

type NewOrderItem = {
  productId?: string | null;
  productName: string;
  qty: number;
  unitPrice: number;
};

@Injectable()
export class OrdersService {
  private readonly validStatuses = orderStatuses;
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
    private readonly orderMessageParser: OrderMessageParserService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async listOrders(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: ListOrdersQueryDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );
    const requestedCustomerId = query.customer_id?.trim() ?? '';
    const requestedStatus = query.status;
    const requestedDate = query.date;
    const search = query.search?.toLowerCase() ?? '';

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

    if (requestedCustomerId) {
      orders = orders.filter((order) => order.customerId === requestedCustomerId);
    }

    if (requestedDate) {
      const targetDate =
        requestedDate === 'today'
          ? await this.resolveReferenceDate(shopId, shop.timezone)
          : requestedDate;
      orders = orders.filter(
        (order) =>
          toLocalDate(order.createdAt.toISOString(), shop.timezone) ===
          targetDate,
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
    const page = paginate(serialized, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async createOrder(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateOrderDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const customer = await this.resolveCustomer(tx, shopId, body);
      const items = this.extractItems(body);
      const deliveryFee = body.delivery_fee ?? 0;
      const note = body.note ?? null;
      const currency = body.currency ?? 'MMK';
      const source = body.source ?? 'manual';
      const status = body.status ?? 'new';

      const subtotal = items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0,
      );
      const order = await tx.order.create({
        data: {
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
              productId: item.productId ?? null,
              productName: item.productName,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.qty * item.unitPrice,
            })),
          },
          statusEvents: {
            create: {
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

    void this.notificationsService
      .notifyOrderCreated({
        shopId,
        shopName: shop.name,
        actorUserId: currentUser.id,
        actorName: currentUser.name,
        orderId: createdOrder.id,
        orderNo: createdOrder.order_no,
        customerName: createdOrder.customer.name,
        township: createdOrder.customer.township,
        totalPrice: createdOrder.total_price,
        currency: createdOrder.currency,
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish order-created notification for order ${createdOrder.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'created',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return createdOrder;
  }

  async parseOrderMessage(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: ParseOrderMessageDto,
  ) {
    await this.shopsService.assertPermission(
      currentUser.id,
      shopId,
      permissions.ordersWrite,
    );

    const result = this.orderMessageParser.parseMessage(body.message);
    const parsedPhone = result.suggested_order.customer.phone;

    if (parsedPhone) {
      const normalizedPhone = this.normalizePhone(parsedPhone);
      result.suggested_order.customer.phone = normalizedPhone;

      const canonicalPhone = this.toCanonicalPhone(normalizedPhone);
      const customerMatch = (
        await this.prisma.customer.findMany({
          where: { shopId },
        })
      ).find(
        (customer) => this.toCanonicalPhone(customer.phone) === canonicalPhone,
      );

      if (customerMatch) {
        this.orderMessageParser.backfillMissingCustomerFields(result, {
          name: customerMatch.name,
          phone: customerMatch.phone,
          township: customerMatch.township,
          address: customerMatch.address,
        });

        return {
          ...result,
          customer_match: {
            id: customerMatch.id,
            shop_id: customerMatch.shopId,
            name: customerMatch.name,
            phone: customerMatch.phone,
            township: customerMatch.township,
            address: customerMatch.address,
            notes: customerMatch.notes,
            created_at: customerMatch.createdAt.toISOString(),
          },
        };
      }
    }

    return {
      ...result,
      customer_match: null,
    };
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
    body: UpdateOrderDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);

      if (
        body.delivery_fee === undefined &&
        body.note === undefined &&
        body.currency === undefined &&
        body.source === undefined &&
        body.customer_id === undefined
      ) {
        throw validationError([
          {
            field: 'body',
            errors: ['Provide at least one field to update'],
          },
        ]);
      }

      if (body.customer_id) {
        const customer = await this.requireCustomer(tx, body.customer_id);
        if (customer.shopId !== shopId) {
          throw conflictError('Customer does not belong to this shop');
        }
      }

      const subtotal = await this.sumOrderItems(tx, order.id);
      await tx.order.update({
        where: { id: order.id },
        data: {
          ...(body.delivery_fee !== undefined
            ? { deliveryFee: body.delivery_fee }
            : {}),
          ...(body.note !== undefined ? { note: body.note ?? null } : {}),
          ...(body.currency !== undefined ? { currency: body.currency } : {}),
          ...(body.source !== undefined ? { source: body.source } : {}),
          ...(body.customer_id !== undefined
            ? { customerId: body.customer_id }
            : {}),
          totalPrice: subtotal + (body.delivery_fee ?? order.deliveryFee),
        },
      });

      return this.serializeOrder(order.id, { includeHistory: true }, tx);
    });

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'updated',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return updatedOrder;
  }

  async changeStatus(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: ChangeOrderStatusDto,
  ) {
    const { shop } = await this.shopsService.assertShopAccess(
      currentUser.id,
      shopId,
    );

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
      const status = body.status;
      const note = body.note ?? null;

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
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          changedByUserId: currentUser.id,
          note,
        },
      });

      return this.serializeOrder(order.id, { includeHistory: true }, tx);
    });

    void this.notificationsService
      .notifyOrderStatusChanged({
        shopId,
        shopName: shop.name,
        actorUserId: currentUser.id,
        actorName: currentUser.name,
        orderId: updatedOrder.id,
        orderNo: updatedOrder.order_no,
        customerName: updatedOrder.customer.name,
        township: updatedOrder.customer.township,
        totalPrice: updatedOrder.total_price,
        currency: updatedOrder.currency,
        statusLabel: this.toStatusLabel(updatedOrder.status),
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish order-status notification for order ${updatedOrder.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'status_changed',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return updatedOrder;
  }

  async addItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    body: AddOrderItemDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    const createdItem = await this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, orderId);
      const item = this.toNewOrderItem(body);

      const created = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId ?? null,
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

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'item_added',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return createdItem;
  }

  async updateItem(
    currentUser: AuthenticatedUser,
    shopId: string,
    orderId: string,
    itemId: string,
    body: UpdateOrderItemDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    const updatedItem = await this.prisma.$transaction(async (tx) => {
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

      if (
        body.product_id === undefined &&
        body.product_name === undefined &&
        body.qty === undefined &&
        body.unit_price === undefined
      ) {
        throw validationError([
          {
            field: 'body',
            errors: ['Provide at least one field to update'],
          },
        ]);
      }

      const updated = await tx.orderItem.update({
        where: { id: item.id },
        data: {
          ...(body.product_id !== undefined
            ? { productId: body.product_id ?? null }
            : {}),
          ...(body.product_name !== undefined
            ? { productName: body.product_name }
            : {}),
          ...(body.qty !== undefined ? { qty: body.qty } : {}),
          ...(body.unit_price !== undefined
            ? { unitPrice: body.unit_price }
            : {}),
          lineTotal: (body.qty ?? item.qty) * (body.unit_price ?? item.unitPrice),
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

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'item_updated',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return updatedItem;
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

    void this.realtimeService
      .broadcastShopInvalidation({
        shopId,
        resource: 'orders',
        action: 'item_removed',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish orders invalidation for shop ${shopId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
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

  private serializeOrderRecord(
    order: any,
    options?: { includeHistory?: boolean },
  ) {
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
    body: CreateOrderDto,
  ) {
    const inlineCustomer = body.customer
      ? {
          name: body.customer.name,
          phone: body.customer.phone,
          township: body.customer.township,
          address: body.customer.address,
        }
      : {
          name: body.customer_name,
          phone: body.phone,
          township: body.township,
          address: body.address,
        };

    if (body.customer_id) {
      const customer = await this.requireCustomer(db, body.customer_id);
      if (customer.shopId !== shopId) {
        throw conflictError('Customer does not belong to this shop');
      }

      const hasInlineCustomer =
        Boolean(inlineCustomer.name?.trim()) || Boolean(inlineCustomer.phone?.trim());

      if (!hasInlineCustomer) {
        return customer;
      }

      const inlinePhone = inlineCustomer.phone
        ? this.toCanonicalPhone(this.normalizePhone(inlineCustomer.phone))
        : null;
      const referencedPhone = this.toCanonicalPhone(customer.phone);

      if (!inlinePhone || inlinePhone === referencedPhone) {
        return db.customer.update({
          where: { id: customer.id },
          data: {
            ...(inlineCustomer.name?.trim()
              ? { name: inlineCustomer.name.trim() }
              : {}),
            ...(inlineCustomer.township !== undefined
              ? { township: inlineCustomer.township ?? customer.township }
              : {}),
            ...(inlineCustomer.address !== undefined
              ? { address: inlineCustomer.address ?? customer.address }
              : {}),
          },
        });
      }
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    if (!inlineCustomer.name) {
      errors.push({
        field: body.customer ? 'customer.name' : 'customer_name',
        errors: ['Customer name is required'],
      });
    }
    if (!inlineCustomer.phone) {
      errors.push({
        field: body.customer ? 'customer.phone' : 'phone',
        errors: ['Phone number is required'],
      });
    }
    if (errors.length > 0 || !inlineCustomer.name || !inlineCustomer.phone) {
      throw validationError(errors);
    }

    const name = inlineCustomer.name;
    const phone = this.normalizePhone(inlineCustomer.phone);
    const canonicalPhone = this.toCanonicalPhone(phone);
    const existingCustomers = await db.customer.findMany({
      where: {
        shopId,
      },
    });
    const existing = existingCustomers.find(
      (customer) => this.toCanonicalPhone(customer.phone) === canonicalPhone,
    );

    if (existing) {
      return db.customer.update({
        where: { id: existing.id },
        data: {
          name,
          phone,
          township: inlineCustomer.township ?? existing.township,
          address: inlineCustomer.address ?? existing.address,
        },
      });
    }

    return db.customer.create({
      data: {
        shopId,
        name,
        phone,
        township: inlineCustomer.township ?? null,
        address: inlineCustomer.address ?? null,
      },
    });
  }

  private extractItems(body: CreateOrderDto): NewOrderItem[] {
    if (body.items && body.items.length > 0) {
      return body.items.map((item) => this.toNewOrderItem(item));
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    if (body.product_name === undefined) {
      errors.push({
        field: 'product_name',
        errors: ['Product name is required when items is omitted'],
      });
    }
    if (body.qty === undefined) {
      errors.push({
        field: 'qty',
        errors: ['Quantity is required when items is omitted'],
      });
    }
    if (body.unit_price === undefined) {
      errors.push({
        field: 'unit_price',
        errors: ['Unit price is required when items is omitted'],
      });
    }
    if (errors.length > 0) {
      throw validationError(errors);
    }

    return [
      this.toNewOrderItem({
        product_id: body.product_id,
        product_name: body.product_name!,
        qty: body.qty!,
        unit_price: body.unit_price!,
      }),
    ];
  }

  private toNewOrderItem(item: AddOrderItemDto): NewOrderItem {
    return {
      productId: item.product_id ?? null,
      productName: item.product_name,
      qty: item.qty,
      unitPrice: item.unit_price,
    };
  }

  private async requireOrderForShop(
    db: DbClient,
    shopId: string,
    orderId: string,
  ) {
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

  private matchesStatus(
    orderStatus: string,
    requestedStatus: ListOrdersQueryDto['status'],
  ): boolean {
    if (requestedStatus === 'pending') {
      return ['new', 'confirmed', 'out_for_delivery'].includes(orderStatus);
    }
    return orderStatus === requestedStatus;
  }

  private assertValidTransition(current: string, next: OrderStatusValue): void {
    if (current === 'delivered' || current === 'cancelled') {
      throw conflictError(`Order status already ${current}`);
    }

    if (next === 'cancelled') {
      return;
    }

    const rank: Record<OrderStatusValue, number> = {
      new: 0,
      confirmed: 1,
      out_for_delivery: 2,
      delivered: 3,
      cancelled: 4,
    };

    if (rank[next] < rank[current as OrderStatusValue]) {
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

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, ' ').trim();
  }

  private toCanonicalPhone(phone: string): string {
    return phone.replace(/\+?959/, '09').replace(/\D/g, '');
  }

  private toStatusLabel(status: string): string {
    switch (status) {
      case 'new':
        return 'New order';
      case 'confirmed':
        return 'Order confirmed';
      case 'out_for_delivery':
        return 'Out for delivery';
      case 'delivered':
        return 'Order delivered';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return 'Order updated';
    }
  }
}
