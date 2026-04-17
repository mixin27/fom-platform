export const subscriptionFeatures = {
  shopWorkspace: 'shop.workspace',
  ordersManagement: 'orders.management',
  ordersParseMessenger: 'orders.parse_messenger',
  ordersImportSpreadsheet: 'orders.import_spreadsheet',
  customersManagement: 'customers.management',
  deliveriesManagement: 'deliveries.management',
  templatesManagement: 'templates.management',
  reportsAnalytics: 'reports.analytics',
  teamMembers: 'team.members',
  csvExports: 'exports.csv',
  billingAnnualDiscount: 'billing.annual_discount',
  facebookCommentsIntegration: 'facebook.integration.comments',
  facebookInboxIntegration: 'facebook.integration.inbox',
  automationAutoReply: 'automation.auto_reply',
  automationTagging: 'automation.tagging',
  analyticsAdvanced: 'analytics.advanced',
  integrationsDeliveryApi: 'integrations.delivery_api',
  integrationsApiAccess: 'integrations.api_access',
  multiShopManagement: 'shops.multi_workspace',
  supportPriority: 'support.priority',
} as const;

export type SubscriptionFeatureCode =
  (typeof subscriptionFeatures)[keyof typeof subscriptionFeatures];

export const subscriptionFeatureCatalog: ReadonlyArray<{
  code: SubscriptionFeatureCode;
  category: string;
  name: string;
  description: string;
  launchPhase: 'phase_one' | 'future';
}> = [
  {
    code: subscriptionFeatures.shopWorkspace,
    category: 'core',
    name: 'Shop workspace',
    description: 'Access the operational workspace for one shop.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.ordersManagement,
    category: 'core',
    name: 'Order management',
    description: 'Create, update, and track orders.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.ordersParseMessenger,
    category: 'core',
    name: 'Paste from Messenger',
    description: 'Parse copied Messenger conversations into order drafts.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.ordersImportSpreadsheet,
    category: 'operations',
    name: 'Spreadsheet order import',
    description: 'Import historical orders from Excel-compatible spreadsheets.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.customersManagement,
    category: 'core',
    name: 'Customer management',
    description: 'Store customer profiles, phones, and addresses.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.deliveriesManagement,
    category: 'core',
    name: 'Delivery management',
    description: 'Assign deliveries and track delivery state.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.templatesManagement,
    category: 'core',
    name: 'Message templates',
    description: 'Create reusable quick-reply templates.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.reportsAnalytics,
    category: 'core',
    name: 'Reports and summaries',
    description: 'Use daily, weekly, and monthly reporting views.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.teamMembers,
    category: 'team',
    name: 'Staff management',
    description: 'Invite staff and manage role-based access.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.csvExports,
    category: 'operations',
    name: 'CSV exports',
    description: 'Export operational data for backup or external analysis.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.billingAnnualDiscount,
    category: 'billing',
    name: 'Annual discount',
    description:
      'Lower annual billing compared with paying monthly for a year.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionFeatures.facebookCommentsIntegration,
    category: 'facebook',
    name: 'Facebook comments integration',
    description: 'Capture orders directly from Facebook comment flows.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.facebookInboxIntegration,
    category: 'facebook',
    name: 'Facebook inbox integration',
    description: 'Sync Facebook inbox activity into the operational workspace.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.automationAutoReply,
    category: 'automation',
    name: 'Auto reply automation',
    description: 'Run keyword or rule-based reply automations.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.automationTagging,
    category: 'automation',
    name: 'Automation tagging',
    description: 'Tag customers or orders automatically from rules.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.analyticsAdvanced,
    category: 'analytics',
    name: 'Advanced analytics',
    description: 'Use deeper conversion, repeat-rate, and product analytics.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.integrationsDeliveryApi,
    category: 'integrations',
    name: 'Delivery API integrations',
    description: 'Connect third-party delivery providers through APIs.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.integrationsApiAccess,
    category: 'integrations',
    name: 'API access',
    description: 'Use external API and webhook integration capabilities.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.multiShopManagement,
    category: 'enterprise',
    name: 'Multi-shop management',
    description:
      'Operate multiple shop workspaces under expanded plan controls.',
    launchPhase: 'future',
  },
  {
    code: subscriptionFeatures.supportPriority,
    category: 'enterprise',
    name: 'Priority support',
    description: 'Receive faster operational support and onboarding help.',
    launchPhase: 'future',
  },
] as const;
