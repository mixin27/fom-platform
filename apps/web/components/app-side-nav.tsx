"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BellRing,
  Building2,
  CreditCard,
  Download,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageSquareText,
  PackageCheck,
  Settings,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
} from "lucide-react"

import type { NavIconName, NavSection } from "@/lib/navigation"
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
  inbox: Inbox,
  exports: Download,
  settings: Settings,
  shops: Store,
  users: Users,
  plans: WalletCards,
  subscriptions: CreditCard,
  support: LifeBuoy,
  billing: CreditCard,
  payments: CreditCard,
  contact: Inbox,
  announcements: Megaphone,
  push: BellRing,
}

type AppSideNavProps = {
  sections: NavSection[]
  tone: "shop" | "platform"
}

export function AppSideNav({ sections, tone }: AppSideNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1.5">
          <p className="px-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
            {section.label}
          </p>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = iconMap[item.icon]

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? tone === "platform"
                        ? "bg-[rgba(244,98,42,0.12)] text-[var(--fom-orange)]"
                        : "bg-[rgba(244,98,42,0.08)] text-[var(--fom-orange)]"
                      : "text-muted-foreground hover:bg-[var(--fom-surface-variant)] hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "opacity-100" : "opacity-65"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
