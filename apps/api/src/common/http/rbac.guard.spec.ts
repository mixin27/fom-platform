import { Reflector } from '@nestjs/core';
import { permissions } from './rbac.constants';
import { RbacGuard } from './rbac.guard';

describe('RbacGuard', () => {
  function createExecutionContext(request: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    } as any;
  }

  it('uses platform permissions even when a platform route contains shopId', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([permissions.platformShopsWrite]),
    } as unknown as Reflector;
    const shopsService = {
      assertPermission: jest.fn(),
    } as any;
    const guard = new RbacGuard(reflector, shopsService);

    const result = await guard.canActivate(
      createExecutionContext({
        params: { shopId: 'shop_123' },
        user: {
          id: 'user_123',
          platform: {
            permissions: [permissions.platformShopsWrite],
          },
        },
      }),
    );

    expect(result).toBe(true);
    expect(shopsService.assertPermission).not.toHaveBeenCalled();
  });

  it('uses shop membership permissions for shop-scoped routes', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([permissions.ordersWrite]),
    } as unknown as Reflector;
    const shopsService = {
      assertPermission: jest.fn().mockResolvedValue(undefined),
    } as any;
    const guard = new RbacGuard(reflector, shopsService);

    const result = await guard.canActivate(
      createExecutionContext({
        params: { shopId: 'shop_123' },
        user: {
          id: 'user_123',
          platform: {
            permissions: [permissions.platformShopsWrite],
          },
        },
      }),
    );

    expect(result).toBe(true);
    expect(shopsService.assertPermission).toHaveBeenCalledWith(
      'user_123',
      'shop_123',
      [permissions.ordersWrite],
    );
  });
});
