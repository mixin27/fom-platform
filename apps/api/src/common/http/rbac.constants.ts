export const shopRoles = ['owner', 'staff'] as const;

export type ShopRole = (typeof shopRoles)[number];

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

export const rolePermissions: Record<ShopRole, readonly Permission[]> = {
  owner: [
    permissions.shopsRead,
    permissions.shopsWrite,
    permissions.membersRead,
    permissions.membersManage,
    permissions.customersRead,
    permissions.customersWrite,
    permissions.ordersRead,
    permissions.ordersWrite,
    permissions.orderItemsWrite,
    permissions.orderStatusWrite,
    permissions.summariesRead,
  ],
  staff: [
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
};

export function permissionsForRole(role: ShopRole): readonly Permission[] {
  return rolePermissions[role] ?? [];
}
