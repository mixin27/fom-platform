import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { PrismaService } from './../src/common/prisma/prisma.service';

const dbIt = process.env.RUN_DB_E2E === '1' ? it : it.skip;
const platformOwnerEmail =
  process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ||
  process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ||
  'owner@fom-platform.local';
const platformOwnerPassword = process.env.PLATFORM_OWNER_PASSWORD ?? 'Password123!';

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

async function loginWithPassword(
  app: NestFastifyApplication,
  email: string,
  password: string,
) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email,
      password,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.success).toBe(true);
  return body.data;
}

async function getSeedReferences(app: NestFastifyApplication) {
  const prisma = app.get(PrismaService);
  const shop = await prisma.shop.findFirst({
    where: {
      name: 'Ma Aye Shop',
    },
    select: {
      id: true,
    },
  });
  const staff = await prisma.user.findUnique({
    where: {
      email: 'komin@example.com',
    },
    select: {
      id: true,
    },
  });
  const ayeAye = shop
    ? await prisma.customer.findUnique({
        where: {
          shopId_phone: {
            shopId: shop.id,
            phone: '09 9871 2345',
          },
        },
        select: {
          id: true,
        },
      })
    : null;
  const order0244 = await prisma.order.findUnique({
    where: {
      orderNo: 'ORD-0244',
    },
    select: {
      id: true,
    },
  });

  expect(shop?.id).toBeDefined();
  expect(staff?.id).toBeDefined();
  expect(ayeAye?.id).toBeDefined();
  expect(order0244?.id).toBeDefined();

  return {
    shopId: shop!.id,
    staffUserId: staff!.id,
    customerAyeAyeId: ayeAye!.id,
    order0244Id: order0244!.id,
  };
}

