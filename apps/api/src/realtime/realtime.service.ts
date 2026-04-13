import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  forbiddenError,
  unauthorizedError,
} from '../common/http/app-http.exception';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { generateId } from '../common/utils/id';
import { jwtConfig } from '../auth/jwt.config';
import type { CreateRealtimeTicketQueryDto } from './dto/create-realtime-ticket-query.dto';

type RealtimeScope = 'platform' | 'shop';

type RealtimeTicketPayload = {
  type: 'realtime';
  sub: string;
  sid: string;
  scope: RealtimeScope;
  shop_id: string | null;
};

type RealtimeConnectionRecord = {
  id: string;
  userId: string;
  sessionId: string;
  scope: RealtimeScope;
  shopId: string | null;
  socket: {
    send: (payload: string) => void;
    close: (code?: number, data?: string) => void;
    on: (event: string, listener: (...args: any[]) => void) => void;
    readyState?: number;
  };
  heartbeatTimer: NodeJS.Timeout;
};

type SerializedNotification = {
  id: string;
  user_id: string;
  shop_id: string | null;
  shop_name: string | null;
  category: string;
  title: string;
  body: string;
  action_type: string | null;
  action_target: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly ticketTtlSeconds = this.resolveTicketTtlSeconds();
  private readonly ticketSecret =
    process.env.REALTIME_JWT_SECRET?.trim() || jwtConfig.accessSecret;
  private readonly ticketAudience = `${jwtConfig.audience}:realtime`;
  private readonly connections = new Map<string, RealtimeConnectionRecord>();
  private readonly userConnectionIndex = new Map<string, Set<string>>();
  private websocketRoutesRegistered = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async issueTicket(
    currentUser: AuthenticatedUser,
    query: CreateRealtimeTicketQueryDto,
  ) {
    const sessionId = currentUser.sessionId?.trim();
    if (!sessionId) {
      throw unauthorizedError();
    }

    const scope = query.scope;
    const shopId =
      scope === 'shop' ? (query.shop_id?.trim() || null) : null;

    if (scope === 'platform') {
      if (!currentUser.platform || currentUser.platform.permissions.length === 0) {
        throw forbiddenError('Platform access is required for realtime scope');
      }
    }

    if (scope === 'shop') {
      if (!shopId) {
        throw forbiddenError('Shop scope requires shop_id');
      }

      const hasShopAccess = (currentUser.shops ?? []).some(
        (shop) => shop.shop_id === shopId,
      );
      if (!hasShopAccess) {
        throw forbiddenError('Shop access is required for realtime scope');
      }
    }

    const expiresAt = new Date(Date.now() + this.ticketTtlSeconds * 1000);
    const ticket = await this.jwtService.signAsync(
      {
        type: 'realtime',
        sub: currentUser.id,
        sid: sessionId,
        scope,
        shop_id: shopId,
      } satisfies RealtimeTicketPayload,
      {
        secret: this.ticketSecret,
        issuer: jwtConfig.issuer,
        audience: this.ticketAudience,
        expiresIn: this.ticketTtlSeconds,
      },
    );

    return {
      ticket,
      expires_at: expiresAt.toISOString(),
      websocket_path: '/api/v1/realtime/ws',
    };
  }

  async registerWebsocketRoutes(fastify: any) {
    if (this.websocketRoutesRegistered) {
      return;
    }

    fastify.get(
      '/api/v1/realtime/ws',
      { websocket: true },
      async (connection: any, request: any) => {
        const requestUrl = new URL(request.url, 'http://localhost');
        const ticket = requestUrl.searchParams.get('ticket')?.trim() || '';

        try {
          const context = await this.authenticateTicket(ticket);
          this.acceptSocket(connection.socket, context);
        } catch (error) {
          this.logger.warn(
            `Rejected realtime connection: ${
              error instanceof Error ? error.message : 'unauthorized'
            }`,
          );
          connection.socket.close(4001, 'unauthorized');
        }
      },
    );

    this.websocketRoutesRegistered = true;
  }

  async emitNotificationCreated(input: {
    userId: string;
    shopId: string | null;
    notification: SerializedNotification;
  }) {
    const unreadCount = await this.resolveUnreadCount(input.userId, input.shopId);
    this.emitToUser(input.userId, {
      type: 'notification.created',
      scope: input.shopId ? 'shop' : 'platform',
      shop_id: input.shopId,
      unread_count: unreadCount,
      notification: input.notification,
      emitted_at: new Date().toISOString(),
    });
  }

  async emitNotificationRead(input: {
    userId: string;
    shopId: string | null;
    notificationId: string;
  }) {
    const unreadCount = await this.resolveUnreadCount(input.userId, input.shopId);
    this.emitToUser(input.userId, {
      type: 'notification.read',
      scope: input.shopId ? 'shop' : 'platform',
      shop_id: input.shopId,
      notification_id: input.notificationId,
      unread_count: unreadCount,
      emitted_at: new Date().toISOString(),
    });
  }

  async broadcastShopInvalidation(input: {
    shopId: string;
    resource: string;
    action: string;
  }) {
    const recipientIds = await this.resolveShopRecipientIds(input.shopId);
    const payload = {
      type: 'data.invalidate',
      scope: 'shop',
      shop_id: input.shopId,
      resource: input.resource,
      action: input.action,
      emitted_at: new Date().toISOString(),
    } as const;

    for (const userId of recipientIds) {
      this.emitToUser(userId, payload);
    }
  }

  async broadcastPlatformInvalidation(input: {
    userId: string;
    resource: string;
    action: string;
  }) {
    this.emitToUser(input.userId, {
      type: 'data.invalidate',
      scope: 'platform',
      shop_id: null,
      resource: input.resource,
      action: input.action,
      emitted_at: new Date().toISOString(),
    });
  }

  private acceptSocket(
    socket: RealtimeConnectionRecord['socket'],
    context: {
      userId: string;
      sessionId: string;
      scope: RealtimeScope;
      shopId: string | null;
    },
  ) {
    const connectionId = generateId('rtc');
    const heartbeatTimer = setInterval(() => {
      this.sendRaw(socket, {
        type: 'ping',
        emitted_at: new Date().toISOString(),
      });
    }, 25_000);

    const record: RealtimeConnectionRecord = {
      id: connectionId,
      userId: context.userId,
      sessionId: context.sessionId,
      scope: context.scope,
      shopId: context.shopId,
      socket,
      heartbeatTimer,
    };

    this.connections.set(connectionId, record);
    const userConnections =
      this.userConnectionIndex.get(context.userId) ?? new Set<string>();
    userConnections.add(connectionId);
    this.userConnectionIndex.set(context.userId, userConnections);

    const cleanup = () => {
      clearInterval(heartbeatTimer);
      this.connections.delete(connectionId);
      const indexedConnections = this.userConnectionIndex.get(context.userId);
      if (!indexedConnections) {
        return;
      }

      indexedConnections.delete(connectionId);
      if (indexedConnections.size === 0) {
        this.userConnectionIndex.delete(context.userId);
      }
    };

    socket.on('close', cleanup);
    socket.on('error', cleanup);
    socket.on('message', (rawMessage: any) => {
      try {
        const parsed = JSON.parse(String(rawMessage));
        if (parsed?.type === 'ping') {
          this.sendRaw(socket, {
            type: 'pong',
            emitted_at: new Date().toISOString(),
          });
        }
      } catch {
        this.sendRaw(socket, {
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Unsupported realtime payload',
          emitted_at: new Date().toISOString(),
        });
      }
    });

    this.sendRaw(socket, {
      type: 'connection.ready',
      connection_id: connectionId,
      scope: context.scope,
      shop_id: context.shopId,
      emitted_at: new Date().toISOString(),
    });
  }

  private emitToUser(userId: string, payload: Record<string, unknown>) {
    const connectionIds = this.userConnectionIndex.get(userId);
    if (!connectionIds || connectionIds.size === 0) {
      return;
    }

    for (const connectionId of connectionIds) {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        continue;
      }

      const payloadScope = payload.scope;
      const payloadShopId =
        typeof payload.shop_id === 'string' ? payload.shop_id : null;
      if (payloadScope === 'platform' && connection.scope !== 'platform') {
        continue;
      }

      if (
        payloadScope === 'shop' &&
        (connection.scope !== 'shop' || connection.shopId !== payloadShopId)
      ) {
        continue;
      }

      this.sendRaw(connection.socket, payload);
    }
  }

  private sendRaw(
    socket: RealtimeConnectionRecord['socket'],
    payload: Record<string, unknown>,
  ) {
    if (socket.readyState !== undefined && socket.readyState !== 1) {
      return;
    }

    socket.send(JSON.stringify(payload));
  }

  private async authenticateTicket(ticket: string) {
    if (!ticket) {
      throw unauthorizedError();
    }

    const payload = await this.jwtService.verifyAsync<RealtimeTicketPayload>(
      ticket,
      {
        secret: this.ticketSecret,
        issuer: jwtConfig.issuer,
        audience: this.ticketAudience,
      },
    );

    if (payload.type !== 'realtime') {
      throw unauthorizedError();
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        accessExpiresAt: true,
        refreshExpiresAt: true,
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.refreshExpiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError();
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      scope: payload.scope,
      shopId: payload.shop_id,
    };
  }

  private async resolveUnreadCount(userId: string, shopId: string | null) {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
        ...(shopId ? { shopId } : { shopId: null }),
      },
    });
  }

  private async resolveShopRecipientIds(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: true,
        members: {
          where: { status: 'active' },
          select: { userId: true },
        },
      },
    });

    if (!shop) {
      return [];
    }

    return [
      ...new Set<string>([
        shop.owner.id,
        ...shop.members.map((member) => member.userId),
      ]),
    ];
  }

  private resolveTicketTtlSeconds() {
    const rawValue = process.env.REALTIME_TICKET_TTL_SECONDS?.trim();
    const parsed = Number.parseInt(rawValue ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
  }
}
