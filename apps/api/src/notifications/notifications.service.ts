import { Injectable } from '@nestjs/common';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import type { AuthenticatedUser } from '../common/http/request-context';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { ShopsService } from '../shops/shops.service';
import { EmailOutboxService } from '../email/email-outbox.service';
import { GetNotificationUnreadCountQueryDto } from './dto/get-notification-unread-count-query.dto';
import { ListUserNotificationsQueryDto } from './dto/list-user-notifications-query.dto';
import { MarkAllNotificationsReadDto } from './dto/mark-all-notifications-read.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  getNotificationCategoryDefinition,
  notificationCategoryCatalog,
  type NotificationCategoryCode,
} from './notification.constants';

type NotificationRecord = any;

type ShopRecipient = {
  userId: string;
  name: string;
  email: string | null;
};

type OrderActivityNotificationInput = {
  shopId: string;
  shopName: string;
  actorUserId: string;
  actorName: string | null;
  orderId: string;
  orderNo: string;
  customerName: string;
  township?: string | null;
  totalPrice: number;
  currency: string;
  title: string;
  body: string;
  emailSubject?: string;
  emailBody?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
    private readonly emailOutbox: EmailOutboxService,
  ) {}

  async listNotifications(
    currentUser: AuthenticatedUser,
    query: ListUserNotificationsQueryDto,
  ) {
    await this.assertNotificationScope(currentUser, query.shop_id);

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: currentUser.id,
        ...(query.shop_id ? { shopId: query.shop_id } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.unread_only ? { readAt: null } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const serialized = notifications.map((notification) =>
      this.serializeNotificationRecord(notification),
    );
    const page = paginate(serialized, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async getUnreadCount(
    currentUser: AuthenticatedUser,
    query: GetNotificationUnreadCountQueryDto,
  ) {
    await this.assertNotificationScope(currentUser, query.shop_id);

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId: currentUser.id,
        readAt: null,
        ...(query.shop_id ? { shopId: query.shop_id } : {}),
        ...(query.category ? { category: query.category } : {}),
      },
    });

    return { unread_count: unreadCount };
  }

  async markNotificationRead(
    currentUser: AuthenticatedUser,
    notificationId: string,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== currentUser.id) {
      throw notFoundError('Notification not found');
    }

    if (!notification.readAt) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
      });
    }

    const updated = await this.prisma.notification.findUnique({
      where: { id: notification.id },
    });
    if (!updated) {
      throw notFoundError('Notification not found');
    }

    return this.serializeNotificationRecord(updated);
  }

  async markAllRead(
    currentUser: AuthenticatedUser,
    body: MarkAllNotificationsReadDto,
  ) {
    await this.assertNotificationScope(currentUser, body.shop_id);

    const result = await this.prisma.notification.updateMany({
      where: {
        userId: currentUser.id,
        readAt: null,
        ...(body.shop_id ? { shopId: body.shop_id } : {}),
        ...(body.category ? { category: body.category } : {}),
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      read_count: result.count,
    };
  }

  async getPreferences(currentUser: AuthenticatedUser) {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId: currentUser.id },
      orderBy: [{ category: 'asc' }],
    });

    return {
      preferences: notificationCategoryCatalog.map((category) => {
        const record = preferences.find((item) => item.category === category.code);
        return this.serializePreferenceRecord(currentUser.id, category.code, record);
      }),
    };
  }

  async updatePreferences(
    currentUser: AuthenticatedUser,
    body: UpdateNotificationPreferencesDto,
  ) {
    for (const preference of body.preferences) {
      if (
        preference.in_app_enabled === undefined &&
        preference.email_enabled === undefined
      ) {
        throw validationError([
          {
            field: 'preferences',
            errors: [
              'Each preference update must include in_app_enabled or email_enabled',
            ],
          },
        ]);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const preference of body.preferences) {
        const definition = getNotificationCategoryDefinition(preference.category);
        if (!definition) {
          throw conflictError('Unknown notification category');
        }

        await tx.notificationPreference.upsert({
          where: {
            userId_category: {
              userId: currentUser.id,
              category: preference.category,
            },
          },
          update: {
            ...(preference.in_app_enabled !== undefined
              ? { inAppEnabled: preference.in_app_enabled }
              : {}),
            ...(preference.email_enabled !== undefined
              ? { emailEnabled: preference.email_enabled }
              : {}),
          },
          create: {
            userId: currentUser.id,
            category: preference.category,
            inAppEnabled:
              preference.in_app_enabled ?? definition.defaultInAppEnabled,
            emailEnabled:
              preference.email_enabled ?? definition.defaultEmailEnabled,
          },
        });
      }
    });

    return this.getPreferences(currentUser);
  }

  async notifyOrderCreated(input: Omit<OrderActivityNotificationInput, 'title' | 'body' | 'emailSubject' | 'emailBody'>) {
    await this.dispatchOrderActivity({
      ...input,
      title: `New order — ${input.customerName}`,
      body: `${input.orderNo} · ${this.formatAmount(input.totalPrice, input.currency)}${input.township ? ` · ${input.township}` : ''}`,
      emailSubject: `[${input.shopName}] New order ${input.orderNo}`,
      emailBody: `${input.customerName} placed ${input.orderNo} for ${this.formatAmount(input.totalPrice, input.currency)}.${input.township ? ` Delivery area: ${input.township}.` : ''}`,
    });
  }

  async notifyOrderStatusChanged(
    input: Omit<OrderActivityNotificationInput, 'title' | 'body' | 'emailSubject' | 'emailBody'> & {
      statusLabel: string;
    },
  ) {
    await this.dispatchOrderActivity({
      ...input,
      title: `${input.statusLabel} — ${input.customerName}`,
      body: `${input.orderNo} moved to ${input.statusLabel.toLowerCase()}${input.actorName ? ` by ${input.actorName}` : ''}`,
      emailSubject: `[${input.shopName}] ${input.orderNo} is now ${input.statusLabel}`,
      emailBody: `${input.orderNo} for ${input.customerName} moved to ${input.statusLabel.toLowerCase()}${input.actorName ? ` by ${input.actorName}` : ''}.`,
    });
  }

  private async dispatchOrderActivity(input: OrderActivityNotificationInput) {
    const recipients = await this.resolveShopRecipients(input.shopId);
    if (recipients.length === 0) {
      return;
    }

    const preferences = await this.resolvePreferenceMap(
      recipients.map((recipient) => recipient.userId),
      'order_activity',
    );
    const emailMessageIds: string[] = [];

    for (const recipient of recipients) {
      const resolvedPreference =
        preferences.get(recipient.userId) ??
        this.resolveDefaultPreference('order_activity');
      let notificationId: string | null = null;

      if (resolvedPreference.in_app_enabled) {
        const created = await this.prisma.notification.create({
          data: {
            userId: recipient.userId,
            shopId: input.shopId,
            shopNameSnapshot: input.shopName,
            category: 'order_activity',
            title: input.title,
            body: input.body,
            actionType: 'order',
            actionTarget: `/orders/${input.orderId}`,
          },
          select: { id: true },
        });
        notificationId = created.id;
      }

      if (
        resolvedPreference.email_enabled &&
        recipient.email &&
        recipient.userId !== input.actorUserId
      ) {
        const createdEmail = await this.emailOutbox.queueEmail({
          userId: recipient.userId,
          notificationId,
          shopId: input.shopId,
          category: 'order_activity',
          toEmail: recipient.email,
          recipientName: recipient.name,
          subject: input.emailSubject ?? input.title,
          textBody:
            input.emailBody ??
            `${input.title}\n\n${input.body}\n\nOpen order: ${input.orderNo}`,
        });
        emailMessageIds.push(createdEmail.id);
      }
    }

    if (emailMessageIds.length > 0) {
      await this.emailOutbox.sendQueuedEmails(emailMessageIds);
    }
  }

  private async resolveShopRecipients(shopId: string): Promise<ShopRecipient[]> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: true,
        members: {
          where: { status: 'active' },
          include: {
            user: true,
          },
        },
      },
    });

    if (!shop) {
      return [];
    }

    const recipients = new Map<string, ShopRecipient>();
    recipients.set(shop.owner.id, {
      userId: shop.owner.id,
      name: shop.owner.name,
      email: shop.owner.email,
    });

    for (const member of shop.members) {
      recipients.set(member.user.id, {
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
      });
    }

    return [...recipients.values()];
  }

  private async resolvePreferenceMap(
    userIds: string[],
    category: NotificationCategoryCode,
  ) {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: {
        userId: {
          in: userIds,
        },
        category,
      },
    });

    return new Map(
      preferences.map((preference) => [
        preference.userId,
        {
          in_app_enabled: preference.inAppEnabled,
          email_enabled: preference.emailEnabled,
        },
      ]),
    );
  }

  private resolveDefaultPreference(category: NotificationCategoryCode) {
    const definition = getNotificationCategoryDefinition(category);
    return {
      in_app_enabled: definition?.defaultInAppEnabled ?? true,
      email_enabled: definition?.defaultEmailEnabled ?? true,
    };
  }

  private async assertNotificationScope(
    currentUser: AuthenticatedUser,
    shopId?: string,
  ) {
    if (!shopId) {
      return;
    }

    await this.shopsService.assertShopAccess(currentUser.id, shopId);
  }

  private serializeNotificationRecord(notification: NotificationRecord) {
    return {
      id: notification.id,
      user_id: notification.userId,
      shop_id: notification.shopId,
      shop_name: notification.shopNameSnapshot,
      category: notification.category,
      title: notification.title,
      body: notification.body,
      action_type: notification.actionType,
      action_target: notification.actionTarget,
      is_read: Boolean(notification.readAt),
      read_at: notification.readAt?.toISOString() ?? null,
      created_at: notification.createdAt.toISOString(),
    };
  }

  private serializePreferenceRecord(
    userId: string,
    categoryCode: NotificationCategoryCode,
    record?: {
      id: string;
      category: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
      updatedAt: Date;
    } | null,
  ) {
    const definition = getNotificationCategoryDefinition(categoryCode);
    return {
      id: record?.id ?? null,
      user_id: userId,
      category: categoryCode,
      label: definition?.label ?? categoryCode,
      description: definition?.description ?? null,
      in_app_enabled: record?.inAppEnabled ?? definition?.defaultInAppEnabled ?? true,
      email_enabled: record?.emailEnabled ?? definition?.defaultEmailEnabled ?? true,
      updated_at: record?.updatedAt?.toISOString() ?? null,
    };
  }

  private formatAmount(amount: number, currency: string) {
    return `${amount.toLocaleString('en-US')} ${currency}`;
  }
}
