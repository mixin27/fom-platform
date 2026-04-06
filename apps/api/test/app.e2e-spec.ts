import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { PrismaService } from './../src/common/prisma/prisma.service';

const dbIt = process.env.RUN_DB_E2E === '1' ? it : it.skip;

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
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
            shop_id: 'shop_ma_aye',
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
            id: 'shop_ma_aye',
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

  dbIt('lists current user shops with membership access details', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops?limit=10',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shop_ma_aye',
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
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/customers?segment=vip&sort=top_spenders&limit=5',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'cus_daw_aye_aye',
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
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/orders?status=pending&date=today&limit=2',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/shops/shop_ma_aye/orders',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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

  dbIt('creates, lists, and updates message templates', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const suffix = Date.now().toString();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/shops/shop_ma_aye/templates',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
        shop_id: 'shop_ma_aye',
        title: `Delivery follow-up ${suffix}`,
        shortcut: `/followup-${suffix}`,
        is_active: true,
      }),
    );

    const listResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/shops/shop_ma_aye/templates?search=${suffix}&state=active&limit=5`,
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
      url: `/api/v1/shops/shop_ma_aye/templates/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/shops/shop_ma_aye/deliveries',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
      payload: {
        order_id: 'ord_0244',
        driver_user_id: 'usr_ko_min',
        status: 'scheduled',
        scheduled_at: '2026-04-02T05:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = createResponse.json();
    expect(createBody.success).toBe(true);
    expect(createBody.data).toEqual(
      expect.objectContaining({
        shop_id: 'shop_ma_aye',
        order_id: 'ord_0244',
        driver_user_id: 'usr_ko_min',
        status: 'scheduled',
        order: expect.objectContaining({
          id: 'ord_0244',
          status: 'confirmed',
        }),
      }),
    );

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/deliveries?status=scheduled&driver_user_id=usr_ko_min&search=0244&limit=5',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createBody.data.id,
          order_id: 'ord_0244',
        }),
      ]),
    );
    expect(listBody.meta.pagination).toMatchObject({
      limit: 5,
      total: expect.any(Number),
    });

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/shops/shop_ma_aye/deliveries/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
          id: 'ord_0244',
          status: 'delivered',
        }),
      }),
    );
  });

  dbIt('returns a typed daily summary for a shop date', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/summaries/daily?date=2026-04-02',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: 'shop_ma_aye',
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
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/reports/weekly?date=2026-04-02',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: 'shop_ma_aye',
        report_type: 'weekly',
        period_start_date: expect.any(String),
        period_end_date: expect.any(String),
        daily_breakdown: expect.any(Array),
        top_products: expect.any(Array),
      }),
    );
  });

  dbIt('returns a monthly report for a month key', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'maaye@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/reports/monthly?month=2026-04',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        shop_id: 'shop_ma_aye',
        report_type: 'monthly',
        period_key: '2026-04',
        period_label: expect.any(String),
        total_revenue: expect.any(Number),
        recent_orders: expect.any(Array),
      }),
    );
  });

  dbIt('enforces RBAC for member management', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'komin@example.com',
        password: 'Password123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/shops/shop_ma_aye/members',
      headers: {
        authorization: `Bearer ${loginBody.data.access_token}`,
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
