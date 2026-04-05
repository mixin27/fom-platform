import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import { notFoundError } from '../common/http/app-http.exception';
import { assertValid, optionalString } from '../common/utils/validation';
import { AuthService } from '../auth/auth.service';
import { InMemoryStoreService } from '../store/in-memory-store.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly store: InMemoryStoreService,
    private readonly authService: AuthService,
  ) {}

  getCurrentUser(currentUser: AuthenticatedUser) {
    return {
      ...this.authService.serializeUser(currentUser.id),
      shops: this.store.shopMembers
        .filter(
          (member) =>
            member.userId === currentUser.id && member.status === 'active',
        )
        .map((member) => member.shopId),
    };
  }

  updateCurrentUser(
    currentUser: AuthenticatedUser,
    body: Record<string, unknown>,
  ) {
    const user = this.store.findUserById(currentUser.id);
    if (!user) {
      throw notFoundError('User not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = optionalString(body.name, 'name', errors, 'name');
    const locale = optionalString(body.locale, 'locale', errors, 'locale');
    assertValid(errors);

    if (name) {
      user.name = name;
    }

    if (locale === 'en' || locale === 'my') {
      user.locale = locale;
    }

    return this.authService.serializeUser(user.id);
  }
}
