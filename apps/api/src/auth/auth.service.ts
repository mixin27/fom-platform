import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  conflictError,
  notFoundError,
  unauthorizedError,
} from '../common/http/app-http.exception';
import type { User } from '../generated/prisma/client';
import type {
  AuthenticatedUser,
  SessionRequestMetadata,
} from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { generateId } from '../common/utils/id';
import { hashPassword, verifyPassword } from '../common/auth/password';
import { EmailOutboxService } from '../email/email-outbox.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ShopsService } from '../shops/shops.service';
import type { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshSessionDto } from './dto/refresh-session.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { SocialLoginDto } from './dto/social-login.dto';
import type { StartPhoneChallengeDto } from './dto/start-phone-challenge.dto';
import type { VerifyPhoneChallengeDto } from './dto/verify-phone-challenge.dto';
import type {
  AccessTokenPayload,
  JwtPlatformAccess,
  JwtShopAccess,
  RefreshTokenPayload,
} from './auth.types';
import { jwtConfig } from './jwt.config';

type SessionRecord = {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
};

type AuthSessionContext = {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    locale: string;
    emailVerifiedAt: string | null;
  };
  platform: {
    role: string | null;
    roles: Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
    }>;
    permissions: string[];
  } | null;
  shops: Awaited<ReturnType<ShopsService['listUserShops']>>;
  jwtPlatform: JwtPlatformAccess | null;
  jwtShops: JwtShopAccess[];
};

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
    private readonly jwtService: JwtService,
    private readonly emailOutbox: EmailOutboxService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async register(body: RegisterDto, metadata: SessionRequestMetadata) {
    const normalizedEmail = body.email.trim().toLowerCase();
    const normalizedPhone = this.normalizePhone(body.phone);

    await this.assertUniqueIdentifiers(normalizedEmail, normalizedPhone);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        locale: body.locale ?? 'my',
      },
    });

    await this.prisma.passwordCredential.create({
      data: {
        userId: user.id,
        passwordHash: await hashPassword(body.password),
      },
    });

    await this.upsertIdentity(user.id, {
      provider: 'password',
      providerUserId: normalizedEmail,
      email: normalizedEmail,
      phone: normalizedPhone,
      displayName: user.name,
    });

    const issuedSession = await this.issueSessionForUser(user.id, metadata);
    const authResponse = this.buildAuthResponse(issuedSession);

    await this.sendPostRegistrationEmails(user, metadata);
    return authResponse;
  }

  async login(body: LoginDto, metadata: SessionRequestMetadata) {
    const normalizedEmail = body.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      include: {
        passwordCredential: true,
      },
    });

    if (!user?.passwordCredential) {
      throw unauthorizedError('Email or password is incorrect');
    }

    const passwordMatches = await verifyPassword(
      body.password,
      user.passwordCredential.passwordHash,
    );
    if (!passwordMatches) {
      throw unauthorizedError('Email or password is incorrect');
    }

    await this.upsertIdentity(user.id, {
      provider: 'password',
      providerUserId: user.email ?? normalizedEmail,
      email: user.email,
      phone: user.phone,
      displayName: user.name,
    });

    const issuedSession = await this.issueSessionForUser(user.id, metadata);
    return this.buildAuthResponse(issuedSession);
  }

  async refreshSession(
    body: RefreshSessionDto,
    metadata: SessionRequestMetadata,
  ) {
    const refreshPayload = await this.verifyRefreshToken(body.refresh_token);
    const session = await this.prisma.session.findUnique({
      where: { id: refreshPayload.sid },
    });

    if (
      !session ||
      session.userId !== refreshPayload.sub ||
      session.revokedAt ||
      session.refreshToken !== body.refresh_token ||
      session.refreshExpiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError('Refresh token is invalid or expired');
    }

    const issuedSession = await this.issueSessionForUser(
      session.userId,
      metadata,
      session.id,
    );
    return this.buildAuthResponse(issuedSession);
  }

  async socialLogin(body: SocialLoginDto, metadata: SessionRequestMetadata) {
    const normalizedEmail = body.email?.trim().toLowerCase() ?? null;
    const normalizedPhone = this.normalizePhone(body.phone);

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: body.provider,
          providerUserId: body.provider_user_id,
        },
      },
      include: {
        user: true,
      },
    });

    let user: User | null = existingIdentity?.user ?? null;
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
          name: body.name ?? `${body.provider} user`,
          email: normalizedEmail,
          phone: normalizedPhone,
          locale: body.locale ?? 'my',
          ...(normalizedEmail ? { emailVerifiedAt: new Date() } : {}),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(body.name ? { name: body.name } : {}),
          ...(normalizedEmail && !user.email ? { email: normalizedEmail } : {}),
          ...(normalizedPhone && !user.phone ? { phone: normalizedPhone } : {}),
          ...(normalizedEmail && !user.emailVerifiedAt
            ? { emailVerifiedAt: new Date() }
            : {}),
          locale: body.locale ?? 'my',
        },
      });
    }

    await this.upsertIdentity(user.id, {
      provider: body.provider,
      providerUserId: body.provider_user_id,
      email: normalizedEmail,
      phone: normalizedPhone,
      displayName: body.name ?? user.name,
    });

    const issuedSession = await this.issueSessionForUser(user.id, metadata);
    return this.buildAuthResponse(issuedSession);
  }

  async sendEmailVerification(
    currentUser: AuthenticatedUser,
    metadata: SessionRequestMetadata,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw notFoundError('User not found');
    }

    if (!user.email) {
      throw conflictError('An email address is required before it can be verified');
    }

    if (user.emailVerifiedAt) {
      return {
        email: user.email,
        email_verified_at: user.emailVerifiedAt.toISOString(),
        sent: false,
        already_verified: true,
      };
    }

    await this.enqueueEmailVerification(user, metadata);

    return {
      email: user.email,
      email_verified_at: null,
      sent: true,
      already_verified: false,
    };
  }

  async confirmEmailVerification(body: ConfirmEmailVerificationDto) {
    const actionToken = await this.resolveEmailActionToken(
      body.token,
      'verify_email',
    );

    const user = await this.prisma.user.findUnique({
      where: { id: actionToken.userId },
    });
    if (!user || !user.email || user.email !== actionToken.email) {
      throw unauthorizedError('Email verification token is invalid or expired');
    }

    const verifiedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: verifiedAt,
        },
      });

      await tx.emailActionToken.update({
        where: { id: actionToken.id },
        data: {
          consumedAt: verifiedAt,
        },
      });
    });

    return {
      email: user.email,
      email_verified_at: verifiedAt.toISOString(),
      verified: true,
    };
  }

  async forgotPassword(
    body: ForgotPasswordDto,
    metadata: SessionRequestMetadata,
  ) {
    const normalizedEmail = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        passwordCredential: true,
      },
    });

    if (user?.passwordCredential && user.email) {
      await this.enqueuePasswordResetEmail(user, metadata);
    }

    return {
      accepted: true,
      message:
        'If the account exists, a password reset email has been queued.',
    };
  }

  async resetPassword(
    body: ResetPasswordDto,
    _metadata: SessionRequestMetadata,
  ) {
    const actionToken = await this.resolveEmailActionToken(
      body.token,
      'reset_password',
    );
    const user = await this.prisma.user.findUnique({
      where: { id: actionToken.userId },
    });

    if (!user || !user.email || user.email !== actionToken.email) {
      throw unauthorizedError('Password reset token is invalid or expired');
    }

    const passwordHash = await hashPassword(body.password);
    const resetAt = new Date();

    const revokedSessionIds = await this.prisma.$transaction(async (tx) => {
      const activeSessions = await tx.session.findMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        select: {
          id: true,
        },
      });

      await tx.passwordCredential.upsert({
        where: { userId: user.id },
        update: {
          passwordHash,
        },
        create: {
          userId: user.id,
          passwordHash,
        },
      });

      await tx.emailActionToken.update({
        where: { id: actionToken.id },
        data: {
          consumedAt: resetAt,
        },
      });

      if (activeSessions.length > 0) {
        const sessionIds = activeSessions.map((session) => session.id);
        await tx.session.updateMany({
          where: {
            id: {
              in: sessionIds,
            },
            revokedAt: null,
          },
          data: {
            revokedAt: resetAt,
          },
        });
        await tx.pushDevice.updateMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }

      return activeSessions.map((session) => session.id);
    });

    this.disconnectRealtimeSessions(revokedSessionIds, 'password_reset');

    await this.upsertIdentity(user.id, {
      provider: 'password',
      providerUserId: user.email,
      email: user.email,
      phone: user.phone,
      displayName: user.name,
    });

    await this.emailOutbox.queueAndSendTemplatedEmail({
      userId: user.id,
      toEmail: user.email,
      recipientName: user.name,
      templateKey: 'auth.password_reset_success',
      variables: {
        ctaLabel: 'Sign in',
        ctaUrl: `${this.getWebAppBaseUrl()}/sign-in`,
      },
    });

    return {
      reset: true,
      email: user.email,
      reset_at: resetAt.toISOString(),
    };
  }

  async startPhoneChallenge(body: StartPhoneChallengeDto) {
    const normalizedPhone = this.normalizePhone(body.phone);
    if (!normalizedPhone) {
      throw unauthorizedError('Phone number is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    const challenge = await this.prisma.authChallenge.create({
      data: {
        phone: normalizedPhone,
        otpCode: '123456',
        purpose: body.purpose ?? 'login',
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

  async verifyPhoneChallenge(
    body: VerifyPhoneChallengeDto,
    metadata: SessionRequestMetadata,
  ) {
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { id: body.challenge_id },
    });
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError('OTP challenge is invalid or expired');
    }

    if (challenge.otpCode !== body.otp_code) {
      throw unauthorizedError('OTP code is invalid');
    }

    const normalizedEmail = body.email?.trim().toLowerCase() ?? null;

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
          name: body.name ?? `Seller ${challenge.phone.slice(-4)}`,
          email: normalizedEmail,
          phone: challenge.phone,
          locale: body.locale ?? 'my',
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
          ...(body.name ? { name: body.name } : {}),
          ...(normalizedEmail && !user.email ? { email: normalizedEmail } : {}),
          phone: challenge.phone,
          phoneVerifiedAt: new Date(),
          locale: body.locale ?? 'my',
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

    const issuedSession = await this.issueSessionForUser(user.id, metadata);
    return this.buildAuthResponse(issuedSession);
  }

  async logout(accessToken: string): Promise<void> {
    const payload = await this.verifyAccessToken(accessToken);
    const revokedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        where: {
          id: payload.sid,
          accessToken,
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      });
      await tx.pushDevice.updateMany({
        where: {
          sessionId: payload.sid,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });

    this.disconnectRealtimeSessions([payload.sid], 'logged_out');
  }

  async authenticate(
    accessToken: string,
    metadata: SessionRequestMetadata,
  ): Promise<AuthenticatedUser> {
    const payload = await this.verifyAccessToken(accessToken);
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.accessToken !== accessToken ||
      session.accessExpiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError();
    }

    const normalizedMetadata = this.normalizeSessionMetadata(metadata);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIpAddress: normalizedMetadata.ipAddress,
        lastUsedUserAgent: normalizedMetadata.userAgent,
      },
    });

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      locale: payload.locale,
      sessionId: payload.sid,
      platform: payload.platform,
      shops: payload.shops,
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
      platform_access: await this.buildPlatformAccess(user.id),
      auth_methods: [
        ...new Set(user.authIdentities.map((identity) => identity.provider)),
      ],
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  private async issueSessionForUser(
    userId: string,
    metadata: SessionRequestMetadata,
    sessionId?: string,
  ) {
    const context = await this.buildSessionContext(userId);
    const normalizedMetadata = this.normalizeSessionMetadata(metadata);
    const accessExpiresAt = new Date(
      Date.now() + jwtConfig.accessTokenTtlSeconds * 1000,
    );
    const refreshExpiresAt = new Date(
      Date.now() + jwtConfig.refreshTokenTtlSeconds * 1000,
    );
    const issuedAt = new Date();

    const { persistedSession, revokedSessionIds } =
      await this.prisma.$transaction(async (tx) => {
        const currentSession =
          sessionId !== undefined
            ? { id: sessionId }
            : await tx.session.create({
                data: {
                  userId,
                  accessToken: `pending_access_${generateId('tmp')}`,
                  refreshToken: `pending_refresh_${generateId('tmp')}`,
                  accessExpiresAt,
                  refreshExpiresAt,
                  lastUsedAt: issuedAt,
                  ipAddress: normalizedMetadata.ipAddress,
                  userAgent: normalizedMetadata.userAgent,
                  lastUsedIpAddress: normalizedMetadata.ipAddress,
                  lastUsedUserAgent: normalizedMetadata.userAgent,
                },
                select: { id: true },
              });

        const accessPayload: AccessTokenPayload = {
          type: 'access',
          sub: context.user.id,
          sid: currentSession.id,
          name: context.user.name,
          email: context.user.email,
          phone: context.user.phone,
          locale: context.user.locale,
          platform: context.jwtPlatform,
          shops: context.jwtShops,
        };
        const refreshPayload: RefreshTokenPayload = {
          type: 'refresh',
          sub: context.user.id,
          sid: currentSession.id,
        };

        const accessToken = await this.jwtService.signAsync(accessPayload, {
          secret: jwtConfig.accessSecret,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
          expiresIn: jwtConfig.accessTokenTtlSeconds,
        });
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
          secret: jwtConfig.refreshSecret,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
          expiresIn: jwtConfig.refreshTokenTtlSeconds,
        });

        const existingSessions = await tx.session.findMany({
          where: {
            userId,
            revokedAt: null,
            id: {
              not: currentSession.id,
            },
          },
          select: {
            id: true,
          },
        });
        const revokedSessionIds = existingSessions.map((session) => session.id);

        if (revokedSessionIds.length > 0) {
          await tx.session.updateMany({
            where: {
              id: {
                in: revokedSessionIds,
              },
              revokedAt: null,
            },
            data: {
              revokedAt: issuedAt,
            },
          });
          await tx.pushDevice.updateMany({
            where: {
              sessionId: {
                in: revokedSessionIds,
              },
              isActive: true,
            },
            data: {
              isActive: false,
            },
          });
        }

        const persistedSession = await tx.session.update({
          where: { id: currentSession.id },
          data: {
            accessToken,
            refreshToken,
            accessExpiresAt,
            refreshExpiresAt,
            revokedAt: null,
            lastUsedAt: issuedAt,
            lastUsedIpAddress: normalizedMetadata.ipAddress,
            lastUsedUserAgent: normalizedMetadata.userAgent,
          },
          select: {
            id: true,
            accessToken: true,
            refreshToken: true,
            accessExpiresAt: true,
            refreshExpiresAt: true,
          },
        });

        return {
          persistedSession,
          revokedSessionIds,
        };
      });

    this.disconnectRealtimeSessions(revokedSessionIds, 'session_replaced');

    return {
      session: persistedSession,
      context,
    };
  }

  private async buildSessionContext(
    userId: string,
  ): Promise<AuthSessionContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw notFoundError('User not found');
    }

    const shops = await this.shopsService.listUserShops(userId);
    const platform = await this.buildPlatformAccess(userId);
    const jwtPlatform: JwtPlatformAccess | null = platform
      ? {
          role: platform.role,
          roles: platform.roles.map((role) => role.code),
          permissions: platform.permissions.map((permission) =>
            String(permission),
          ),
        }
      : null;
    const jwtShops: JwtShopAccess[] = shops.map((shop) => ({
      shop_id: shop.id,
      role: shop.membership.role,
      roles: shop.membership.roles.map((role) => role.code),
      permissions: shop.membership.permissions.map((permission) =>
        String(permission),
      ),
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        locale: user.locale,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      },
      platform,
      shops,
      jwtPlatform,
      jwtShops,
    };
  }

  private buildAuthResponse(input: {
    session: SessionRecord;
    context: AuthSessionContext;
  }) {
    return {
      token: input.session.accessToken,
      access_token: input.session.accessToken,
      refresh_token: input.session.refreshToken,
      token_type: 'Bearer',
      expires_at: input.session.accessExpiresAt.toISOString(),
      refresh_expires_at: input.session.refreshExpiresAt.toISOString(),
      user: {
        id: input.context.user.id,
        name: input.context.user.name,
        email: input.context.user.email,
        phone: input.context.user.phone,
        locale: input.context.user.locale,
        email_verified_at: input.context.user.emailVerifiedAt,
        platform: input.context.jwtPlatform,
        shops: input.context.jwtShops,
      },
      platform_access: input.context.platform,
      shops: input.context.shops,
    };
  }

  private async buildPlatformAccess(userId: string) {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        role: {
          scope: 'platform',
        },
      },
      include: {
        role: {
          include: {
            permissionAssignments: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (assignments.length === 0) {
      return null;
    }

    const roles = assignments
      .map((assignment) => assignment.role)
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
      }));

    const permissions = [
      ...new Set(
        assignments.flatMap((assignment) =>
          assignment.role.permissionAssignments.map(
            (permissionAssignment) => permissionAssignment.permission.code,
          ),
        ),
      ),
    ].sort();

    return {
      role: roles[0]?.code ?? null,
      roles,
      permissions,
    };
  }

  private async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: jwtConfig.accessSecret,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
        },
      );
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw unauthorizedError('Access token is invalid or expired');
    }
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: jwtConfig.refreshSecret,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience,
        },
      );
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw unauthorizedError('Refresh token is invalid or expired');
    }
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

  private async sendPostRegistrationEmails(
    user: User,
    metadata: SessionRequestMetadata,
  ) {
    if (!user.email) {
      return;
    }

    await this.emailOutbox.queueAndSendTemplatedEmail({
      userId: user.id,
      toEmail: user.email,
      recipientName: user.name,
      templateKey: 'auth.welcome',
      variables: {
        recipientName: user.name,
        ctaLabel: 'Open dashboard',
        ctaUrl: `${this.getWebAppBaseUrl()}/dashboard`,
      },
    });

    if (!user.emailVerifiedAt) {
      await this.enqueueEmailVerification(user, metadata);
    }
  }

  private async enqueueEmailVerification(
    user: User,
    metadata: SessionRequestMetadata,
  ) {
    if (!user.email) {
      return null;
    }

    const issuedToken = await this.issueEmailActionToken(
      user,
      'verify_email',
      EMAIL_VERIFICATION_TTL_MS,
      metadata,
    );

    return this.emailOutbox.queueAndSendTemplatedEmail({
      userId: user.id,
      toEmail: user.email,
      recipientName: user.name,
      templateKey: 'auth.verify_email',
      variables: {
        ctaLabel: 'Verify email',
        ctaUrl: `${this.getWebAppBaseUrl()}/verify-email?token=${encodeURIComponent(
          issuedToken.rawToken,
        )}`,
        expiryText: `This verification link expires in ${this.describeDuration(
          EMAIL_VERIFICATION_TTL_MS,
        )}.`,
      },
      metadata: {
        purpose: 'verify_email',
      },
    });
  }

  private async enqueuePasswordResetEmail(
    user: User,
    metadata: SessionRequestMetadata,
  ) {
    if (!user.email) {
      return null;
    }

    const issuedToken = await this.issueEmailActionToken(
      user,
      'reset_password',
      PASSWORD_RESET_TTL_MS,
      metadata,
    );

    return this.emailOutbox.queueAndSendTemplatedEmail({
      userId: user.id,
      toEmail: user.email,
      recipientName: user.name,
      templateKey: 'auth.forgot_password',
      variables: {
        ctaLabel: 'Reset password',
        ctaUrl: `${this.getWebAppBaseUrl()}/reset-password?token=${encodeURIComponent(
          issuedToken.rawToken,
        )}`,
        expiryText: `This password reset link expires in ${this.describeDuration(
          PASSWORD_RESET_TTL_MS,
        )}.`,
      },
      metadata: {
        purpose: 'reset_password',
      },
    });
  }

  private async issueEmailActionToken(
    user: User,
    purpose: 'verify_email' | 'reset_password',
    ttlMs: number,
    metadata: SessionRequestMetadata,
  ) {
    if (!user.email) {
      throw conflictError('An email address is required for this action');
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashEmailActionToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlMs);
    const normalizedMetadata = this.normalizeSessionMetadata(metadata);

    const token = await this.prisma.$transaction(async (tx) => {
      await tx.emailActionToken.updateMany({
        where: {
          userId: user.id,
          email: user.email!,
          purpose,
          consumedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return tx.emailActionToken.create({
        data: {
          userId: user.id,
          email: user.email!,
          purpose,
          tokenHash,
          expiresAt,
          requestedIpAddress: normalizedMetadata.ipAddress,
          requestedUserAgent: normalizedMetadata.userAgent,
        },
      });
    });

    return {
      rawToken,
      record: token,
    };
  }

  private async resolveEmailActionToken(
    rawToken: string,
    purpose: 'verify_email' | 'reset_password',
  ) {
    const tokenHash = this.hashEmailActionToken(rawToken);
    const actionToken = await this.prisma.emailActionToken.findUnique({
      where: { tokenHash },
    });

    if (
      !actionToken ||
      actionToken.purpose !== purpose ||
      actionToken.consumedAt ||
      actionToken.revokedAt ||
      actionToken.expiresAt.getTime() < Date.now()
    ) {
      throw unauthorizedError(
        purpose === 'verify_email'
          ? 'Email verification token is invalid or expired'
          : 'Password reset token is invalid or expired',
      );
    }

    return actionToken;
  }

  private hashEmailActionToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private getWebAppBaseUrl() {
    return (
      process.env.WEB_APP_BASE_URL?.trim() ||
      process.env.APP_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private describeDuration(valueMs: number) {
    const minutes = Math.floor(valueMs / 60_000);
    if (minutes % (24 * 60) === 0) {
      const days = minutes / (24 * 60);
      return `${days} day${days === 1 ? '' : 's'}`;
    }

    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  private normalizePhone(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeSessionMetadata(
    metadata: SessionRequestMetadata,
  ): SessionRequestMetadata {
    return {
      ipAddress: this.normalizeMetadataValue(metadata.ipAddress, 64),
      userAgent: this.normalizeMetadataValue(metadata.userAgent, 1024),
    };
  }

  private disconnectRealtimeSessions(sessionIds: string[], reason: string) {
    if (sessionIds.length === 0) {
      return;
    }

    this.realtimeService.disconnectSessions(sessionIds, reason);
  }

  private normalizeMetadataValue(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    return normalized.slice(0, maxLength);
  }
}
