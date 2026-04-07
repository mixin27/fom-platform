import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbiddenError } from './app-http.exception';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { Permission } from './rbac.constants';
import type { RequestWithContext } from './request-context';
import { ShopsService } from '../../shops/shops.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly shopsService: ShopsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      RequestWithContext & {
        params?: Record<string, string | undefined>;
      }
    >();
    const currentUser = request.user;
    const shopId = request.params?.shopId;

    if (!currentUser) {
      throw forbiddenError('Authentication context is missing');
    }

    if (!shopId) {
      const currentPermissions = currentUser.platform?.permissions ?? [];
      const missingPermissions = requiredPermissions.filter(
        (permission) => !currentPermissions.includes(permission),
      );

      if (missingPermissions.length > 0) {
        throw forbiddenError(
          'You do not have platform permission to perform this action',
        );
      }

      return true;
    }

    await this.shopsService.assertPermission(
      currentUser.id,
      shopId,
      requiredPermissions,
    );

    return true;
  }
}
