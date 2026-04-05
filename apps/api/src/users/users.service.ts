import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import { notFoundError } from '../common/http/app-http.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { assertValid, optionalString } from '../common/utils/validation';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getCurrentUser(currentUser: AuthenticatedUser) {
    const memberships = await this.prisma.shopMember.findMany({
      where: {
        userId: currentUser.id,
        status: 'active',
      },
      select: { shopId: true },
    });

    return {
      ...(await this.authService.serializeUser(currentUser.id)),
      shops: memberships.map((member) => member.shopId),
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
    assertValid(errors);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name } : {}),
        ...(locale === 'en' || locale === 'my' ? { locale } : {}),
      },
    });

    return this.authService.serializeUser(user.id);
  }
}
