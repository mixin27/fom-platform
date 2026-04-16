"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  CreditCard,
  Download,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  PackageCheck,
  Settings,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
} from "lucide-react"

import type { NavIconName, NavItem } from "@/lib/navigation"
import { cn } from "@workspace/ui/lib/utils"

const iconMap: Record<NavIconName, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  workspace: Building2,
  orders: ShoppingCart,
  customers: Users,
  staffs: Users,
  deliveries: PackageCheck,
  templates: MessageSquareText,
  reports: BarChart3,
  exports: Download,
  settings: Settings,
  shops: Store,
  users: Users,
  plans: WalletCards,
  subscriptions: CreditCard,
  support: LifeBuoy,
}

type AppSideNavProps = {
  items: NavItem[]
  tone: "shop" | "platform"
}

export function AppSideNav({ items, tone }: AppSideNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = iconMap[item.icon]

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              tone === "platform"
                ? isActive
                  ? "bg-[rgba(249,122,31,0.14)] text-[var(--fom-orange)]"
                  : "text-white/62 hover:bg-white/8 hover:text-white"
                : isActive
                  ? "bg-[rgba(249,122,31,0.08)] text-[var(--fom-orange)]"
                  : "text-muted-foreground hover:bg-[var(--fom-portal-surface)] hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
