import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  conflictError,
  forbiddenError,
  notFoundError,
  serviceUnavailableError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMessengerAutoReplyRuleDto } from './dto/create-messenger-auto-reply-rule.dto';
import { ListMessengerThreadsQueryDto } from './dto/list-messenger-threads-query.dto';
import { UpdateMessengerConnectionDto } from './dto/update-messenger-connection.dto';
import { UpdateMessengerAutoReplyRuleDto } from './dto/update-messenger-auto-reply-rule.dto';

type MetaWebhookQuery = {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
};

type MetaMessagingEvent = Record<string, unknown>;

type MessengerGraphSendResponse = {
  recipient_id?: string;
  message_id?: string;
};

type DbConnection = any;
type DbThread = any;
type DbMessage = any;
type DbRule = any;

const INBOUND_MESSAGE_PERMISSION_HINT = 'Connect a Facebook Page first.';

@Injectable()
export class MessengerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  resolveWebhookChallenge(query: MetaWebhookQuery) {
    const messengerConfig = this.config.getMetaMessengerConfig();

    if (!messengerConfig.webhookVerifyToken) {
      throw serviceUnavailableError(
        'Messenger webhook verification is not configured on the server.',
      );
    }

    if (
      query['hub.mode'] !== 'subscribe' ||
      query['hub.verify_token'] !== messengerConfig.webhookVerifyToken ||
      !query['hub.challenge']
    ) {
      throw forbiddenError('Messenger webhook verification failed.');
    }

