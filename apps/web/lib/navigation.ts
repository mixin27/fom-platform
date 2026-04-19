export type NavIconName =
  | "dashboard"
  | "workspace"
  | "orders"
  | "customers"
  | "staffs"
  | "deliveries"
  | "templates"
  | "reports"
  | "inbox"
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
  | "announcements"
  | "push"

export type NavItem = {
  href: string
  label: string
  icon: NavIconName
  exact?: boolean
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const shopPortalNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        exact: true,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: "orders" },
      { href: "/dashboard/inbox", label: "Inbox", icon: "inbox" },
      { href: "/dashboard/customers", label: "Customers", icon: "customers" },
      {
        href: "/dashboard/deliveries",
        label: "Deliveries",
        icon: "deliveries",
      },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/dashboard/staffs", label: "Staffs", icon: "staffs" },
      {
        href: "/dashboard/billing",
        label: "Billing",
        icon: "billing",
      },
      {
        href: "/dashboard/templates",
        label: "Templates",
        icon: "templates",
      },
      { href: "/dashboard/reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
    ],
  },
]

export const platformPortalNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/platform", label: "Dashboard", icon: "dashboard", exact: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/platform/shops", label: "Shops", icon: "shops" },
      { href: "/platform/users", label: "Users", icon: "users" },
      {
        href: "/platform/contact-form",
        label: "Contact Form",
        icon: "contact",
      },
      { href: "/platform/support", label: "Support", icon: "support" },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/platform/plans", label: "Plans", icon: "plans" },
      {
        href: "/platform/subscriptions",
        label: "Subscriptions",
        icon: "subscriptions",
      },
      { href: "/platform/payments", label: "Payments", icon: "payments" },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/platform/push-notifications",
        label: "Push",
        icon: "push",
      },
      {
        href: "/platform/announcements",
        label: "Announcements",
        icon: "announcements",
      },
      { href: "/platform/settings", label: "Settings", icon: "settings" },
    ],
  },
]
