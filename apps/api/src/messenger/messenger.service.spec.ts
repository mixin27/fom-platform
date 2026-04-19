import { MessengerService } from './messenger.service';

const now = new Date('2026-04-19T09:00:00.000Z');

function buildConnection(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'conn-1',
    shopId: 'shop-1',
    pageId: 'page-1',
    pageName: 'Page One',
    lastConnectedPageId: 'page-1',
    lastConnectedPageName: 'Page One',
    pageAccessTokenEncrypted: 'encrypted-token',
    status: 'active',
    lastWebhookAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createService() {
  const prisma = {
    messengerConnection: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    messengerThread: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    messengerAutoReplyRule: {
      count: jest.fn(),
    },
  } as any;

  const config = {
    getMetaMessengerConfig: jest.fn(() => ({
      graphApiBaseUrl: 'https://graph.facebook.com',
      graphApiVersion: 'v25.0',
      appId: 'meta-app-id',
      appSecret: 'meta-app-secret',
      loginConfigId: 'meta-login-config-id',
      webhookVerifyToken: 'verify-token',
      webhookUrl: 'https://api.example.com/api/v1/messenger/webhooks/meta',
      tokenEncryptionSecret: 'messenger-test-secret',
      isOauthConfigured: true,
      isWebhookVerificationConfigured: true,
      isSignatureValidationConfigured: true,
    })),
  } as any;

  return {
    prisma,
    service: new MessengerService(prisma, config),
  };
}

describe('MessengerService', () => {
  it('hides disconnected connections in overview while preserving shop stats', async () => {
    const { prisma, service } = createService();

    prisma.messengerConnection.findFirst.mockResolvedValue(null);
    prisma.messengerThread.count.mockResolvedValue(3);
    prisma.messengerThread.aggregate.mockResolvedValue({
      _sum: {
        unreadCount: 4,
      },
    });
    prisma.messengerAutoReplyRule.count.mockResolvedValue(2);

    await expect(service.getOverview('shop-1')).resolves.toEqual(
      expect.objectContaining({
        connection: null,
        stats: {
          thread_count: 3,
          unread_count: 4,
          auto_reply_rule_count: 2,
        },
      }),
    );
  });

  it('disconnect clears the active page mapping but preserves historical page identity', async () => {
    const { prisma, service } = createService();
    const disconnectedConnection = buildConnection({
      pageId: null,
      pageName: null,
      pageAccessTokenEncrypted: null,
      status: 'disconnected',
    });

    prisma.messengerConnection.findFirst.mockResolvedValue(buildConnection());
    prisma.messengerConnection.update.mockResolvedValue(disconnectedConnection);

    const unsubscribeSpy = jest
      .spyOn(service as any, 'tryRemoveConnectionWebhookSubscription')
      .mockResolvedValue(undefined);

    await expect(service.disconnectConnection('shop-1')).resolves.toEqual(
      expect.objectContaining({
        status: 'disconnected',
        page_id: 'page-1',
        page_name: 'Page One',
      }),
    );

    expect(unsubscribeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conn-1' }),
    );
    expect(prisma.messengerConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({
        pageId: null,
        pageName: null,
        status: 'disconnected',
        pageAccessTokenEncrypted: null,
        lastConnectedPageId: 'page-1',
        lastConnectedPageName: 'Page One',
      }),
    });
  });

  it('allows reconnecting the same historical page after a disconnect', async () => {
    const { prisma, service } = createService();
    const updatedConnection = buildConnection();
    const historicalConnection = buildConnection({
      id: 'conn-history',
      pageId: null,
      pageName: null,
      pageAccessTokenEncrypted: null,
      status: 'disconnected',
    });

    prisma.messengerConnection.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(historicalConnection);
    prisma.messengerConnection.update.mockResolvedValue(updatedConnection);

    jest
      .spyOn(service as any, 'subscribePageToAppWebhooks')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'backfillMissingThreadProfiles')
      .mockResolvedValue(undefined);

    await expect(
      (service as any).saveConnection(
        'shop-1',
        'page-1',
        'Page One',
        'EAABsbCS1iHgBAKReconnectToken',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        page_id: 'page-1',
        page_name: 'Page One',
        status: 'active',
      }),
    );

    expect(prisma.messengerConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-history' },
      data: expect.objectContaining({
        pageId: 'page-1',
        pageName: 'Page One',
        lastConnectedPageId: 'page-1',
        lastConnectedPageName: 'Page One',
        status: 'active',
      }),
    });
  });

  it('archives the old page and creates a new active connection when the shop changes pages', async () => {
    const { prisma, service } = createService();
    const activeConnection = buildConnection();
    const newConnection = buildConnection({
      id: 'conn-2',
      pageId: 'page-2',
      pageName: 'Page Two',
      lastConnectedPageId: 'page-2',
      lastConnectedPageName: 'Page Two',
    });

    prisma.messengerConnection.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeConnection)
      .mockResolvedValueOnce(null);
    prisma.messengerConnection.update.mockResolvedValue(
      buildConnection({
        pageId: null,
        pageName: null,
        pageAccessTokenEncrypted: null,
        status: 'disconnected',
      }),
    );
    prisma.messengerConnection.create.mockResolvedValue(newConnection);

    const unsubscribeSpy = jest
      .spyOn(service as any, 'tryRemoveConnectionWebhookSubscription')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'subscribePageToAppWebhooks')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'backfillMissingThreadProfiles')
      .mockResolvedValue(undefined);

    await expect(
      (service as any).saveConnection(
        'shop-1',
        'page-2',
        'Page Two',
        'EAABsbCS1iHgBAKDifferentToken',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        page_id: 'page-2',
        page_name: 'Page Two',
        status: 'active',
      }),
    );

    expect(unsubscribeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conn-1' }),
    );
    expect(prisma.messengerConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({
        pageId: null,
        pageName: null,
        status: 'disconnected',
        pageAccessTokenEncrypted: null,
        lastConnectedPageId: 'page-1',
        lastConnectedPageName: 'Page One',
      }),
    });
    expect(prisma.messengerConnection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shopId: 'shop-1',
        pageId: 'page-2',
        pageName: 'Page Two',
        lastConnectedPageId: 'page-2',
        lastConnectedPageName: 'Page Two',
        status: 'active',
      }),
    });
  });
});