    return query['hub.challenge'];
  }

  async handleWebhookEvent(input: {
    body: Record<string, unknown>;
    rawBody: string;
    signature?: string;
  }) {
    const messengerConfig = this.config.getMetaMessengerConfig();

    if (messengerConfig.appSecret) {
      if (
        !input.signature ||
        !this.isValidSignature(
          input.rawBody,
          input.signature,
          messengerConfig.appSecret,
        )
      ) {
        throw forbiddenError('Messenger webhook signature is invalid.');
      }
    }

    const objectType =
      typeof input.body.object === 'string' ? input.body.object : null;
    if (objectType !== 'page') {
      return {
        received: true,
        processed_events: 0,
      };
    }

    const entries = Array.isArray(input.body.entry) ? input.body.entry : [];
    let processedEvents = 0;

    for (const entry of entries) {
      const messagingEvents =
        entry &&
        typeof entry === 'object' &&
        Array.isArray((entry as Record<string, unknown>).messaging)
          ? ((entry as Record<string, unknown>).messaging as MetaMessagingEvent[])
          : [];

      for (const event of messagingEvents) {
        await this.processMessagingEvent(event);
        processedEvents += 1;
      }
    }

    return {
      received: true,
      processed_events: processedEvents,
    };
  }

  async getOverview(shopId: string) {
    const connection = await this.prisma.messengerConnection.findUnique({
      where: { shopId },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    });

    const threadSummary = connection
      ? await this.prisma.messengerThread.aggregate({
          where: {
            shopId,
          },
          _sum: {
            unreadCount: true,
          },
        })
      : null;
    const autoReplyRuleCount = await this.prisma.messengerAutoReplyRule.count({
      where: { shopId },
    });

    return {
      connection: connection ? this.serializeConnection(connection) : null,
      setup: {
        webhook_url: this.config.getMetaMessengerConfig().webhookUrl,
        verify_token_configured:
          this.config.getMetaMessengerConfig().isWebhookVerificationConfigured,
        signature_validation_enabled:
          this.config.getMetaMessengerConfig().isSignatureValidationConfigured,
        graph_api_version: this.config.getMetaMessengerConfig().graphApiVersion,
      },
      stats: {
        thread_count: connection?._count?.threads ?? 0,
        unread_count: threadSummary?._sum?.unreadCount ?? 0,
        auto_reply_rule_count: autoReplyRuleCount,
      },
    };
  }

  async updateConnection(shopId: string, body: UpdateMessengerConnectionDto) {
    const pageId = body.page_id.trim();
    const pageName = body.page_name?.trim() || null;
    const pageAccessToken = body.page_access_token.trim();

    if (!pageId || !pageAccessToken) {
      throw validationError([
        {
          field: 'page_id',
          errors: ['Page ID and access token are required.'],
        },
      ]);
    }

    const existingByPage = await this.prisma.messengerConnection.findFirst({
      where: {
        pageId,
        NOT: {
          shopId,
        },
      },
    });

    if (existingByPage) {
      throw conflictError(
        'This Facebook Page is already connected to another shop workspace.',
      );
    }

    const existingConnection = await this.prisma.messengerConnection.findUnique({
      where: { shopId },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    });

    if (
      existingConnection &&
      existingConnection.pageId !== pageId &&
      existingConnection._count.threads > 0
    ) {
      throw conflictError(
        'This shop already has Messenger history. Replacing it with a different Page ID is not supported on this connection yet.',
      );
    }

    const encryptedToken = this.encryptAccessToken(pageAccessToken);

    const connection = existingConnection
      ? await this.prisma.messengerConnection.update({
          where: { id: existingConnection.id },
          data: {
            pageId,
            pageName,
            pageAccessTokenEncrypted: encryptedToken,
            status: 'active',
          },
        })
      : await this.prisma.messengerConnection.create({
          data: {
            shopId,
            pageId,
            pageName,
            pageAccessTokenEncrypted: encryptedToken,
            status: 'active',
          },
        });

    return this.serializeConnection(connection);
  }

  async disconnectConnection(shopId: string) {
    const connection = await this.prisma.messengerConnection.findUnique({
      where: { shopId },
    });

    if (!connection) {
      throw notFoundError('Messenger connection not found');
    }

    return this.serializeConnection(
      await this.prisma.messengerConnection.update({
        where: { id: connection.id },
        data: {
          status: 'disconnected',
          pageAccessTokenEncrypted: null,
        },
      }),
    );
  }

  async listThreads(shopId: string, query: ListMessengerThreadsQueryDto) {
    const search = query.search?.trim().toLowerCase() ?? '';
    const threads = await this.prisma.messengerThread.findMany({
      where: { shopId },
      include: {
        connection: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    const filtered = search
      ? threads.filter((thread) =>
          [
            thread.customerName ?? '',
            thread.customerPsid,
            thread.lastMessageText ?? '',
            thread.connection.pageName ?? '',
            thread.connection.pageId,
          ]
            .join(' ')
            .toLowerCase()
            .includes(search),
        )
      : threads;

    const serialized = filtered.map((thread) => this.serializeThreadSummary(thread));
    const page = paginate(serialized, query.limit, query.cursor);

    return paged(page.items, page.pagination);
  }

  async getThread(shopId: string, threadId: string) {
    const thread = await this.prisma.messengerThread.findFirst({
      where: {
        id: threadId,
        shopId,
      },
      include: {
        connection: true,
        messages: {
          orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!thread) {
      throw notFoundError('Messenger thread not found');
    }

    return {
      ...this.serializeThreadSummary(thread),
      connection: this.serializeConnection(thread.connection),
      messages: thread.messages.map((message: DbMessage) =>
        this.serializeMessage(message),
      ),
    };
  }

  async markThreadRead(shopId: string, threadId: string) {
    const thread = await this.prisma.messengerThread.findFirst({
      where: {
        id: threadId,
        shopId,
      },
    });

    if (!thread) {
      throw notFoundError('Messenger thread not found');
    }

    return this.serializeThreadSummary(
      await this.prisma.messengerThread.update({
        where: { id: thread.id },
        data: {
          unreadCount: 0,
        },
        include: {
          connection: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
    );
  }

  async sendReply(shopId: string, threadId: string, text: string) {
    const thread = await this.prisma.messengerThread.findFirst({
      where: {
        id: threadId,
        shopId,
      },
      include: {
        connection: true,
      },
    });

    if (!thread) {
      throw notFoundError('Messenger thread not found');
    }

    return this.sendTextReply(thread, text.trim(), 'RESPONSE');
  }

  async getThreadOrderSource(shopId: string, threadId: string) {
    const thread = await this.prisma.messengerThread.findFirst({
      where: {
        id: threadId,
        shopId,
      },
      include: {
        messages: {
          where: {
            direction: 'inbound',
          },
          orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!thread) {
      throw notFoundError('Messenger thread not found');
    }

    const lines = thread.messages
      .map((message: DbMessage) => message.textBody?.trim() || '')
      .filter((line: string) => line.length > 0);

    return {
      thread_id: thread.id,
      message: lines.join('\n'),
      line_count: lines.length,
    };
  }

  async listAutoReplyRules(shopId: string) {
    const rules = await this.prisma.messengerAutoReplyRule.findMany({
      where: { shopId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      rules: rules.map((rule) => this.serializeRule(rule)),
    };
  }

  async getAutoReplyRule(shopId: string, ruleId: string) {
    const rule = await this.prisma.messengerAutoReplyRule.findFirst({
      where: {
        id: ruleId,
        shopId,
      },
    });

    if (!rule) {
      throw notFoundError('Messenger auto reply rule not found');
    }

    return this.serializeRule(rule);
  }

  async createAutoReplyRule(
    shopId: string,
    body: CreateMessengerAutoReplyRuleDto,
  ) {
    const rule = await this.prisma.messengerAutoReplyRule.create({
      data: {
        shopId,
        name: body.name.trim(),
        matchType: body.match_type,
        pattern: body.pattern.trim(),
        replyText: body.reply_text.trim(),
        isActive: body.is_active ?? true,
      },
    });

    return this.serializeRule(rule);
  }

  async updateAutoReplyRule(
    shopId: string,
    ruleId: string,
    body: UpdateMessengerAutoReplyRuleDto,
  ) {
    const existingRule = await this.prisma.messengerAutoReplyRule.findFirst({
      where: {
        id: ruleId,
        shopId,
      },
    });

    if (!existingRule) {
      throw notFoundError('Messenger auto reply rule not found');
    }

    const rule = await this.prisma.messengerAutoReplyRule.update({
      where: { id: existingRule.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.match_type !== undefined ? { matchType: body.match_type } : {}),
        ...(body.pattern !== undefined ? { pattern: body.pattern.trim() } : {}),
        ...(body.reply_text !== undefined
          ? { replyText: body.reply_text.trim() }
          : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
      },
    });

    return this.serializeRule(rule);
  }

  async deleteAutoReplyRule(shopId: string, ruleId: string) {
    const existingRule = await this.prisma.messengerAutoReplyRule.findFirst({
      where: {
        id: ruleId,
        shopId,
      },
    });

    if (!existingRule) {
      throw notFoundError('Messenger auto reply rule not found');
    }

    await this.prisma.messengerAutoReplyRule.delete({
      where: { id: existingRule.id },
    });
  }

  private async processMessagingEvent(event: MetaMessagingEvent) {
    const senderId = this.readNestedString(event.sender, 'id');
    const recipientId = this.readNestedString(event.recipient, 'id');

    if (!recipientId) {
      return;
    }

    const connection = await this.prisma.messengerConnection.findUnique({
      where: { pageId: recipientId },
    });

    if (!connection) {
      return;
    }

    await this.prisma.messengerConnection.update({
      where: { id: connection.id },
      data: {
        lastWebhookAt: this.parseTimestamp(event.timestamp) ?? new Date(),
      },
    });

    const messagePayload =
      event.message && typeof event.message === 'object'
        ? (event.message as Record<string, unknown>)
        : null;
    if (messagePayload) {
      await this.processMessagePayload(connection, senderId, recipientId, event, messagePayload);
      return;
    }

    const postbackPayload =
      event.postback && typeof event.postback === 'object'
        ? (event.postback as Record<string, unknown>)
        : null;
    if (postbackPayload) {
      await this.processPostbackPayload(
        connection,
        senderId,
        recipientId,
        event,
        postbackPayload,
      );
    }
  }

  private async processMessagePayload(
    connection: DbConnection,
    senderId: string | null,
    recipientId: string,
    rawEvent: MetaMessagingEvent,
    messagePayload: Record<string, unknown>,
  ) {
    if (messagePayload.is_echo === true) {
      return;
    }

    const customerPsid = senderId;
    if (!customerPsid) {
      return;
    }

    const thread = await this.ensureThread(connection, customerPsid);
    const providerMessageId =
      typeof messagePayload.mid === 'string' ? messagePayload.mid : null;

    if (providerMessageId) {
      const existingMessage = await this.prisma.messengerMessage.findFirst({
        where: {
          threadId: thread.id,
          providerMessageId,
        },
      });

      if (existingMessage) {
        return;
      }
    }

    const textBody = this.extractTextBody(messagePayload);
    const sentAt = this.parseTimestamp(rawEvent.timestamp) ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.messengerMessage.create({
        data: {
          threadId: thread.id,
          providerMessageId,
          direction: 'inbound',
          messageType: this.detectMessageType(messagePayload, textBody),
          senderPsid: customerPsid,
          recipientId,
          textBody,
          isEcho: false,
          sentAt,
          rawPayload: this.toJsonValue(rawEvent),
        },
      });

      await tx.messengerThread.update({
        where: { id: thread.id },
        data: {
          lastMessageText: textBody ?? '[Attachment]',
          lastMessageAt: sentAt,
          unreadCount: {
            increment: 1,
          },
        },
      });
    });

    if (textBody) {
      await this.runAutoReplyRules(connection, thread.id, customerPsid, textBody);
    }
  }

  private async processPostbackPayload(
    connection: DbConnection,
    senderId: string | null,
    recipientId: string,
    rawEvent: MetaMessagingEvent,
    postbackPayload: Record<string, unknown>,
  ) {
    if (!senderId) {
      return;
    }

    const thread = await this.ensureThread(connection, senderId);
    const providerMessageId =
      typeof postbackPayload.mid === 'string' ? postbackPayload.mid : null;
    const title =
      typeof postbackPayload.title === 'string'
        ? postbackPayload.title.trim()
        : null;
    const payload =
      typeof postbackPayload.payload === 'string'
        ? postbackPayload.payload.trim()
        : null;
    const textBody = title || payload || '[Postback]';
    const sentAt = this.parseTimestamp(rawEvent.timestamp) ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.messengerMessage.create({
        data: {
          threadId: thread.id,
          providerMessageId,
          direction: 'inbound',
          messageType: 'postback',
          senderPsid: senderId,
          recipientId,
          textBody,
          isEcho: false,
          sentAt,
          rawPayload: this.toJsonValue(rawEvent),
        },
      });

      await tx.messengerThread.update({
        where: { id: thread.id },
        data: {
          lastMessageText: textBody,
          lastMessageAt: sentAt,
          unreadCount: {
            increment: 1,
          },
        },
      });
    });
  }

  private async runAutoReplyRules(
    connection: DbConnection,
    threadId: string,
    customerPsid: string,
    inboundText: string,
  ) {
    const rules = await this.prisma.messengerAutoReplyRule.findMany({
      where: {
        shopId: connection.shopId,
        isActive: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'asc' }],
    });

    if (rules.length === 0) {
      return;
    }

    const normalizedText = inboundText.trim().toLowerCase();
    const matchedRule = rules.find((rule) =>
      this.matchesRule(rule, normalizedText),
    );

    if (!matchedRule) {
      return;
    }

    const thread = await this.prisma.messengerThread.findUnique({
      where: { id: threadId },
      include: {
        connection: true,
      },
    });

    if (!thread) {
      return;
    }

    await this.sendTextReply(thread, matchedRule.replyText, 'RESPONSE');
    await this.prisma.messengerAutoReplyRule.update({
      where: { id: matchedRule.id },
      data: {
        lastTriggeredAt: new Date(),
      },
    });
    void customerPsid;
  }

  private matchesRule(rule: DbRule, normalizedText: string) {
    const pattern = String(rule.pattern ?? '').trim().toLowerCase();
    if (!pattern) {
      return false;
    }

    if (rule.matchType === 'exact') {
      return normalizedText === pattern;
    }

    return normalizedText.includes(pattern);
  }

  private async sendTextReply(
    thread: DbThread,
    text: string,
    messagingType: 'RESPONSE',
  ) {
    const connection = thread.connection;
    if (!connection || connection.status !== 'active') {
      throw conflictError(INBOUND_MESSAGE_PERMISSION_HINT);
    }

    if (!connection.pageAccessTokenEncrypted) {
      throw conflictError(INBOUND_MESSAGE_PERMISSION_HINT);
    }

    const payload = {
      recipient: {
        id: thread.customerPsid,
      },
      messaging_type: messagingType,
      message: {
        text,
      },
    };

    const accessToken = this.decryptAccessToken(connection.pageAccessTokenEncrypted);
    const response = await this.sendGraphMessage(connection.pageId, accessToken, payload);
    const sentAt = new Date();

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.messengerMessage.create({
        data: {
          threadId: thread.id,
          providerMessageId: response.message_id ?? null,
          direction: 'outbound',
          messageType: 'text',
          senderPsid: null,
          recipientId: thread.customerPsid,
          textBody: text,
          isEcho: false,
          sentAt,
          rawPayload: {
            request: payload,
            response,
          },
        },
      });

      await tx.messengerThread.update({
        where: { id: thread.id },
        data: {
          lastMessageText: text,
          lastMessageAt: sentAt,
        },
      });

      return createdMessage;
    });

    return this.serializeMessage(message);
  }

  private async sendGraphMessage(
    pageId: string,
    accessToken: string,
    payload: Record<string, unknown>,
  ) {
    const url = this.buildGraphUrl(`${pageId}/messages`, accessToken);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw serviceUnavailableError(
        'Unable to reach Messenger right now. Please try again shortly.',
        this.buildFetchErrorContext(error),
      );
    }

    const rawBody = await response.text();
    let parsedBody: Record<string, unknown> | null = null;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      throw conflictError(
        'Messenger rejected the reply for this conversation.',
        {
          status: response.status,
          body: parsedBody ?? rawBody,
        },
      );
    }

    return parsedBody as MessengerGraphSendResponse;
  }

  private async ensureThread(connection: DbConnection, customerPsid: string) {
    const existingThread = await this.prisma.messengerThread.findUnique({
      where: {
        connectionId_customerPsid: {
          connectionId: connection.id,
          customerPsid,
        },
      },
      include: {
        connection: true,
      },
    });

    if (existingThread) {
      return existingThread;
    }

    return this.prisma.messengerThread.create({
      data: {
        shopId: connection.shopId,
        connectionId: connection.id,
        customerPsid,
      },
      include: {
        connection: true,
      },
    });
  }

  private isValidSignature(
    rawBody: string,
    signatureHeader: string,
    appSecret: string,
  ) {
    const [prefix, providedDigest] = signatureHeader.split('=');
    if (prefix !== 'sha256' || !providedDigest) {
      return false;
    }

    const expectedDigest = createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const providedBuffer = Buffer.from(providedDigest, 'hex');
    const expectedBuffer = Buffer.from(expectedDigest, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }

  private buildGraphUrl(path: string, accessToken: string) {
    const messengerConfig = this.config.getMetaMessengerConfig();
    const normalizedPath = path.replace(/^\/+/, '');

    return `${messengerConfig.graphApiBaseUrl}/${messengerConfig.graphApiVersion}/${normalizedPath}?access_token=${encodeURIComponent(
      accessToken,
    )}`;
  }

  private encryptAccessToken(value: string) {
    const key = this.resolveEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString(
      'base64url',
    )}`;
  }

  private decryptAccessToken(value: string) {
    const [ivPart, authTagPart, encryptedPart] = value.split('.');
    if (!ivPart || !authTagPart || !encryptedPart) {
      throw serviceUnavailableError(
        'Messenger access token storage is invalid for this environment.',
      );
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.resolveEncryptionKey(),
      Buffer.from(ivPart, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private resolveEncryptionKey() {
    return createHash('sha256')
      .update(this.config.getMetaMessengerConfig().tokenEncryptionSecret)
      .digest();
  }

  private readNestedString(
    input: unknown,
    field: string,
  ): string | null {
    return input &&
      typeof input === 'object' &&
      typeof (input as Record<string, unknown>)[field] === 'string'
      ? ((input as Record<string, unknown>)[field] as string)
      : null;
  }

  private parseTimestamp(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value);
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private detectMessageType(
    messagePayload: Record<string, unknown>,
    textBody: string | null,
  ) {
    if (textBody) {
      return 'text';
    }

    if (Array.isArray(messagePayload.attachments)) {
      return 'attachment';
    }

    return 'unknown';
  }

  private extractTextBody(messagePayload: Record<string, unknown>) {
    if (typeof messagePayload.text === 'string' && messagePayload.text.trim()) {
      return messagePayload.text.trim();
    }

    if (!Array.isArray(messagePayload.attachments)) {
      return null;
    }

    const attachmentTypes = messagePayload.attachments
      .map((attachment) =>
        attachment &&
        typeof attachment === 'object' &&
        typeof (attachment as Record<string, unknown>).type === 'string'
          ? String((attachment as Record<string, unknown>).type)
          : 'attachment',
      )
      .filter((value) => value.length > 0);

    if (attachmentTypes.length === 0) {
      return null;
    }

    return `[${attachmentTypes.join(', ')}]`;
  }

  private serializeConnection(connection: DbConnection) {
    return {
      id: connection.id,
      shop_id: connection.shopId,
      page_id: connection.pageId,
      page_name: connection.pageName ?? connection.pageId,
      status: connection.status,
      last_webhook_at: connection.lastWebhookAt?.toISOString() ?? null,
      created_at: connection.createdAt.toISOString(),
      updated_at: connection.updatedAt.toISOString(),
    };
  }

  private serializeThreadSummary(thread: DbThread) {
    const customerLabel =
      thread.customerName?.trim() ||
      `PSID ${String(thread.customerPsid).slice(-8)}`;

    return {
      id: thread.id,
      shop_id: thread.shopId,
      connection_id: thread.connectionId,
      customer_psid: thread.customerPsid,
      customer_name: thread.customerName ?? null,
      customer_locale: thread.customerLocale ?? null,
      customer_label: customerLabel,
      last_message_text: thread.lastMessageText ?? null,
      last_message_at: thread.lastMessageAt?.toISOString() ?? null,
      unread_count: thread.unreadCount,
      message_count: thread._count?.messages ?? undefined,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
      page: thread.connection
        ? {
            id: thread.connection.pageId,
            name: thread.connection.pageName ?? thread.connection.pageId,
            status: thread.connection.status,
          }
        : null,
    };
  }

  private serializeMessage(message: DbMessage) {
    return {
      id: message.id,
      thread_id: message.threadId,
      provider_message_id: message.providerMessageId ?? null,
      direction: message.direction,
      message_type: message.messageType,
      sender_psid: message.senderPsid ?? null,
      recipient_id: message.recipientId ?? null,
      text_body: message.textBody ?? null,
      is_echo: message.isEcho,
      sent_at: message.sentAt.toISOString(),
      created_at: message.createdAt.toISOString(),
      updated_at: message.updatedAt.toISOString(),
    };
  }

  private serializeRule(rule: DbRule) {
    return {
      id: rule.id,
      shop_id: rule.shopId,
      name: rule.name,
      match_type: rule.matchType,
      pattern: rule.pattern,
      reply_text: rule.replyText,
      is_active: rule.isActive,
      last_triggered_at: rule.lastTriggeredAt?.toISOString() ?? null,
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    };
  }

  private buildFetchErrorContext(error: unknown) {
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    return undefined;
  }

  private toJsonValue(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
