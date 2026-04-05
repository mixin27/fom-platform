import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  notFoundError,
} from '../common/http/app-http.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { assertValid, optionalString } from '../common/utils/validation';
import { AuthService } from '../auth/auth.service';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly shopsService: ShopsService,
  ) {}

  async getCurrentUser(currentUser: AuthenticatedUser) {
    return {
      ...(await this.authService.serializeUser(currentUser.id)),
      shops: await this.shopsService.listUserShops(currentUser.id),
    };
  }

  async updateCurrentUser(
    currentUser: AuthenticatedUser,
    body: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw notFoundError('User not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = optionalString(body.name, 'name', errors, 'name');
    const locale = optionalString(body.locale, 'locale', errors, 'locale');
    const email = optionalString(body.email, 'email', errors, 'email');
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    assertValid(errors);

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.replace(/\s+/g, ' ').trim();

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        throw conflictError('Email is already registered');
      }
    }

    if (normalizedPhone && normalizedPhone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (existingPhone) {
        throw conflictError('Phone number is already registered');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name } : {}),
        ...(locale === 'en' || locale === 'my' ? { locale } : {}),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      },
    });

    return this.authService.serializeUser(user.id);
  }
}
