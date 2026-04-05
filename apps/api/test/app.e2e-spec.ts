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
