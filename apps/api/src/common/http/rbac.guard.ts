import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbiddenError, notFoundError } from './app-http.exception';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { permissionsForRole, type Permission } from './rbac.constants';
import type { RequestWithContext } from './request-context';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
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
      throw notFoundError('Shop context is missing for RBAC evaluation');
    }

    const membership = await this.prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId: currentUser.id,
        },
      },
    });
    if (!membership || membership.status !== 'active') {
      throw forbiddenError();
    }

    const grantedPermissions = new Set(permissionsForRole(membership.role));
    const missing = requiredPermissions.filter(
      (permission) => !grantedPermissions.has(permission),
    );
    if (missing.length > 0) {
      throw forbiddenError('You do not have permission to perform this action');
    }

    return true;
  }
}
