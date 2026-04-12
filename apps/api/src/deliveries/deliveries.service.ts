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
import { paginate } from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { ShopsService } from '../shops/shops.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import {
  deliveryStatuses,
  type DeliveryStatusValue,
} from './dto/delivery.constants';
import { ListDeliveriesQueryDto } from './dto/list-deliveries-query.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

type DbClient = PrismaService | any;

@Injectable()
export class DeliveriesService {
  private readonly deliveryRanks: Record<DeliveryStatusValue, number> = {
    scheduled: 0,
    out_for_delivery: 1,
    delivered: 2,
  };
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listDeliveries(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: ListDeliveriesQueryDto,
  ) {
    await this.shopsService.assertPermission(
      currentUser.id,
      shopId,
      permissions.deliveriesRead,
    );

    const search = query.search?.toLowerCase() ?? '';
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        order: {
          shopId,
        },
        ...(query.status ? { status: query.status } : {}),
        ...(query.driver_user_id ? { driverUserId: query.driver_user_id } : {}),
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        driverUser: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const serialized = deliveries
      .map((delivery) => this.serializeDeliveryRecord(delivery))
      .filter((delivery) => {
        if (!search) {
          return true;
        }

        return [
          delivery.order.order_no,
          delivery.order.customer.name,
          delivery.order.customer.phone,
          delivery.address_snapshot ?? '',
          delivery.driver.name,
          delivery.driver.phone ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });

    const page = paginate(serialized, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async createDelivery(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateDeliveryDto,
  ) {
    const { shop } = await this.shopsService.assertPermission(
      currentUser.id,
      shopId,
      permissions.deliveriesWrite,
    );

    const createdDelivery = await this.prisma.$transaction(async (tx) => {
      const order = await this.requireOrderForShop(tx, shopId, body.order_id);
      await this.assertDriverBelongsToShop(shopId, body.driver_user_id);

      const existingDelivery = await tx.delivery.findUnique({
        where: { orderId: order.id },
      });
      if (existingDelivery) {
        throw conflictError('Delivery already exists for this order');
      }

      const status = body.status ?? 'scheduled';
      this.assertDeliveryAllowedForOrder(order.status, status);

      if (body.delivered_at && status !== 'delivered') {
        throw validationError([
          {
            field: 'delivered_at',
            errors: ['delivered_at can only be set when status is delivered'],
          },
        ]);
      }

      const orderWithCustomer = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          customer: true,
        },
      });
      if (!orderWithCustomer) {
        throw notFoundError('Order not found');
      }

      const addressSnapshot =
        body.address_snapshot ?? orderWithCustomer.customer.address ?? null;
      if (!addressSnapshot) {
        throw validationError([
          {
            field: 'address_snapshot',
            errors: [
              'Address snapshot is required when the order customer has no address',
            ],
          },
        ]);
      }

      const delivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          driverUserId: body.driver_user_id,
          status,
          deliveryFee:
            body.delivery_fee === null
              ? null
              : body.delivery_fee ?? (order.deliveryFee > 0 ? order.deliveryFee : null),
          addressSnapshot,
          scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : new Date(),
          deliveredAt:
            status === 'delivered'
              ? new Date(body.delivered_at ?? new Date().toISOString())
              : null,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          driverUser: true,
        },
      });

      await this.syncOrderStatusForDelivery(
        tx,
        order,
        currentUser.id,
        status,
        'Delivery created',
        delivery.deliveredAt,
      );

