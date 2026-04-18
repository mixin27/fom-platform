import type { ReactNode } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { AnnouncementBannerStack } from "@/components/announcement-banner-stack"
import { PortalRealtimeBellButton } from "@/components/portal-realtime-bell-button"
import { PortalMobileSidebar } from "@/features/portal-shell/components/portal-mobile-sidebar"
import { PortalSidebarPanel } from "@/features/portal-shell/components/portal-sidebar-panel"
import { PortalSidebarToggle } from "@/features/portal-shell/components/portal-sidebar-toggle"
import { getNotificationUnreadCount } from "@/lib/notifications/api"
import { shopPortalNav } from "@/lib/navigation"
import {
  getCurrentUserProfile,
  getShopAnnouncements,
  getShopPortalContext,
  getShopBilling,
  getAvailablePlans,
} from "@/lib/shop/api"
import { Button } from "@workspace/ui/components/button"
import { SubscriptionBanner } from "@/components/subscription-banner"
import { SubscriptionPaywall } from "@/components/subscription-paywall"
import { ShopSwitcher } from "./_components/shop-switcher"

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function ShopAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const portalContext = await getShopPortalContext()
  const { session, activeShop } = portalContext
  const canManageShop = activeShop.membership.permissions.includes("shops.write")
  const visibleNavSections = shopPortalNav
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.href !== "/dashboard/billing" || canManageShop
      ),
    }))
    .filter((section) => section.items.length > 0)
  const [profileResponse, unreadResponse, announcementResponse, billingResponse, plansResponse] =
    await Promise.all([
      getCurrentUserProfile("/dashboard"),
      getNotificationUnreadCount({
        requiredAccess: "shop",
        retryPath: "/dashboard",
        searchParams: {
          shop_id: activeShop.id,
        },
      }),
      getShopAnnouncements("/dashboard"),
      getShopBilling("/dashboard"),
      getAvailablePlans("/dashboard"),
    ])
  const profile = profileResponse.data
  const unreadCount = unreadResponse.data.unread_count
  const announcements = announcementResponse.data.announcements
  const billing = billingResponse.data
  const plans = plansResponse.data
  const workspaceSlot = (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Active shop
        </p>
        <p className="mt-1 text-[13px] font-semibold text-foreground">
          {activeShop.name}
        </p>
      </div>
      <ShopSwitcher
        shops={session.shops}
        activeShopId={activeShop?.id ?? session.activeShopId}
      />
    </div>
  )
  const primaryAction = (
    <Button
      asChild
      className="w-full bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
    >
      <Link href="/dashboard/orders">
        <Plus data-icon="inline-start" />
        Add order
      </Link>
    </Button>
  )

  return (
    <div className="fom-portal-canvas min-h-screen">
      <PortalMobileSidebar
        tone="shop"
        sections={visibleNavSections}
        portalLabel="Shop Portal"
        workspaceSlot={workspaceSlot}
        primaryAction={primaryAction}
        footerName={profile.name}
        footerSubtitle={profile.email ?? session.user.email ?? "No email"}
        footerMeta={activeShop.name}
        landingHref="/"
      />
      <div className="fom-portal-shell flex min-h-screen w-full overflow-hidden rounded-none border-0 shadow-none">
        <aside className="hidden w-[236px] flex-shrink-0 border-r border-[var(--fom-border-subtle)] bg-[var(--fom-portal-sidebar)] md:block">
          <PortalSidebarPanel
            tone="shop"
            sections={visibleNavSections}
            portalLabel="Shop Portal"
            workspaceSlot={workspaceSlot}
            primaryAction={primaryAction}
            footerName={profile.name}
            footerSubtitle={profile.email ?? session.user.email ?? "No email"}
            footerMeta={activeShop.name}
            landingHref="/"
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--fom-portal-bg)]">
          <SubscriptionPaywall
            status={billing.overview.status}
            plans={plans}
          />
          <SubscriptionBanner
            status={billing.overview.status}
            endAt={billing.overview.current_period_end}
          />
          <AnnouncementBannerStack
            announcements={announcements}
            className="border-b-0"
          />
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-4 md:px-[26px]">
            <div className="flex min-w-0 items-center gap-3">
              <PortalSidebarToggle />
              <div className="hidden text-[12px] text-muted-foreground md:block">
                Shop Portal /
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-foreground">
                  {activeShop.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Orders, customers, delivery, templates, and billing
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                asChild
                size="sm"
                className="hidden bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)] md:inline-flex"
              >
                <Link href="/dashboard/orders">
                  <Plus data-icon="inline-start" />
                  Add order
                </Link>
              </Button>
              <PortalRealtimeBellButton
                href="/dashboard/notifications"
                initialUnreadCount={unreadCount}
                scope="shop"
                shopId={activeShop.id}
              />
              <div className="hidden min-w-8 items-center justify-center rounded-[8px] border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-2 py-1 text-[11px] font-semibold text-foreground md:inline-flex">
                {getInitials(profile.name)}
              </div>
            </div>
          </header>
          {session.user.email && !session.user.emailVerifiedAt ? (
            <div className="border-b border-[var(--fom-orange)]/15 bg-[rgba(249,122,31,0.08)] px-4 py-2.5 md:px-[26px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--fom-ink)]">
                  Verify{" "}
                  <span className="font-medium">{session.user.email}</span> to
                  enable password recovery and billing notices.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/verify-email">Verify email</Link>
                </Button>
              </div>
            </div>
          ) : null}
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-[26px] md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
