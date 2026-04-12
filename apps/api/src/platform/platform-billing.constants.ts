export const DEFAULT_TRIAL_PLAN_CODE = 'trial';

export const platformSubscriptionStatuses = [
  'trialing',
  'active',
  'overdue',
  'expired',
  'cancelled',
  'inactive',
] as const;

export const platformInvoiceStatuses = [
  'pending',
  'paid',
  'overdue',
  'failed',
] as const;

export const defaultPlanCatalog = [
  {
    code: 'trial',
    name: 'Free Trial',
    description: 'Seven-day onboarding period for a newly registered shop.',
    price: 0,
    currency: 'MMK',
    billingPeriod: 'trial',
    isActive: true,
    sortOrder: 0,
    items: [
      {
        label: '7-day full access for one shop workspace',
        description: 'Start the first shop without entering billing details.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        label: 'Manual and paste-from-Messenger order capture',
        description: 'Create structured orders from copied chat messages or manual entry.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        label: 'Customers, deliveries, templates, and reporting',
        description: 'Use the full phase-one workflow before switching to paid billing.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        label: 'Staff accounts with role-based access',
        description: 'Owners can invite staff and assign shop roles during the trial.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        label: 'Continuous access after the trial window',
        description: 'Move to a paid subscription to keep the shop active after day 7.',
        availabilityStatus: 'unavailable',
        sortOrder: 10,
      },
      {
        label: 'Discounted annual billing',
        description: 'Annual billing is only available on the yearly paid plan.',
        availabilityStatus: 'unavailable',
        sortOrder: 11,
      },
    ],
  },
  {
    code: 'pro_monthly',
    name: 'Shop Monthly',
    description: 'Single-shop monthly plan for daily Facebook order operations.',
    price: 7000,
    currency: 'MMK',
    billingPeriod: 'monthly',
    isActive: true,
    sortOrder: 1,
    items: [
      {
        label: 'One paid subscription for one shop',
        description: 'Each shop keeps its own billing state and renewal cycle.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        label: 'Unlimited orders in the current phase-one workflow',
        description: 'Keep processing orders without a monthly order cap.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        label: 'Manual and paste-from-Messenger order capture',
        description: 'Turn copied Messenger chats into structured orders.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        label: 'Customers, deliveries, templates, and daily reports',
        description: 'Run the full owner workflow from one app and dashboard.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        label: 'Staff accounts with roles and permissions',
        description: 'Invite staff members and control access per shop.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        label: 'Annual discount',
        description: 'Use the yearly plan when you want the lower annual rate.',
        availabilityStatus: 'unavailable',
        sortOrder: 10,
      },
    ],
  },
  {
    code: 'pro_yearly',
    name: 'Shop Yearly',
    description: 'Discounted yearly plan for shops running the workflow every day.',
    price: 70000,
    currency: 'MMK',
    billingPeriod: 'yearly',
    isActive: true,
    sortOrder: 2,
    items: [
      {
        label: 'One paid subscription for one shop',
        description: 'Billing is tracked per shop, not per owner account.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        label: 'Unlimited orders in the current phase-one workflow',
        description: 'Keep order operations active throughout the year.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        label: 'Manual and paste-from-Messenger order capture',
        description: 'Capture Messenger-driven demand without waiting for direct integrations.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        label: 'Customers, deliveries, templates, and daily reports',
        description: 'Includes the full launch workflow for operational teams.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        label: 'Staff accounts with roles and permissions',
        description: 'Owners can manage team access inside the same shop workspace.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        label: 'Discounted annual billing',
        description: 'Annual billing lowers the total cost compared with paying monthly for a year.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
    ],
  },
] as const;

export type DefaultPlanCode = (typeof defaultPlanCatalog)[number]['code'];
