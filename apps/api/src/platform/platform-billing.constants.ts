export const DEFAULT_TRIAL_PLAN_CODE = 'trial';

export const defaultPlanCatalog = [
  {
    code: 'trial',
    name: 'Free Trial',
    description: 'Auto-enrolled starter access for newly registered shops.',
    price: 0,
    currency: 'MMK',
    billingPeriod: 'trial',
    isActive: true,
    sortOrder: 0,
  },
  {
    code: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'Recurring monthly subscription for active shops.',
    price: 5000,
    currency: 'MMK',
    billingPeriod: 'monthly',
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'pro_yearly',
    name: 'Pro Yearly',
    description: 'Discounted annual contract for established shops.',
    price: 50000,
    currency: 'MMK',
    billingPeriod: 'yearly',
    isActive: true,
    sortOrder: 2,
  },
] as const;

export type DefaultPlanCode = (typeof defaultPlanCatalog)[number]['code'];
