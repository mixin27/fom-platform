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
      oauthDialogUrl: 'https://www.facebook.com/dialog/oauth',
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
  it('builds a Facebook business login URL with code flow override enabled', async () => {
    const { service } = createService();

    const result = await service.beginOauthConnect(
      {
        id: 'user-1',
        name: 'Owner',
      } as any,
      'shop-1',
      {
        redirect_uri:
          'https://getfom.com/dashboard/inbox/connect-meta/callback',
      },
    );

    const authorizationUrl = new URL(result.authorization_url);
    expect(`${authorizationUrl.origin}${authorizationUrl.pathname}`).toBe(
      'https://www.facebook.com/dialog/oauth',
    );
    expect(authorizationUrl.searchParams.get('client_id')).toBe('meta-app-id');
    expect(authorizationUrl.searchParams.get('config_id')).toBe(
      'meta-login-config-id',
    );
    expect(authorizationUrl.searchParams.get('response_type')).toBe('code');
    expect(
      authorizationUrl.searchParams.get('override_default_response_type'),
    ).toBe('true');
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      'https://getfom.com/dashboard/inbox/connect-meta/callback',
    );
    expect(authorizationUrl.searchParams.get('state')).toBeTruthy();
  });

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

  it('resolves selectable pages from a selection token', async () => {
    const { service } = createService();
    const selectionToken = (service as any).encryptJsonPayload({
      kind: 'messenger_oauth_selection',
      shop_id: 'shop-1',
      user_id: 'user-1',
      redirect_uri: 'https://getfom.com/dashboard/inbox/connect-meta/callback',
      user_access_token: 'EAABselectionToken',
      issued_at: new Date().toISOString(),
    });

    jest.spyOn(service as any, 'listAvailablePages').mockResolvedValue([
      {
        id: 'page-1',
        name: 'Page One',
        access_token: 'page-token-1',
      },
      {
        id: 'page-2',
        name: 'Page Two',
        access_token: 'page-token-2',
      },
    ]);

    await expect(
      service.resolveOauthSelectionPages(
        {
          id: 'user-1',
          name: 'Owner',
        } as any,
        'shop-1',
        {
          selection_token: selectionToken,
        },
      ),
    ).resolves.toEqual({
      pages: [
        {
          page_id: 'page-1',
          page_name: 'Page One',
        },
        {
          page_id: 'page-2',
          page_name: 'Page Two',
        },
      ],
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
