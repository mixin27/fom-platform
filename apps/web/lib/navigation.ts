export type NavIconName =
  | "dashboard"
  | "workspace"
  | "orders"
  | "customers"
  | "staffs"
  | "deliveries"
  | "templates"
  | "reports"
  | "exports"
  | "settings"
  | "shops"
  | "users"
  | "plans"
  | "subscriptions"
  | "support"
  | "billing"
  | "payments"
  | "contact"

export type NavItem = {
  href: string
  label: string
  icon: NavIconName
  exact?: boolean
}

export const shopPortalNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/dashboard/workspace", label: "Workspace", icon: "workspace" },
  { href: "/dashboard/orders", label: "Orders", icon: "orders" },
  { href: "/dashboard/customers", label: "Customers", icon: "customers" },
  { href: "/dashboard/staffs", label: "Staffs", icon: "staffs" },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: "billing",
  },
  {
    href: "/dashboard/deliveries",
    label: "Deliveries",
    icon: "deliveries",
  },
  {
    href: "/dashboard/templates",
    label: "Templates",
    icon: "templates",
  },
  { href: "/dashboard/reports", label: "Reports", icon: "reports" },
  { href: "/dashboard/exports", label: "Exports", icon: "exports" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
]

export const platformPortalNav: NavItem[] = [
  { href: "/platform", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/platform/shops", label: "Shops", icon: "shops" },
  { href: "/platform/users", label: "Users", icon: "users" },
  { href: "/platform/plans", label: "Plans", icon: "plans" },
  {
    href: "/platform/subscriptions",
    label: "Subscriptions",
    icon: "subscriptions",
  },
  { href: "/platform/payments", label: "Payments", icon: "payments" },
  {
    href: "/platform/contact-form",
    label: "Contact Form",
    icon: "contact",
  },
  { href: "/platform/exports", label: "Exports", icon: "exports" },
  { href: "/platform/support", label: "Support", icon: "support" },
  { href: "/platform/settings", label: "Settings", icon: "settings" },
]
