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
  summariesRead: 'summaries.read',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export const permissionCatalog: ReadonlyArray<{
  code: Permission;
  name: string;
  description: string;
}> = [
  {
    code: permissions.shopsRead,
    name: 'Read shops',
    description: 'View shop details and membership summaries.',
  },
  {
    code: permissions.shopsWrite,
    name: 'Manage shops',
    description: 'Update shop profile and settings.',
  },
  {
    code: permissions.membersRead,
    name: 'Read members',
    description: 'List shop members and their access.',
  },
  {
    code: permissions.membersManage,
    name: 'Manage members',
    description: 'Invite members and assign or revoke roles.',
  },
  {
    code: permissions.customersRead,
    name: 'Read customers',
    description: 'View customer records and purchase history.',
  },
  {
    code: permissions.customersWrite,
    name: 'Manage customers',
    description: 'Create and update customer records.',
  },
  {
    code: permissions.ordersRead,
    name: 'Read orders',
    description: 'View order lists and details.',
  },
  {
    code: permissions.ordersWrite,
    name: 'Manage orders',
    description: 'Create and update orders.',
  },
  {
    code: permissions.orderItemsWrite,
    name: 'Manage order items',
    description: 'Add, update, and remove order items.',
  },
  {
    code: permissions.orderStatusWrite,
    name: 'Manage order status',
    description: 'Advance or correct order status transitions.',
  },
  {
    code: permissions.summariesRead,
    name: 'Read summaries',
    description: 'View daily summary analytics.',
  },
] as const;

export const defaultRoleCatalog: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
  permissionCodes: readonly Permission[];
}> = [
  {
    code: 'owner',
    name: 'Owner',
    description: 'Full access for the primary shop operator.',
    permissionCodes: permissionCatalog.map((permission) => permission.code),
  },
  {
    code: 'staff',
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
      permissions.summariesRead,
    ],
  },
] as const;

export const defaultRolePermissions = Object.fromEntries(
  defaultRoleCatalog.map((role) => [role.code, [...role.permissionCodes]]),
) as Record<string, Permission[]>;
