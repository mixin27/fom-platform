import type { ReactNode } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { signOutAction } from "@/app/actions"
import { AppSideNav } from "@/components/app-side-nav"
import { BrandMark } from "@/components/brand-mark"
import { PortalRealtimeBellButton } from "@/components/portal-realtime-bell-button"
import { getNotificationUnreadCount } from "@/lib/notifications/api"
import { shopPortalNav } from "@/lib/navigation"
import { getCurrentUserProfile, getShopPortalContext } from "@/lib/shop/api"
import { Button } from "@workspace/ui/components/button"
import { ShopSwitcher } from "./_components/shop-switcher"

export default async function ShopAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const portalContext = await getShopPortalContext()
  const { session, activeShop } = portalContext
  const navItems =
    session.shops.length > 1
      ? shopPortalNav
      : shopPortalNav.filter((item) => item.href !== "/dashboard/workspace")
  const [profileResponse, unreadResponse] = await Promise.all([
    getCurrentUserProfile("/dashboard"),
    getNotificationUnreadCount({
      requiredAccess: "shop",
      retryPath: "/dashboard",
      searchParams: {
        shop_id: activeShop.id,
      },
    }),
  ])
  const profile = profileResponse.data
  const unreadCount = unreadResponse.data.unread_count

  return (
    <div className="fom-portal-canvas min-h-screen">
      <div className="fom-portal-shell flex h-screen w-full max-w-none max-h-none overflow-hidden rounded-none border-0 shadow-none">
        <aside className="w-[236px] flex-shrink-0 border-r border-[var(--fom-border-subtle)] bg-[var(--fom-portal-sidebar)]">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--fom-border-subtle)] px-4 py-3.5">
              <BrandMark compact />
              <div className="mt-3 rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-bg)] p-3.5">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Shop portal
                </p>
                <ShopSwitcher
                  shops={session.shops}
                  activeShopId={activeShop?.id ?? session.activeShopId}
                />
              </div>
              <Button
                asChild
                className="mt-3 w-full bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href="/dashboard/orders">
                  <Plus data-icon="inline-start" />
                  Add order
                </Link>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <AppSideNav items={navItems} tone="shop" />
            </div>

            <div className="border-t border-[var(--fom-border-subtle)] px-4 py-3">
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] p-3.5">
                <p className="text-sm font-semibold text-foreground">
                  {profile.name}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {profile.email ?? session.user.email ?? "No email"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/">Landing</Link>
                  </Button>
                  <form action={signOutAction} className="flex-1">
                    <Button type="submit" variant="outline" size="sm" className="w-full">
                      Sign out
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--fom-portal-bg)]">
          <header className="flex h-14 items-center gap-4 border-b border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-5">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-foreground">
                Shop dashboard
              </span>
              <span className="text-[11px] text-muted-foreground">
                Orders, customers, deliveries, templates, and reporting
              </span>
            </div>
            <div className="ml-auto hidden items-center gap-2.5 md:flex">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-8 w-60 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-bg)] pr-3 pl-9 text-sm outline-none focus:border-[var(--fom-orange)]"
                  placeholder="Search orders or customers"
                />
              </div>
              <PortalRealtimeBellButton
                href="/dashboard/notifications"
                initialUnreadCount={unreadCount}
                scope="shop"
                shopId={activeShop.id}
              />
            </div>
          </header>
          {session.user.email && !session.user.emailVerifiedAt ? (
            <div className="border-b border-[var(--fom-orange)]/15 bg-[rgba(249,122,31,0.08)] px-5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--fom-ink)]">
                  Verify <span className="font-medium">{session.user.email}</span> to
                  enable password recovery and billing notices.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/verify-email">Verify email</Link>
                </Button>
              </div>
            </div>
          ) : null}
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
