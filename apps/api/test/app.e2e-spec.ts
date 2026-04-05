import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

const dbIt = process.env.RUN_DB_E2E === '1' ? it : it.skip;

describe('Facebook Order Manager API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      process.env.RUN_DB_E2E === '1'
        ? await Test.createTestingModule({
            imports: [(await import('./../src/app.module')).AppModule],
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

  dbIt('supports OTP auth and lists seeded shops', async () => {
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
    expect(verifyBody.data.shops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shop_ma_aye',
          membership: expect.objectContaining({
            role: 'owner',
            permissions: expect.arrayContaining(['members.manage']),
          }),
        }),
      ]),
    );
  });

  dbIt('lists seeded orders with documented envelopes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/shops/shop_ma_aye/orders?status=pending&date=today&limit=2',
      headers: {
        authorization: 'Bearer tok_demo_owner',
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
    const challengeResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/phone/start',
      payload: { phone: '09 7800 2222' },
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

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/shops/shop_ma_aye/members',
      headers: {
        authorization: `Bearer ${verifyBody.data.token}`,
      },
      payload: {
        phone: '09 7800 3333',
        name: 'New Staff',
        role: 'staff',
      },
    });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
