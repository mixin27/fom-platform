import { SetMetadata } from '@nestjs/common';
import type { SubscriptionFeatureCode } from '../../platform/subscription-feature.constants';

export const PLAN_FEATURES_KEY = 'plan_features';

export const RequirePlanFeatures = (
  ...features: SubscriptionFeatureCode[]
) => SetMetadata(PLAN_FEATURES_KEY, features);