describe('Facebook Order Manager API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      process.env.RUN_DB_E2E === '1'
        ? await Test.createTestingModule({
            imports: [(await import('./../src/app.module.js')).AppModule],
          }).compile()
        : await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
          }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the API overview envelope', () => {
    return app
      .inject({
        method: 'GET',
        url: '/api/v1',
      })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        const body = response.json();
        const payload = body.success ? body.data : body;
        expect(payload.name).toBe('facebook-order-manager-api');
        expect(payload.base_url).toBe('/api/v1');
      });
  });

  dbIt(
    'supports email/password login and refresh with seeded accounts',
    async () => {
      const seedRefs = await getSeedReferences(app);
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: {
          'user-agent': 'jest-e2e-client/1.0',
          'x-forwarded-for': '203.0.113.10',
        },
        payload: {
          email: 'maaye@example.com',
          password: 'Password123!',
        },
      });
      expect(loginResponse.statusCode).toBe(200);
      const loginBody = loginResponse.json();

      expect(loginBody.success).toBe(true);
      expect(loginBody.data.user.email).toBe('maaye@example.com');
      const accessPayload = decodeJwtPayload(loginBody.data.access_token);
      const prisma = app.get(PrismaService);
      const session = await prisma.session.findUnique({
        where: { id: accessPayload.sid },
      });

      expect(accessPayload.sub).toBeDefined();
      expect(accessPayload.type).toBe('access');
      expect(session).toMatchObject({
        ipAddress: '203.0.113.10',
        userAgent: 'jest-e2e-client/1.0',
        lastUsedIpAddress: '203.0.113.10',
        lastUsedUserAgent: 'jest-e2e-client/1.0',
      });
      expect(accessPayload.shops).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shop_id: seedRefs.shopId,
            roles: expect.arrayContaining(['owner']),
            permissions: expect.arrayContaining([
              'members.manage',
              'shops.write',
            ]),
          }),
        ]),
      );
      expect(loginBody.data.shops).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: seedRefs.shopId,
            membership: expect.objectContaining({
              role: 'owner',
              roles: expect.arrayContaining([
                expect.objectContaining({ code: 'owner' }),
              ]),
              permissions: expect.arrayContaining([
                'members.manage',
                'shops.write',
              ]),
            }),
          }),
        ]),
      );

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          'user-agent': 'jest-e2e-client/1.1',
          'x-forwarded-for': '203.0.113.11',
        },
        payload: {
          refresh_token: loginBody.data.refresh_token,
        },
      });
      expect(refreshResponse.statusCode).toBe(200);
      const refreshBody = refreshResponse.json();

      expect(refreshBody.success).toBe(true);
      expect(refreshBody.data.access_token).toEqual(expect.any(String));
      expect(refreshBody.data.refresh_token).toEqual(expect.any(String));

      const refreshedAccessPayload = decodeJwtPayload(
        refreshBody.data.access_token,
      );
      const refreshedSession = await prisma.session.findUnique({
        where: { id: refreshedAccessPayload.sid },
      });
      expect(refreshedSession).toMatchObject({
        ipAddress: '203.0.113.10',
        userAgent: 'jest-e2e-client/1.0',
        lastUsedIpAddress: '203.0.113.11',
        lastUsedUserAgent: 'jest-e2e-client/1.1',
      });
    },
  );

  dbIt(
    'keeps only one active session when the same account signs in again',
    async () => {
      const firstLogin = await loginWithPassword(
        app,
        'maaye@example.com',
        'Password123!',
      );
      const secondLogin = await loginWithPassword(
        app,
        'maaye@example.com',
        'Password123!',
      );

      const firstAccessPayload = decodeJwtPayload(firstLogin.access_token);
      const secondAccessPayload = decodeJwtPayload(secondLogin.access_token);
      const prisma = app.get(PrismaService);

      const firstMeResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${firstLogin.access_token}`,
        },
      });
      expect(firstMeResponse.statusCode).toBe(401);

      const firstRefreshResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refresh_token: firstLogin.refresh_token,
        },
      });
      expect(firstRefreshResponse.statusCode).toBe(401);

      const secondMeResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${secondLogin.access_token}`,
        },
      });
      expect(secondMeResponse.statusCode).toBe(200);

      const sessions = await prisma.session.findMany({
        where: {
          id: {
            in: [firstAccessPayload.sid, secondAccessPayload.sid],
          },
        },
        select: {
          id: true,
          userId: true,
          revokedAt: true,
        },
      });

      const firstSession = sessions.find(
        (session) => session.id === firstAccessPayload.sid,
      );
      const secondSession = sessions.find(
        (session) => session.id === secondAccessPayload.sid,
      );

      expect(firstSession?.revokedAt).toBeInstanceOf(Date);
      expect(secondSession?.revokedAt).toBeNull();
      expect(firstSession?.userId).toBe(secondSession?.userId);

      const activeSessionCount = await prisma.session.count({
        where: {
          userId: secondSession!.userId,
          revokedAt: null,
        },
      });
      expect(activeSessionCount).toBe(1);
    },
  );

  dbIt('includes platform owner access in the login payload', async () => {
    const loginData = await loginWithPassword(
      app,
      platformOwnerEmail,
      platformOwnerPassword,
    );
    const accessPayload = decodeJwtPayload(loginData.access_token);

    expect(loginData.user.email).toBe(platformOwnerEmail);
    expect(accessPayload.platform).toEqual(
      expect.objectContaining({
        role: 'platform_owner',
        roles: expect.arrayContaining(['platform_owner']),
        permissions: expect.arrayContaining([
          'platform.dashboard.read',
          'platform.shops.write',
        ]),
      }),
    );
    expect(loginData.platform_access).toEqual(
      expect.objectContaining({
        role: 'platform_owner',
        permissions: expect.arrayContaining([
          'platform.dashboard.read',
          'platform.shops.write',
        ]),
      }),
    );
  });

  dbIt('supports platform-side shop CRUD management', async () => {
    const loginData = await loginWithPassword(
      app,
      platformOwnerEmail,
      platformOwnerPassword,
    );
    const uniqueEmail = `platform-crud-${Date.now()}@example.com`;

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/shops',
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        name: 'Platform CRUD Shop',
        timezone: 'Asia/Yangon',
        owner_name: 'Platform Managed Owner',
        owner_email: uniqueEmail,
        owner_phone: '09 7000 4321',
        owner_password: 'Password123!',
      },
    });

    expect(createResponse.statusCode).toBe(200);
    const createBody = createResponse.json();
    expect(createBody.success).toBe(true);
    expect(createBody.data).toEqual(
      expect.objectContaining({
        name: 'Platform CRUD Shop',
        timezone: 'Asia/Yangon',
        owner_name: 'Platform Managed Owner',
        owner_email: uniqueEmail,
      }),
    );

    const createdShopId = createBody.data.id as string;

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/platform/shops/${createdShopId}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });

    expect(getResponse.statusCode).toBe(200);
    const getBody = getResponse.json();
    expect(getBody.success).toBe(true);
    expect(getBody.data.id).toBe(createdShopId);

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/shops/${createdShopId}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        name: 'Platform CRUD Shop Updated',
        timezone: 'Asia/Singapore',
        owner_name: 'Updated Managed Owner',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = updateResponse.json();
    expect(updateBody.success).toBe(true);
    expect(updateBody.data).toEqual(
      expect.objectContaining({
        id: createdShopId,
        name: 'Platform CRUD Shop Updated',
        timezone: 'Asia/Singapore',
        owner_name: 'Updated Managed Owner',
      }),
    );

    const ownerLogin = await loginWithPassword(app, uniqueEmail, 'Password123!');
    expect(ownerLogin.user.email).toBe(uniqueEmail);
    expect(ownerLogin.shops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdShopId,
        }),
      ]),
    );

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/platform/shops/${createdShopId}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const prisma = app.get(PrismaService);
    const deletedShop = await prisma.shop.findUnique({
      where: { id: createdShopId },
      select: { id: true },
    });
    expect(deletedShop).toBeNull();
  });

  dbIt('supports platform support issue workflow actions', async () => {
    const loginData = await loginWithPassword(
      app,
      platformOwnerEmail,
      platformOwnerPassword,
    );
    const seedRefs = await getSeedReferences(app);

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/support/issues',
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        shop_id: seedRefs.shopId,
        kind: 'operations',
        severity: 'medium',
        title: 'Follow up onboarding task',
        detail: 'Owner needs help setting first delivery workflow.',
      },
    });

    expect(createResponse.statusCode).toBe(200);
    const createBody = createResponse.json();
    expect(createBody.success).toBe(true);
    expect(createBody.data).toEqual(
      expect.objectContaining({
        kind: 'operations',
        severity: 'medium',
        status: 'open',
        source: 'manual',
      }),
    );

    const createdIssueId = createBody.data.id as string;

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/support/issues/${createdIssueId}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        status: 'in_progress',
        assigned_to_user_id: seedRefs.staffUserId,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = updateResponse.json();
    expect(updateBody.success).toBe(true);
    expect(updateBody.data).toEqual(
      expect.objectContaining({
        id: createdIssueId,
        status: 'in_progress',
        assigned_to_user_id: seedRefs.staffUserId,
      }),
    );

    const supportResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/support',
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(supportResponse.statusCode).toBe(200);
    const supportBody = supportResponse.json();
    expect(supportBody.success).toBe(true);
    expect(supportBody.data.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdIssueId,
          status: 'in_progress',
        }),
      ]),
    );

    const resolveResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/support/issues/${createdIssueId}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        status: 'resolved',
        resolution_note: 'Owner onboarded and confirmed workflow setup.',
      },
    });
    expect(resolveResponse.statusCode).toBe(200);
    const resolveBody = resolveResponse.json();
    expect(resolveBody.success).toBe(true);
    expect(resolveBody.data.status).toBe('resolved');
  });

  dbIt('supports platform settings profile and plan edit actions', async () => {
    const loginData = await loginWithPassword(
      app,
      platformOwnerEmail,
      platformOwnerPassword,
    );
    const prisma = app.get(PrismaService);
    const trialPlan = await prisma.plan.findUnique({
      where: { code: 'trial' },
      select: { id: true, description: true },
    });

    expect(trialPlan?.id).toBeDefined();

    const profileResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/platform/settings/profile',
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        name: 'Platform Owner Updated',
        locale: 'en',
      },
    });
    expect(profileResponse.statusCode).toBe(200);
    const profileBody = profileResponse.json();
    expect(profileBody.success).toBe(true);
    expect(profileBody.data.profile.name).toBe('Platform Owner Updated');

    const nextDescription = `Trial plan updated ${Date.now()}`;
    const planResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/platform/settings/plans/${trialPlan!.id}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        description: nextDescription,
      },
    });
    expect(planResponse.statusCode).toBe(200);
    const planBody = planResponse.json();
    expect(planBody.success).toBe(true);
    expect(planBody.data).toEqual(
      expect.objectContaining({
        id: trialPlan!.id,
        code: 'trial',
        description: nextDescription,
      }),
    );

    await prisma.plan.update({
      where: { id: trialPlan!.id },
      data: {
        description: trialPlan!.description,
      },
    });
  });

  dbIt('lists current user shops with membership access details', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops?limit=10',
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: seedRefs.shopId,
          name: 'Ma Aye Shop',
          membership: expect.objectContaining({
            role: 'owner',
            permissions: expect.arrayContaining(['shops.write']),
          }),
        }),
      ]),
    );
    expect(body.meta.pagination).toMatchObject({
      limit: 10,
      total: expect.any(Number),
    });
  });

  dbIt('lists customers with typed query filters', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/customers?segment=vip&sort=top_spenders&limit=5`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: seedRefs.customerAyeAyeId,
          phone: '09 9871 2345',
          is_vip: true,
          total_spent: expect.any(Number),
        }),
      ]),
    );
    expect(body.meta.pagination).toMatchObject({
      limit: 5,
      total: expect.any(Number),
    });
  });

  dbIt('supports phone OTP auth as an optional sign-in method', async () => {
    const challengeResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/phone/start',
      payload: { phone: '09 7800 1111' },
    });
    expect(challengeResponse.statusCode).toBe(200);
    const challengeBody = challengeResponse.json();

    const verifyResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/phone/verify',
      payload: {
        challenge_id: challengeBody.data.challenge_id,
        otp_code: challengeBody.data.debug_otp_code,
      },
    });
    expect(verifyResponse.statusCode).toBe(200);
    const verifyBody = verifyResponse.json();

    expect(verifyBody.success).toBe(true);
    expect(verifyBody.data.user.phone).toBe('09 7800 1111');
    expect(verifyBody.data.access_token).toEqual(expect.any(String));
  });

  dbIt(
    'supports social identity sign-in when the provider identity is supplied',
    async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/social/login',
        payload: {
          provider: 'facebook',
          provider_user_id: 'fb_demo_owner',
          email: 'maaye@example.com',
          name: 'Ma Aye',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('maaye@example.com');
      expect(body.data.access_token).toEqual(expect.any(String));
    },
  );

  dbIt('lists seeded orders with documented envelopes', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/orders?status=pending&date=today&limit=2`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        order_no: expect.any(String),
        status: expect.any(String),
      }),
    );
    expect(body.meta.pagination).toMatchObject({
      limit: 2,
      total: expect.any(Number),
    });
  });

  dbIt('creates an order with nested customer and typed items', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/shops/${seedRefs.shopId}/orders`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        customer: {
          name: 'Daw New Customer',
          phone: '09 7777 0000',
          township: 'Bahan',
          address: 'No. 7, Example Street, Bahan, Yangon',
        },
        items: [
          {
            product_name: 'T-shirt',
            qty: 1,
            unit_price: 12000,
          },
          {
            product_name: 'Cap',
            qty: 2,
            unit_price: 8000,
          },
        ],
        delivery_fee: 3000,
        currency: 'MMK',
        source: 'manual',
        note: 'Deliver after 5pm',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        order_no: expect.stringMatching(/^ORD-\d+$/),
        status: 'new',
        total_price: 31000,
        customer: expect.objectContaining({
          name: 'Daw New Customer',
          phone: '09 7777 0000',
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            product_name: 'T-shirt',
            qty: 1,
            unit_price: 12000,
          }),
          expect.objectContaining({
            product_name: 'Cap',
            qty: 2,
            unit_price: 8000,
          }),
        ]),
      }),
    );
    expect(body.data.status_history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          to_status: 'new',
        }),
      ]),
    );
  });

  dbIt('parses copied Messenger text into a suggested order draft', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/shops/${seedRefs.shopId}/orders/parse-message`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        message: [
          'Daw Aye Aye',
          '09 9871 2345',
          'Silk Longyi Set (Green, Size M) x2 18000',
          'Deli 3000',
        ].join('\n'),
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        suggested_order: expect.objectContaining({
          customer: expect.objectContaining({
            name: 'Daw Aye Aye',
            phone: '09 9871 2345',
            address: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
          }),
          delivery_fee: 3000,
          status: 'new',
          source: 'messenger',
        }),
        customer_match: expect.objectContaining({
          id: seedRefs.customerAyeAyeId,
          phone: '09 9871 2345',
        }),
        parse_meta: expect.objectContaining({
          is_ready_to_create: true,
          confidence: expect.any(Number),
          matched_fields: expect.arrayContaining(['customer.address']),
        }),
      }),
    );
  });

  dbIt('creates, lists, and updates message templates', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const suffix = Date.now().toString();

    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/shops/${seedRefs.shopId}/templates`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        title: `Delivery follow-up ${suffix}`,
        shortcut: `/followup-${suffix}`,
        body: 'မင်္ဂလာပါရှင်။ ပစ္စည်းလက်ခံရရှိပြီလား ဆိုတာ ပြန်ပြောပေးပါရှင်။',
        is_active: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = createResponse.json();
    expect(createBody.success).toBe(true);
    expect(createBody.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        shop_id: seedRefs.shopId,
        title: `Delivery follow-up ${suffix}`,
        shortcut: `/followup-${suffix}`,
        is_active: true,
      }),
    );

    const listResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/templates?search=${suffix}&state=active&limit=5`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createBody.data.id,
          title: `Delivery follow-up ${suffix}`,
        }),
      ]),
    );
    expect(listBody.meta.pagination).toMatchObject({
      limit: 5,
      total: expect.any(Number),
    });

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/shops/${seedRefs.shopId}/templates/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        body: 'မင်္ဂလာပါရှင်။ အော်ဒါပို့ပြီးပါပြီ။ လက်ခံရရှိချိန် ပြန်ပြောပေးပါရှင်။',
        is_active: false,
        shortcut: null,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = updateResponse.json();
    expect(updateBody.success).toBe(true);
    expect(updateBody.data).toEqual(
      expect.objectContaining({
        id: createBody.data.id,
        shortcut: null,
        is_active: false,
      }),
    );
  });

  dbIt('creates, lists, and updates deliveries with order sync', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/shops/${seedRefs.shopId}/deliveries`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        order_id: seedRefs.order0244Id,
        driver_user_id: seedRefs.staffUserId,
        status: 'scheduled',
        scheduled_at: '2026-04-02T05:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = createResponse.json();
    expect(createBody.success).toBe(true);
    expect(createBody.data).toEqual(
      expect.objectContaining({
        shop_id: seedRefs.shopId,
        order_id: seedRefs.order0244Id,
        driver_user_id: seedRefs.staffUserId,
        status: 'scheduled',
        order: expect.objectContaining({
          id: seedRefs.order0244Id,
          status: 'confirmed',
        }),
      }),
    );

    const listResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/deliveries?status=scheduled&driver_user_id=${seedRefs.staffUserId}&search=0244&limit=5`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createBody.data.id,
          order_id: seedRefs.order0244Id,
        }),
      ]),
    );
    expect(listBody.meta.pagination).toMatchObject({
      limit: 5,
      total: expect.any(Number),
    });

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/shops/${seedRefs.shopId}/deliveries/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        status: 'delivered',
        delivered_at: '2026-04-02T11:30:00.000Z',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = updateResponse.json();
    expect(updateBody.success).toBe(true);
    expect(updateBody.data).toEqual(
      expect.objectContaining({
        id: createBody.data.id,
        status: 'delivered',
        delivered_at: '2026-04-02T11:30:00.000Z',
        order: expect.objectContaining({
          id: seedRefs.order0244Id,
          status: 'delivered',
        }),
      }),
    );
  });

  dbIt('returns a typed daily summary for a shop date', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/summaries/daily?date=2026-04-02`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: seedRefs.shopId,
        summary_date: '2026-04-02',
        total_orders: expect.any(Number),
        total_revenue: expect.any(Number),
        status_breakdown: expect.objectContaining({
          new: expect.any(Number),
          confirmed: expect.any(Number),
          out_for_delivery: expect.any(Number),
          delivered: expect.any(Number),
        }),
        top_products: expect.any(Array),
        recent_orders: expect.any(Array),
      }),
    );
  });

  dbIt('returns a weekly report for an anchor date', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/reports/weekly?date=2026-04-02`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: seedRefs.shopId,
        report_type: 'weekly',
        period_start_date: expect.any(String),
        period_end_date: expect.any(String),
        daily_breakdown: expect.any(Array),
        top_products: expect.any(Array),
      }),
    );
  });

  dbIt('returns a monthly report for a month key', async () => {
    const loginData = await loginWithPassword(
      app,
      'maaye@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/${seedRefs.shopId}/reports/monthly?month=2026-04`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: seedRefs.shopId,
        report_type: 'monthly',
        period_key: '2026-04',
        period_label: expect.any(String),
        total_revenue: expect.any(Number),
        recent_orders: expect.any(Array),
      }),
    );
  });

  dbIt('enforces RBAC for member management', async () => {
    const loginData = await loginWithPassword(
      app,
      'komin@example.com',
      'Password123!',
    );
    const seedRefs = await getSeedReferences(app);

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/shops/${seedRefs.shopId}/members`,
      headers: {
        authorization: `Bearer ${loginData.access_token}`,
      },
      payload: {
        email: 'newstaff@example.com',
        name: 'New Staff',
        role_codes: ['staff'],
      },
    });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
