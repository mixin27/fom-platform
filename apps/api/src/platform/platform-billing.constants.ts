import { subscriptionFeatures } from './subscription-feature.constants';
import { subscriptionLimits } from './subscription-limit.constants';

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
        code: subscriptionFeatures.ordersImportSpreadsheet,
        label: 'Spreadsheet order import',
        description:
          'Historical order import is held back until the shop moves onto a paid plan.',
        availabilityStatus: 'unavailable',
        sortOrder: 8,
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
        label: 'Owner-only onboarding access',
        description:
          'Trial shops stay owner-only until the shop upgrades to a paid plan.',
        availabilityStatus: 'unavailable',
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
    limits: [
      {
        code: subscriptionLimits.activeStaffMembers,
        label: 'Active staff seats',
        description:
          'Trial shops stay owner-only and cannot activate additional staff accounts.',
        value: 0,
        sortOrder: 0,
      },
    ],
  },
  {
    code: 'pro_monthly',
    name: 'Shop Monthly',
    description:
      'Single-shop monthly plan for daily Facebook order operations.',
    price: 15000,
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
        code: subscriptionFeatures.ordersImportSpreadsheet,
        label: 'Spreadsheet order import',
        description:
          'Import historical orders from Excel or CSV migration files.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description:
          'Keep customer records, phones, notes, and addresses organized.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description: 'Track delivery assignments and dispatch state.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description: 'Save reusable replies and follow-up templates.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Daily, weekly, and monthly reporting',
        description: 'Monitor orders, revenue, and delivery performance.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Up to 3 active staff seats with roles and permissions',
        description:
          'Add up to 3 non-owner active staff accounts per paid shop.',
        availabilityStatus: 'available',
        sortOrder: 8,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description:
          'Export orders, customers, deliveries, and operational records.',
        availabilityStatus: 'available',
        sortOrder: 9,
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
    limits: [
      {
        code: subscriptionLimits.activeStaffMembers,
        label: 'Active staff seats',
        description:
          'Maximum number of non-owner active staff accounts allowed on the monthly plan.',
        value: 3,
        sortOrder: 0,
      },
    ],
  },
  {
    code: 'pro_yearly',
    name: 'Shop Yearly',
    description:
      'Discounted yearly plan for shops running the workflow every day.',
    price: 150000,
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
        code: subscriptionFeatures.ordersImportSpreadsheet,
        label: 'Spreadsheet order import',
        description:
          'Import historical orders from Excel or CSV migration files.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description: 'Keep customer records organized for long-running shops.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description:
          'Manage dispatch and delivery workflows inside the same workspace.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description: 'Save reusable customer communication templates.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Daily, weekly, and monthly reporting',
        description: 'Includes the full launch workflow for operational teams.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Up to 3 active staff seats with roles and permissions',
        description:
          'Add up to 3 non-owner active staff accounts per paid shop.',
        availabilityStatus: 'available',
        sortOrder: 8,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description:
          'Export operational records for backup and external reporting.',
        availabilityStatus: 'available',
        sortOrder: 9,
      },
      {
        code: subscriptionFeatures.billingAnnualDiscount,
        label: 'Discounted annual billing',
        description:
          'Annual billing lowers the total cost compared with paying monthly for a year.',
        availabilityStatus: 'available',
        sortOrder: 10,
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
    limits: [
      {
        code: subscriptionLimits.activeStaffMembers,
        label: 'Active staff seats',
        description:
          'Maximum number of non-owner active staff accounts allowed on the yearly plan.',
        value: 3,
        sortOrder: 0,
      },
    ],
  },
  {
    code: 'enterprise',
    name: 'Enterprise / Custom',
    description:
      'Enterprise tier for multi-shop management, advanced analytics, and priority support.',
    price: 0,
    currency: 'MMK',
    billingPeriod: 'enterprise',
    isActive: true,
    sortOrder: 3,
    items: [
      {
        code: subscriptionFeatures.shopWorkspace,
        label: 'One subscription still belongs to one shop',
        description:
          'Each enterprise-managed shop keeps its own subscription and renewal state.',
        availabilityStatus: 'available',
        sortOrder: 0,
      },
      {
        code: subscriptionFeatures.ordersManagement,
        label: 'Order management',
        description: 'Full operational order management across enterprise shops.',
        availabilityStatus: 'available',
        sortOrder: 1,
      },
      {
        code: subscriptionFeatures.ordersParseMessenger,
        label: 'Manual and paste-from-Messenger order capture',
        description:
          'Continue Messenger-driven intake without waiting for native sync.',
        availabilityStatus: 'available',
        sortOrder: 2,
      },
      {
        code: subscriptionFeatures.ordersImportSpreadsheet,
        label: 'Spreadsheet order import',
        description: 'Import historical or migration order data.',
        availabilityStatus: 'available',
        sortOrder: 3,
      },
      {
        code: subscriptionFeatures.customersManagement,
        label: 'Customer management',
        description: 'Maintain customer records across managed shops.',
        availabilityStatus: 'available',
        sortOrder: 4,
      },
      {
        code: subscriptionFeatures.deliveriesManagement,
        label: 'Delivery management',
        description: 'Keep delivery workflows available at shop level.',
        availabilityStatus: 'available',
        sortOrder: 5,
      },
      {
        code: subscriptionFeatures.templatesManagement,
        label: 'Message templates',
        description: 'Use reusable message templates across teams.',
        availabilityStatus: 'available',
        sortOrder: 6,
      },
      {
        code: subscriptionFeatures.reportsAnalytics,
        label: 'Operational reports',
        description: 'Includes daily, weekly, and monthly reporting.',
        availabilityStatus: 'available',
        sortOrder: 7,
      },
      {
        code: subscriptionFeatures.teamMembers,
        label: 'Expanded team access',
        description:
          'Supports larger staff teams with custom roles and governance.',
        availabilityStatus: 'available',
        sortOrder: 8,
      },
      {
        code: subscriptionFeatures.csvExports,
        label: 'CSV exports',
        description: 'Export operational and reporting data.',
        availabilityStatus: 'available',
        sortOrder: 9,
      },
      {
        code: subscriptionFeatures.analyticsAdvanced,
        label: 'Advanced analytics',
        description:
          'Unlock deeper operational analytics across enterprise-managed shops.',
        availabilityStatus: 'available',
        sortOrder: 20,
      },
      {
        code: subscriptionFeatures.multiShopManagement,
        label: 'Enterprise multi-shop workspace',
        description:
          'Aggregate eligible shops into one enterprise workspace.',
        availabilityStatus: 'available',
        sortOrder: 21,
      },
      {
        code: subscriptionFeatures.supportPriority,
        label: 'Priority support',
        description:
          'Enables enterprise-priority support and onboarding workflows.',
        availabilityStatus: 'available',
        sortOrder: 22,
      },
      {
        code: subscriptionFeatures.facebookCommentsIntegration,
        label: 'Facebook comments integration',
        description:
          'Direct Facebook comment capture remains reserved for a later release.',
        availabilityStatus: 'unavailable',
        sortOrder: 30,
      },
      {
        code: subscriptionFeatures.facebookInboxIntegration,
        label: 'Facebook inbox integration',
        description: 'Direct inbox sync remains reserved for a later release.',
        availabilityStatus: 'unavailable',
        sortOrder: 31,
      },
      {
        code: subscriptionFeatures.automationAutoReply,
        label: 'Auto reply automation',
        description: 'Automation flows remain reserved for a later release.',
        availabilityStatus: 'unavailable',
        sortOrder: 32,
      },
      {
        code: subscriptionFeatures.integrationsDeliveryApi,
        label: 'Delivery API integrations',
        description:
          'Third-party delivery APIs remain reserved for a later release.',
        availabilityStatus: 'unavailable',
        sortOrder: 33,
      },
      {
        code: subscriptionFeatures.integrationsApiAccess,
        label: 'API access',
        description: 'Public API access remains reserved for a later release.',
        availabilityStatus: 'unavailable',
        sortOrder: 34,
      },
    ],
    limits: [
      {
        code: subscriptionLimits.activeStaffMembers,
        label: 'Active staff seats',
        description:
          'Maximum number of non-owner active staff accounts allowed per enterprise-managed shop.',
        value: 20,
        sortOrder: 0,
      },
      {
        code: subscriptionLimits.managedShops,
        label: 'Managed shop workspaces',
        description:
          'Reference quota for the number of shops intended for the enterprise workspace.',
        value: 20,
        sortOrder: 1,
      },
    ],
  },
] as const;

export type DefaultPlanCode = (typeof defaultPlanCatalog)[number]['code'];
