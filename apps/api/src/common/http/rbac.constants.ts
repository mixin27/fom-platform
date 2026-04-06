export type AccessScope = 'shop' | 'platform';

export const permissions = {
  shopsRead: 'shops.read',
  shopsWrite: 'shops.write',
  membersRead: 'members.read',
  membersManage: 'members.manage',
  customersRead: 'customers.read',
  customersWrite: 'customers.write',
  ordersRead: 'orders.read',
  ordersWrite: 'orders.write',
  orderItemsWrite: 'order_items.write',
  orderStatusWrite: 'order_status.write',
  deliveriesRead: 'deliveries.read',
  deliveriesWrite: 'deliveries.write',
  templatesRead: 'templates.read',
  templatesWrite: 'templates.write',
  summariesRead: 'summaries.read',
  platformDashboardRead: 'platform.dashboard.read',
  platformShopsRead: 'platform.shops.read',
  platformSubscriptionsRead: 'platform.subscriptions.read',
  platformSupportRead: 'platform.support.read',
  platformSettingsWrite: 'platform.settings.write',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export const permissionCatalog: ReadonlyArray<{
  code: Permission;
  scope: AccessScope;
  name: string;
  description: string;
}> = [
  {
    code: permissions.shopsRead,
    scope: 'shop',
    name: 'Read shops',
    description: 'View shop details and membership summaries.',
  },
  {
    code: permissions.shopsWrite,
    scope: 'shop',
    name: 'Manage shops',
    description: 'Update shop profile and settings.',
  },
  {
    code: permissions.membersRead,
    scope: 'shop',
    name: 'Read members',
    description: 'List shop members and their access.',
  },
  {
    code: permissions.membersManage,
    scope: 'shop',
    name: 'Manage members',
    description: 'Invite members and assign or revoke roles.',
  },
  {
    code: permissions.customersRead,
    scope: 'shop',
    name: 'Read customers',
    description: 'View customer records and purchase history.',
  },
  {
    code: permissions.customersWrite,
    scope: 'shop',
    name: 'Manage customers',
    description: 'Create and update customer records.',
  },
  {
    code: permissions.ordersRead,
    scope: 'shop',
    name: 'Read orders',
    description: 'View order lists and details.',
  },
  {
    code: permissions.ordersWrite,
    scope: 'shop',
    name: 'Manage orders',
    description: 'Create and update orders.',
  },
  {
    code: permissions.orderItemsWrite,
    scope: 'shop',
    name: 'Manage order items',
    description: 'Add, update, and remove order items.',
  },
  {
    code: permissions.orderStatusWrite,
    scope: 'shop',
    name: 'Manage order status',
    description: 'Advance or correct order status transitions.',
  },
  {
    code: permissions.deliveriesRead,
    scope: 'shop',
    name: 'Read deliveries',
    description: 'View shop delivery assignments and statuses.',
  },
  {
    code: permissions.deliveriesWrite,
    scope: 'shop',
    name: 'Manage deliveries',
    description: 'Assign drivers and update delivery progress.',
  },
  {
    code: permissions.templatesRead,
    scope: 'shop',
    name: 'Read message templates',
    description: 'View shop message templates and quick replies.',
  },
  {
    code: permissions.templatesWrite,
    scope: 'shop',
    name: 'Manage message templates',
    description: 'Create and update shop message templates.',
  },
  {
    code: permissions.summariesRead,
    scope: 'shop',
    name: 'Read summaries',
    description: 'View daily summary analytics.',
  },
  {
    code: permissions.platformDashboardRead,
    scope: 'platform',
    name: 'Read platform dashboard',
    description: 'View cross-tenant platform metrics and health.',
  },
  {
    code: permissions.platformShopsRead,
    scope: 'platform',
    name: 'Read platform shops',
    description: 'View tenant shops and their operational state.',
  },
  {
    code: permissions.platformSubscriptionsRead,
    scope: 'platform',
    name: 'Read subscriptions',
    description: 'View billing and subscription records for shops.',
  },
  {
    code: permissions.platformSupportRead,
    scope: 'platform',
    name: 'Read support workspace',
    description: 'View platform support queues and account issues.',
  },
  {
    code: permissions.platformSettingsWrite,
    scope: 'platform',
    name: 'Manage platform settings',
    description: 'Update platform-wide settings and internal configuration.',
  },
] as const;

export const defaultRoleCatalog: ReadonlyArray<{
  code: string;
  scope: AccessScope;
  name: string;
  description: string;
  permissionCodes: readonly Permission[];
}> = [
  {
    code: 'owner',
    scope: 'shop',
    name: 'Owner',
    description: 'Full access for the primary shop operator.',
    permissionCodes: permissionCatalog
      .filter((permission) => permission.scope === 'shop')
      .map((permission) => permission.code),
  },
  {
    code: 'staff',
    scope: 'shop',
    name: 'Staff',
    description: 'Operational access for day-to-day order management.',
    permissionCodes: [
      permissions.shopsRead,
      permissions.membersRead,
      permissions.customersRead,
      permissions.customersWrite,
      permissions.ordersRead,
      permissions.ordersWrite,
      permissions.orderItemsWrite,
      permissions.orderStatusWrite,
      permissions.deliveriesRead,
      permissions.deliveriesWrite,
      permissions.templatesRead,
      permissions.templatesWrite,
      permissions.summariesRead,
    ],
  },
  {
    code: 'platform_owner',
    scope: 'platform',
    name: 'Platform Owner',
    description: 'Full access to the internal platform workspace.',
    permissionCodes: [
      permissions.platformDashboardRead,
      permissions.platformShopsRead,
      permissions.platformSubscriptionsRead,
      permissions.platformSupportRead,
      permissions.platformSettingsWrite,
    ],
  },
] as const;

export const defaultRolePermissions = Object.fromEntries(
  defaultRoleCatalog.map((role) => [role.code, [...role.permissionCodes]]),
) as Record<string, Permission[]>;