      return this.serializeDelivery(delivery.id, tx);
    });

    void this.notificationsService
      .notifyOrderStatusChanged({
        shopId,
        shopName: shop.name,
        actorUserId: currentUser.id,
        actorName: currentUser.name,
        orderId: createdDelivery.order.id,
        orderNo: createdDelivery.order.order_no,
        customerName: createdDelivery.order.customer.name,
        township: createdDelivery.order.customer.township,
        totalPrice: createdDelivery.order.total_price,
        currency: createdDelivery.order.currency,
        statusLabel: this.toDeliveryStatusLabel(createdDelivery.status),
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to publish delivery-created notification for delivery ${createdDelivery.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return createdDelivery;
  }

  async updateDelivery(
    currentUser: AuthenticatedUser,
    shopId: string,
    deliveryId: string,
    body: UpdateDeliveryDto,
  ) {
    const { shop } = await this.shopsService.assertPermission(
      currentUser.id,
      shopId,
      permissions.deliveriesWrite,
    );

    if (
      body.driver_user_id === undefined &&
      body.status === undefined &&
      body.delivery_fee === undefined &&
      body.address_snapshot === undefined &&
      body.scheduled_at === undefined &&
      body.delivered_at === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    const updatedDelivery = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          driverUser: true,
        },
      });

      if (!delivery || delivery.order.shopId !== shopId) {
        throw notFoundError('Delivery not found');
      }

      if (body.driver_user_id) {
        await this.assertDriverBelongsToShop(shopId, body.driver_user_id);
      }

      const nextStatus = body.status ?? delivery.status;
      this.assertForwardDeliveryTransition(delivery.status, nextStatus);
      this.assertDeliveryAllowedForOrder(delivery.order.status, nextStatus);

      if (
        body.delivered_at !== undefined &&
        body.delivered_at !== null &&
        nextStatus !== 'delivered'
      ) {
        throw validationError([
          {
            field: 'delivered_at',
            errors: ['delivered_at can only be set when status is delivered'],
          },
        ]);
      }

      const nextAddressSnapshot =
        body.address_snapshot === undefined
          ? delivery.addressSnapshot
          : body.address_snapshot ?? delivery.order.customer.address ?? null;
      if (!nextAddressSnapshot) {
        throw validationError([
          {
            field: 'address_snapshot',
            errors: ['Address snapshot cannot be empty'],
          },
        ]);
      }

      const nextDeliveredAt =
        body.delivered_at !== undefined
          ? body.delivered_at === null
            ? nextStatus === 'delivered'
              ? delivery.deliveredAt ?? new Date()
              : null
            : new Date(body.delivered_at)
          : nextStatus === 'delivered'
            ? delivery.deliveredAt ?? new Date()
            : null;

      const updated = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          ...(body.driver_user_id !== undefined
            ? { driverUserId: body.driver_user_id }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.delivery_fee !== undefined
            ? { deliveryFee: body.delivery_fee }
            : {}),
          ...(body.address_snapshot !== undefined
            ? { addressSnapshot: nextAddressSnapshot }
            : {}),
          ...(body.scheduled_at !== undefined
            ? {
                scheduledAt:
                  body.scheduled_at === null ? null : new Date(body.scheduled_at),
              }
            : {}),
          deliveredAt: nextDeliveredAt,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          driverUser: true,
        },
      });

      await this.syncOrderStatusForDelivery(
        tx,
        delivery.order,
        currentUser.id,
        nextStatus,
        'Delivery updated',
        updated.deliveredAt,
      );

      return this.serializeDelivery(updated.id, tx);
    });

    const shouldNotify =
      body.status !== undefined ||
      body.driver_user_id !== undefined ||
      body.scheduled_at !== undefined ||
      body.delivered_at !== undefined;

    if (shouldNotify) {
      void this.notificationsService
        .notifyOrderStatusChanged({
          shopId,
          shopName: shop.name,
          actorUserId: currentUser.id,
          actorName: currentUser.name,
          orderId: updatedDelivery.order.id,
          orderNo: updatedDelivery.order.order_no,
          customerName: updatedDelivery.order.customer.name,
          township: updatedDelivery.order.customer.township,
          totalPrice: updatedDelivery.order.total_price,
          currency: updatedDelivery.order.currency,
          statusLabel: this.toDeliveryStatusLabel(updatedDelivery.status),
        })
        .catch((error) => {
          this.logger.warn(
            `Failed to publish delivery-update notification for delivery ${updatedDelivery.id}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          );
        });
    }

    return updatedDelivery;
  }

  async serializeDelivery(deliveryId: string, db: DbClient = this.prisma) {
    const delivery = await db.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        driverUser: true,
      },
    });

    if (!delivery) {
      throw notFoundError('Delivery not found');
    }

    return this.serializeDeliveryRecord(delivery);
  }

  private serializeDeliveryRecord(delivery: any) {
    return {
      id: delivery.id,
      shop_id: delivery.order.shopId,
      order_id: delivery.orderId,
      driver_user_id: delivery.driverUserId,
      status: delivery.status,
      delivery_fee: delivery.deliveryFee,
      address_snapshot: delivery.addressSnapshot,
      scheduled_at: delivery.scheduledAt?.toISOString() ?? null,
      delivered_at: delivery.deliveredAt?.toISOString() ?? null,
      created_at: delivery.createdAt.toISOString(),
      updated_at: delivery.updatedAt.toISOString(),
      driver: {
        id: delivery.driverUser.id,
        name: delivery.driverUser.name,
        email: delivery.driverUser.email,
        phone: delivery.driverUser.phone,
      },
      order: {
        id: delivery.order.id,
        order_no: delivery.order.orderNo,
        status: delivery.order.status,
        total_price: delivery.order.totalPrice,
        currency: delivery.order.currency,
        delivery_fee: delivery.order.deliveryFee,
        customer: {
          id: delivery.order.customer.id,
          name: delivery.order.customer.name,
          phone: delivery.order.customer.phone,
          township: delivery.order.customer.township,
          address: delivery.order.customer.address,
        },
      },
    };
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

  private async assertDriverBelongsToShop(shopId: string, driverUserId: string) {
    try {
      await this.shopsService.assertShopAccess(driverUserId, shopId);
    } catch {
      throw validationError([
        {
          field: 'driver_user_id',
          errors: ['Driver must be an active member of the shop'],
        },
      ]);
    }
  }

  private assertForwardDeliveryTransition(
    current: DeliveryStatusValue,
    next: DeliveryStatusValue,
  ) {
    if (this.deliveryRanks[next] < this.deliveryRanks[current]) {
      throw conflictError(
        `Cannot move delivery status backwards from ${current} to ${next}`,
      );
    }
  }

  private assertDeliveryAllowedForOrder(
    orderStatus: string,
    deliveryStatus: DeliveryStatusValue,
  ) {
    if (orderStatus === 'cancelled') {
      throw conflictError('Cannot manage delivery for a cancelled order');
    }

    const orderRank = this.toOrderRank(orderStatus);
    const deliveryRank = this.toOrderRankFromDelivery(deliveryStatus);
    if (orderRank > deliveryRank) {
      throw conflictError(
        `Delivery status ${deliveryStatus} is behind the current order status ${orderStatus}`,
      );
    }
  }

  private async syncOrderStatusForDelivery(
    db: DbClient,
    order: any,
    changedByUserId: string,
    deliveryStatus: DeliveryStatusValue,
    notePrefix: string,
    deliveredAt?: Date | null,
  ) {
    const nextOrderStatus = this.toOrderStatusFromDelivery(deliveryStatus);
    if (order.status === nextOrderStatus) {
      return;
    }

    if (this.toOrderRank(order.status) > this.toOrderRank(nextOrderStatus)) {
      throw conflictError(
        `Order status ${order.status} cannot move backwards to ${nextOrderStatus}`,
      );
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        status: nextOrderStatus,
      },
    });

    await db.orderStatusEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextOrderStatus,
        changedByUserId,
        note:
          deliveryStatus === 'delivered' && deliveredAt
            ? `${notePrefix}: marked delivered at ${deliveredAt.toISOString()}`
            : `${notePrefix}: ${deliveryStatus.replace(/_/g, ' ')}`,
      },
    });
  }

  private toOrderStatusFromDelivery(deliveryStatus: DeliveryStatusValue) {
    switch (deliveryStatus) {
      case 'scheduled':
        return 'confirmed';
      case 'out_for_delivery':
        return 'out_for_delivery';
      case 'delivered':
        return 'delivered';
      default:
        return 'confirmed';
    }
  }

  private toOrderRank(status: string) {
    const ranks: Record<string, number> = {
      new: 0,
      confirmed: 1,
      out_for_delivery: 2,
      delivered: 3,
      cancelled: 4,
    };

    return ranks[status] ?? -1;
  }

  private toOrderRankFromDelivery(deliveryStatus: DeliveryStatusValue) {
    return this.toOrderRank(this.toOrderStatusFromDelivery(deliveryStatus));
  }

  private toDeliveryStatusLabel(status: string) {
    switch (status) {
      case 'scheduled':
        return 'Delivery scheduled';
      case 'out_for_delivery':
        return 'Out for delivery';
      case 'delivered':
        return 'Order delivered';
      default:
        return 'Delivery updated';
    }
  }
}
