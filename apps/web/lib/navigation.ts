export type NavIconName =
  | "dashboard"
  | "orders"
  | "customers"
  | "deliveries"
  | "templates"
  | "reports"
  | "settings"
  | "shops"
  | "subscriptions"
  | "support"

export type NavItem = {
  href: string
  label: string
  icon: NavIconName
  exact?: boolean
}

export const shopPortalNav: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/app/orders", label: "Orders", icon: "orders" },
  { href: "/app/customers", label: "Customers", icon: "customers" },
  { href: "/app/deliveries", label: "Deliveries", icon: "deliveries" },
  { href: "/app/templates", label: "Templates", icon: "templates" },
  { href: "/app/reports", label: "Reports", icon: "reports" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
]

export const platformPortalNav: NavItem[] = [
  { href: "/platform", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/platform/shops", label: "Shops", icon: "shops" },
  {
    href: "/platform/subscriptions",
    label: "Subscriptions",
    icon: "subscriptions",
  },
  { href: "/platform/support", label: "Support", icon: "support" },
  { href: "/platform/settings", label: "Settings", icon: "settings" },
]
