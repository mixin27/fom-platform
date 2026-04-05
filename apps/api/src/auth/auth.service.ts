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
import { InMemoryStoreService } from '../store/in-memory-store.service';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly store: InMemoryStoreService,
    private readonly shopsService: ShopsService,
  ) {}

  startPhoneChallenge(body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const phone = requiredString(body.phone, 'phone', errors, 'phone number');
    assertValid(errors);

    const challenge = this.store.createAuthChallenge(phone);
    return {
      challenge_id: challenge.id,
      expires_at: challenge.expiresAt,
      debug_otp_code: challenge.otpCode,
    };
  }

  verifyPhoneChallenge(body: Record<string, unknown>) {
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

    const challenge = this.store.findChallengeById(challengeId);
    if (!challenge || challenge.expiresAt < this.store.now()) {
      throw unauthorizedError('OTP challenge is invalid or expired');
    }

    if (challenge.otpCode !== otpCode) {
      throw unauthorizedError('OTP code is invalid');
    }

    let user = this.store.findUserByPhone(challenge.phone);
    if (!user) {
      user = this.store.createUser({
        name: name ?? `Seller ${challenge.phone.slice(-4)}`,
        phone: challenge.phone,
        locale: locale === 'en' ? 'en' : 'my',
      });
    } else if (name) {
      user.name = name;
      user.locale = locale === 'en' ? 'en' : 'my';
    }

    const session = this.store.createSession(user.id);
    return {
      token: session.token,
      user: this.serializeUser(user.id),
      shops: this.shopsService.listUserShops(user.id),
    };
  }

  logout(token: string): void {
    this.store.revokeSession(token);
  }

  authenticate(token: string): AuthenticatedUser {
    const session = this.store.findSessionByToken(token);
    if (!session) {
      throw unauthorizedError();
    }

    const user = this.store.findUserById(session.userId);
    if (!user) {
      throw unauthorizedError();
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      locale: user.locale,
    };
  }

  serializeUser(userId: string) {
    const user = this.store.findUserById(userId);
    if (!user) {
      throw notFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      locale: user.locale,
      created_at: user.createdAt,
    };
  }
}
