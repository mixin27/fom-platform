import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbiddenError } from './app-http.exception';
import { PLAN_FEATURES_KEY } from './plan-features.decorator';
import type { RequestWithContext } from './request-context';
import { ShopsService } from '../../shops/shops.service';
import type { SubscriptionFeatureCode } from '../../platform/subscription-feature.constants';

@Injectable()
export class SubscriptionFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly shopsService: ShopsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndMerge<
      SubscriptionFeatureCode[]
    >(PLAN_FEATURES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredFeatures || requiredFeatures.length === 0) {
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
      throw forbiddenError('Shop context is required for this action');
    }

    await this.shopsService.assertPlanFeatures(
      currentUser.id,
      shopId,
      requiredFeatures,
    );

    return true;
  }
}
