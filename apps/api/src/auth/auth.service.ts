import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  notFoundError,
  unauthorizedError,
} from '../common/http/app-http.exception';
import {
  assertValid,
  optionalString,
  requiredString,
} from '../common/utils/validation';
import { PrismaService } from '../common/prisma/prisma.service';
import { generateId } from '../common/utils/id';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async startPhoneChallenge(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const phone = requiredString(body.phone, 'phone', errors, 'phone number');
    assertValid(errors);

    const challenge = await this.prisma.authChallenge.create({
      data: {
        id: generateId('chl'),
        phone,
        otpCode: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return {
      challenge_id: challenge.id,
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
    const locale =
      optionalString(body.locale, 'locale', errors, 'locale') ?? 'my';
    assertValid(errors);

    const challenge = await this.prisma.authChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge || challenge.expiresAt < new Date()) {
      throw unauthorizedError('OTP challenge is invalid or expired');
    }

    if (challenge.otpCode !== otpCode) {
      throw unauthorizedError('OTP code is invalid');
    }

    let user = await this.prisma.user.findUnique({
      where: { phone: challenge.phone },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: generateId('usr'),
          name: name ?? `Seller ${challenge.phone.slice(-4)}`,
          phone: challenge.phone,
          locale: locale === 'en' ? 'en' : 'my',
        },
      });
    } else if (name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          locale: locale === 'en' ? 'en' : 'my',
        },
      });
    }

    const session = await this.prisma.session.create({
      data: {
        token: generateId('tok'),
        userId: user.id,
      },
    });
    await this.prisma.authChallenge.deleteMany({
      where: { id: challenge.id },
    });

    return {
      token: session.token,
      user: await this.serializeUser(user.id),
      shops: await this.shopsService.listUserShops(user.id),
    };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { token },
    });
  }

  async authenticate(token: string): Promise<AuthenticatedUser> {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) {
      throw unauthorizedError();
    }

    return {
      id: session.user.id,
      name: session.user.name,
      phone: session.user.phone,
      locale: session.user.locale,
    };
  }

  async serializeUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw notFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      locale: user.locale,
      created_at: user.createdAt.toISOString(),
    };
  }
}
