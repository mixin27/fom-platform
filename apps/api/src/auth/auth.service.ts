import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  notFoundError,
  unauthorizedError,
} from '../common/http/app-http.exception';
import {
  assertValid,
  asEnum,
  optionalString,
  requiredString,
} from '../common/utils/validation';
import { PrismaService } from '../common/prisma/prisma.service';
import { generateId } from '../common/utils/id';
import { hashPassword, verifyPassword } from '../common/auth/password';
import { ShopsService } from '../shops/shops.service';

type SessionRecord = {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  private readonly accessTokenTtlMs = 24 * 60 * 60 * 1000;
  private readonly refreshTokenTtlMs = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async register(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = requiredString(body.name, 'name', errors, 'name');
    const email = requiredString(body.email, 'email', errors, 'email');
    const password = requiredString(
      body.password,
      'password',
      errors,
      'password',
    );
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    const locale =
      optionalString(body.locale, 'locale', errors, 'locale') ?? 'my';

    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedEmail) {
      errors.push({
        field: 'email',
        errors: ['Email is required'],
      });
    }
    this.assertValidEmail(normalizedEmail, 'email', errors);
    this.assertPasswordStrength(password, errors);
    assertValid(errors);

    await this.assertUniqueIdentifiers(normalizedEmail, normalizedPhone);

    const user = await this.prisma.user.create({
      data: {
        id: generateId('usr'),
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        locale: locale === 'en' ? 'en' : 'my',
      },
    });

    await this.prisma.passwordCredential.create({
      data: {
        userId: user.id,
        passwordHash: await hashPassword(password),
      },
    });

    await this.prisma.authIdentity.create({
      data: {
        id: generateId('aid'),
        userId: user.id,
        provider: 'password',
        providerUserId: normalizedEmail ?? user.id,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        displayName: user.name,
        lastLoginAt: new Date(),
      },
    });

    const session = await this.createSession(user.id);
    return this.buildAuthResponse(user.id, session);
  }

  async login(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const identifier = requiredString(
      body.identifier,
      'identifier',
      errors,
      'email or phone',
    );
    const password = requiredString(
      body.password,
      'password',
      errors,
      'password',
    );
    assertValid(errors);

    const normalizedEmail = this.normalizeEmail(identifier);
    const normalizedPhone = this.normalizePhone(identifier);
    const lookupFilters: Array<{ email?: string; phone?: string }> = [];
    if (normalizedEmail) {
      lookupFilters.push({ email: normalizedEmail });
    }
    if (normalizedPhone) {
      lookupFilters.push({ phone: normalizedPhone });
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: lookupFilters,
      },
      include: {
        passwordCredential: true,
      },
    });

    if (!user?.passwordCredential) {
      throw unauthorizedError('Email, phone, or password is incorrect');
    }

    const passwordMatches = await verifyPassword(
      password,
      user.passwordCredential.passwordHash,
    );
    if (!passwordMatches) {
      throw unauthorizedError('Email, phone, or password is incorrect');
    }

    const identityKey = user.email ?? normalizedPhone ?? user.id;
    await this.upsertIdentity(user.id, {
      provider: 'password',
      providerUserId: identityKey,
      email: user.email,
      phone: user.phone,
      displayName: user.name,
    });

    const session = await this.createSession(user.id);
    return this.buildAuthResponse(user.id, session);
  }

  async refreshSession(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const refreshToken = requiredString(
      body.refresh_token,
      'refresh_token',
      errors,
      'refresh token',
    );
    assertValid(errors);

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });
    if (
      !session ||
      session.revokedAt ||
      session.refreshExpiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError('Refresh token is invalid or expired');
    }

    const rotated = await this.prisma.session.update({
      where: { id: session.id },
      data: this.sessionTokenUpdateData(),
    });

    return this.buildAuthResponse(session.userId, rotated);
  }

  async socialLogin(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const provider = asEnum(
      body.provider,
      'provider',
      ['google', 'facebook'] as const,
      errors,
      { required: true, label: 'social provider' },
    );
    const providerUserId = requiredString(
      body.provider_user_id,
      'provider_user_id',
      errors,
      'provider user ID',
    );
    const name = optionalString(body.name, 'name', errors, 'name');
    const email = optionalString(body.email, 'email', errors, 'email');
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    const locale =
      optionalString(body.locale, 'locale', errors, 'locale') ?? 'my';

    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPhone = this.normalizePhone(phone);
    if (normalizedEmail) {
      this.assertValidEmail(normalizedEmail, 'email', errors);
    }
    assertValid(errors);

    if (!provider) {
      throw unauthorizedError('Social provider is required');
    }

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      include: {
        user: true,
      },
    });

    let user: any = existingIdentity?.user ?? null;
    if (!user && normalizedEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    }
    if (!user && normalizedPhone) {
      user = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: generateId('usr'),
          name: name ?? `${provider} user`,
          email: normalizedEmail,
          phone: normalizedPhone,
          locale: locale === 'en' ? 'en' : 'my',
          ...(normalizedEmail ? { emailVerifiedAt: new Date() } : {}),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name ? { name } : {}),
          ...(normalizedEmail && !user.email ? { email: normalizedEmail } : {}),
          ...(normalizedPhone && !user.phone ? { phone: normalizedPhone } : {}),
          ...(normalizedEmail && !user.emailVerifiedAt
            ? { emailVerifiedAt: new Date() }
            : {}),
          locale: locale === 'en' ? 'en' : 'my',
        },
      });
    }

    await this.upsertIdentity(user.id, {
      provider,
      providerUserId,
      email: normalizedEmail,
      phone: normalizedPhone,
      displayName: name ?? user.name,
    });

    const session = await this.createSession(user.id);
    return this.buildAuthResponse(user.id, session);
  }

  async startPhoneChallenge(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const phone = requiredString(body.phone, 'phone', errors, 'phone number');
    const purpose =
      optionalString(body.purpose, 'purpose', errors, 'purpose') ?? 'login';
    assertValid(errors);

    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      throw unauthorizedError('Phone number is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    const challenge = await this.prisma.authChallenge.create({
      data: {
        id: generateId('chl'),
        phone: normalizedPhone,
        otpCode: '123456',
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        userId: user?.id ?? null,
      },
    });

    return {
      challenge_id: challenge.id,
      purpose: challenge.purpose,
      expires_at: challenge.expiresAt.toISOString(),
      debug_otp_code: challenge.otpCode,
    };
  }

  async verifyPhoneChallenge(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const challengeId = requiredString(
      body.challenge_id,
      'challenge_id',
      errors,
      'challenge ID',
    );
    const otpCode = requiredString(
      body.otp_code,
      'otp_code',
      errors,
      'OTP code',
    );
    const name = optionalString(body.name, 'name', errors, 'name');
    const email = optionalString(body.email, 'email', errors, 'email');
    const locale =
      optionalString(body.locale, 'locale', errors, 'locale') ?? 'my';

    const normalizedEmail = this.normalizeEmail(email);
    if (normalizedEmail) {
      this.assertValidEmail(normalizedEmail, 'email', errors);
    }
    assertValid(errors);

    const challenge = await this.prisma.authChallenge.findUnique({
      where: { id: challengeId },
    });
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError('OTP challenge is invalid or expired');
    }

    if (challenge.otpCode !== otpCode) {
      throw unauthorizedError('OTP code is invalid');
    }

    let user =
      (challenge.userId &&
        (await this.prisma.user.findUnique({
          where: { id: challenge.userId },
        }))) ||
      (await this.prisma.user.findUnique({
        where: { phone: challenge.phone },
      }));

    if (!user) {
      if (normalizedEmail) {
        await this.assertUniqueIdentifiers(normalizedEmail, challenge.phone);
      }

      user = await this.prisma.user.create({
        data: {
          id: generateId('usr'),
          name: name ?? `Seller ${challenge.phone.slice(-4)}`,
          email: normalizedEmail,
          phone: challenge.phone,
          locale: locale === 'en' ? 'en' : 'my',
          phoneVerifiedAt: new Date(),
        },
      });
    } else {
      if (normalizedEmail && user.email && user.email !== normalizedEmail) {
        throw conflictError(
          'This phone number is already linked to another email',
        );
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name ? { name } : {}),
          ...(normalizedEmail && !user.email ? { email: normalizedEmail } : {}),
          phone: challenge.phone,
          phoneVerifiedAt: new Date(),
          locale: locale === 'en' ? 'en' : 'my',
        },
      });
    }

    await this.prisma.authChallenge.update({
      where: { id: challenge.id },
      data: {
        consumedAt: new Date(),
        userId: user.id,
      },
    });

    await this.upsertIdentity(user.id, {
      provider: 'phone',
      providerUserId: challenge.phone,
      email: user.email,
      phone: challenge.phone,
      displayName: user.name,
    });

    const session = await this.createSession(user.id);
    return this.buildAuthResponse(user.id, session);
  }

  async logout(accessToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        accessToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const session = await this.prisma.session.findUnique({
      where: { accessToken },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.accessExpiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError();
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      phone: session.user.phone,
      locale: session.user.locale,
    };
  }

  async serializeUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authIdentities: {
          orderBy: { provider: 'asc' },
        },
      },
    });
    if (!user) {
      throw notFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      email_verified_at: user.emailVerifiedAt?.toISOString() ?? null,
      phone_verified_at: user.phoneVerifiedAt?.toISOString() ?? null,
      auth_methods: [
        ...new Set(user.authIdentities.map((identity) => identity.provider)),
      ],
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  private async buildAuthResponse(userId: string, session: SessionRecord) {
    return {
      token: session.accessToken,
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      token_type: 'Bearer',
      expires_at: session.accessExpiresAt.toISOString(),
      refresh_expires_at: session.refreshExpiresAt.toISOString(),
      user: await this.serializeUser(userId),
      shops: await this.shopsService.listUserShops(userId),
    };
  }

  private async createSession(userId: string): Promise<SessionRecord> {
    return this.prisma.session.create({
      data: {
        id: generateId('ses'),
        userId,
        ...this.sessionTokenCreateData(),
      },
      select: {
        id: true,
        accessToken: true,
        refreshToken: true,
        accessExpiresAt: true,
        refreshExpiresAt: true,
      },
    });
  }

  private sessionTokenCreateData() {
    return {
      accessToken: generateId('atk'),
      refreshToken: generateId('rtk'),
      accessExpiresAt: new Date(Date.now() + this.accessTokenTtlMs),
      refreshExpiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      lastUsedAt: new Date(),
    };
  }

  private sessionTokenUpdateData() {
    return {
      ...this.sessionTokenCreateData(),
      revokedAt: null,
    };
  }

  private async upsertIdentity(
    userId: string,
    input: {
      provider: string;
      providerUserId: string;
      email?: string | null;
      phone?: string | null;
      displayName?: string | null;
    },
  ) {
    await this.prisma.authIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId: input.providerUserId,
        },
      },
      update: {
        userId,
        email: input.email ?? null,
        phone: input.phone ?? null,
        displayName: input.displayName ?? null,
        lastLoginAt: new Date(),
      },
      create: {
        id: generateId('aid'),
        userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email ?? null,
        phone: input.phone ?? null,
        displayName: input.displayName ?? null,
        lastLoginAt: new Date(),
      },
    });
  }

  private async assertUniqueIdentifiers(
    email?: string | null,
    phone?: string | null,
  ) {
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw conflictError('Email is already registered');
      }
    }

    if (phone) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingUser) {
        throw conflictError('Phone number is already registered');
      }
    }
  }

  private assertValidEmail(
    email: string | null | undefined,
    field: string,
    errors: Array<{ field: string; errors: string[] }>,
  ) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field,
        errors: ['Email must be a valid email address'],
      });
    }
  }

  private assertPasswordStrength(
    password: string,
    errors: Array<{ field: string; errors: string[] }>,
  ) {
    if (password.length < 8) {
      errors.push({
        field: 'password',
        errors: ['Password must be at least 8 characters'],
      });
    }
  }

  private normalizeEmail(value: string | undefined): string | null {
    return value ? value.trim().toLowerCase() : null;
  }

  private normalizePhone(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }
}
