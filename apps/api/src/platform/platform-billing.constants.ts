import { subscriptionFeatures } from './subscription-feature.constants';

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
        code: subscriptionFeatures.shopWorkspace,
        label: 'One shop workspace during onboarding',
        description: 'Access the owner workspace for the trial shop.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        code: subscriptionFeatures.ordersManagement,
        label: 'Order management',
        description: 'Create and manage orders during the trial period.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        code: subscriptionFeatures.ordersParseMessenger,
        label: 'Manual and paste-from-Messenger order capture',
        description:
          'Create structured orders from copied chat messages or manual entry.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description: 'Manage customer records inside the same workspace.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description: 'Track delivery records and fulfilment progress.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description:
          'Use reusable message templates for follow-up and reminders.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Reports and summaries',
        description:
          'Use daily, weekly, and monthly reporting during evaluation.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Staff accounts with role-based access',
        description:
          'Owners can invite staff and assign shop roles during the trial.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description:
          'Export is held back until the shop moves onto a paid plan.',
        availabilityStatus: 'unavailable',
        sortOrder: 20,
      },
      {
        code: subscriptionFeatures.billingAnnualDiscount,
        label: 'Discounted annual billing',
        description:
          'Annual billing is only available on the yearly paid plan.',
        availabilityStatus: 'unavailable',
        sortOrder: 21,
      },
      {
        code: subscriptionFeatures.facebookCommentsIntegration,
        label: 'Facebook comments integration',
        description:
          'Direct Facebook comment capture is planned for a future release.',
        availabilityStatus: 'unavailable',
        sortOrder: 30,
      },
      {
        code: subscriptionFeatures.facebookInboxIntegration,
        label: 'Facebook inbox integration',
        description: 'Direct inbox sync is planned for a future release.',
        availabilityStatus: 'unavailable',
        sortOrder: 31,
      },
      {
        code: subscriptionFeatures.automationAutoReply,
        label: 'Auto reply automation',
        description: 'Automation flows are reserved for future higher plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 32,
      },
      {
        code: subscriptionFeatures.analyticsAdvanced,
        label: 'Advanced analytics',
        description: 'Deeper analytics will arrive in later plan tiers.',
        availabilityStatus: 'unavailable',
        sortOrder: 33,
      },
      {
        code: subscriptionFeatures.integrationsDeliveryApi,
        label: 'Delivery API integrations',
        description: 'Delivery provider APIs are planned beyond phase one.',
        availabilityStatus: 'unavailable',
        sortOrder: 34,
      },
      {
        code: subscriptionFeatures.multiShopManagement,
        label: 'Multi-shop management',
        description:
          'Agency-style multi-shop controls are reserved for later plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 35,
      },
    ],
  },
  {
    code: 'pro_monthly',
    name: 'Shop Monthly',
    description:
      'Single-shop monthly plan for daily Facebook order operations.',
    price: 8000,
    currency: 'MMK',
    billingPeriod: 'monthly',
    isActive: true,
    sortOrder: 1,
    items: [
      {
        code: subscriptionFeatures.shopWorkspace,
        label: 'One paid subscription for one shop',
        description: 'Each shop keeps its own billing state and renewal cycle.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        code: subscriptionFeatures.ordersManagement,
        label: 'Order management',
        description: 'Create, update, and complete day-to-day orders.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        code: subscriptionFeatures.ordersParseMessenger,
        label: 'Manual and paste-from-Messenger order capture',
        description: 'Turn copied Messenger chats into structured orders.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description:
          'Keep customer records, phones, notes, and addresses organized.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description: 'Track delivery assignments and dispatch state.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description: 'Save reusable replies and follow-up templates.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Daily, weekly, and monthly reporting',
        description: 'Monitor orders, revenue, and delivery performance.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Staff accounts with roles and permissions',
        description: 'Invite staff members and control access per shop.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description:
          'Export orders, customers, deliveries, and operational records.',
        availabilityStatus: 'available',
        sortOrder: 8,
      },
      {
        code: subscriptionFeatures.billingAnnualDiscount,
        label: 'Annual discount',
        description: 'Use the yearly plan when you want the lower annual rate.',
        availabilityStatus: 'unavailable',
        sortOrder: 20,
      },
      {
        code: subscriptionFeatures.facebookCommentsIntegration,
        label: 'Facebook comments integration',
        description:
          'Direct Facebook comment capture is planned beyond phase one.',
        availabilityStatus: 'unavailable',
        sortOrder: 30,
      },
      {
        code: subscriptionFeatures.facebookInboxIntegration,
        label: 'Facebook inbox integration',
        description: 'Direct inbox sync is planned beyond phase one.',
        availabilityStatus: 'unavailable',
        sortOrder: 31,
      },
      {
        code: subscriptionFeatures.automationAutoReply,
        label: 'Auto reply automation',
        description: 'Automation flows are part of future higher tiers.',
        availabilityStatus: 'unavailable',
        sortOrder: 32,
      },
      {
        code: subscriptionFeatures.analyticsAdvanced,
        label: 'Advanced analytics',
        description: 'Advanced analytics stay reserved for future plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 33,
      },
      {
        code: subscriptionFeatures.integrationsDeliveryApi,
        label: 'Delivery API integrations',
        description: 'Delivery provider APIs are planned for later phases.',
        availabilityStatus: 'unavailable',
        sortOrder: 34,
      },
      {
        code: subscriptionFeatures.multiShopManagement,
        label: 'Multi-shop management',
        description:
          'Enterprise-style multi-shop controls are not in this plan.',
        availabilityStatus: 'unavailable',
        sortOrder: 35,
      },
      {
        code: subscriptionFeatures.integrationsApiAccess,
        label: 'API access',
        description: 'Public API access is reserved for future higher plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 36,
      },
      {
        code: subscriptionFeatures.supportPriority,
        label: 'Priority support',
        description:
          'Priority support belongs to future enterprise-oriented plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 37,
      },
    ],
  },
  {
    code: 'pro_yearly',
    name: 'Shop Yearly',
    description:
      'Discounted yearly plan for shops running the workflow every day.',
    price: 80000,
    currency: 'MMK',
    billingPeriod: 'yearly',
    isActive: true,
    sortOrder: 2,
    items: [
      {
        code: subscriptionFeatures.shopWorkspace,
        label: 'One paid subscription for one shop',
        description: 'Billing is tracked per shop, not per owner account.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        code: subscriptionFeatures.ordersManagement,
        label: 'Order management',
        description: 'Keep daily order operations active throughout the year.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        code: subscriptionFeatures.ordersParseMessenger,
        label: 'Manual and paste-from-Messenger order capture',
        description:
          'Capture Messenger-driven demand without waiting for direct integrations.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description: 'Keep customer records organized for long-running shops.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description:
          'Manage dispatch and delivery workflows inside the same workspace.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description: 'Save reusable customer communication templates.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Daily, weekly, and monthly reporting',
        description: 'Includes the full launch workflow for operational teams.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Staff accounts with roles and permissions',
        description:
          'Owners can manage team access inside the same shop workspace.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description:
          'Export operational records for backup and external reporting.',
        availabilityStatus: 'available',
        sortOrder: 8,
      },
      {
        code: subscriptionFeatures.billingAnnualDiscount,
        label: 'Discounted annual billing',
        description:
          'Annual billing lowers the total cost compared with paying monthly for a year.',
        availabilityStatus: 'available',
        sortOrder: 9,
      },
      {
        code: subscriptionFeatures.facebookCommentsIntegration,
        label: 'Facebook comments integration',
        description:
          'Direct Facebook comment capture is planned beyond phase one.',
        availabilityStatus: 'unavailable',
        sortOrder: 30,
      },
      {
        code: subscriptionFeatures.facebookInboxIntegration,
        label: 'Facebook inbox integration',
        description: 'Direct inbox sync is planned beyond phase one.',
        availabilityStatus: 'unavailable',
        sortOrder: 31,
      },
      {
        code: subscriptionFeatures.automationAutoReply,
        label: 'Auto reply automation',
        description: 'Automation flows are part of future higher tiers.',
        availabilityStatus: 'unavailable',
        sortOrder: 32,
      },
      {
        code: subscriptionFeatures.analyticsAdvanced,
        label: 'Advanced analytics',
        description: 'Advanced analytics stay reserved for future plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 33,
      },
      {
        code: subscriptionFeatures.integrationsDeliveryApi,
        label: 'Delivery API integrations',
        description: 'Delivery provider APIs are planned for later phases.',
        availabilityStatus: 'unavailable',
        sortOrder: 34,
      },
      {
        code: subscriptionFeatures.multiShopManagement,
        label: 'Multi-shop management',
        description:
          'Enterprise-style multi-shop controls are not in this plan yet.',
        availabilityStatus: 'unavailable',
        sortOrder: 35,
      },
      {
        code: subscriptionFeatures.integrationsApiAccess,
        label: 'API access',
        description: 'Public API access is reserved for future higher plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 36,
      },
      {
        code: subscriptionFeatures.supportPriority,
        label: 'Priority support',
        description:
          'Priority support belongs to future enterprise-oriented plans.',
        availabilityStatus: 'unavailable',
        sortOrder: 37,
      },
    ],
  },
] as const;

export type DefaultPlanCode = (typeof defaultPlanCatalog)[number]['code'];
