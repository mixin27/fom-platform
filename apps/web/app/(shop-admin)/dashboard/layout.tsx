import type { ReactNode } from "react"
import Link from "next/link"
import { Bell, Search } from "lucide-react"

import { signOutAction } from "@/app/actions"
import { AppSideNav } from "@/components/app-side-nav"
import { BrandMark } from "@/components/brand-mark"
import { shopPortalNav } from "@/lib/navigation"
import { requireShopAdmin } from "@/lib/auth/session"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function ShopAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireShopAdmin()

  return (
    <div className="fom-portal-canvas min-h-screen">
      <div className="fom-portal-shell flex h-screen w-full max-w-none max-h-none overflow-hidden rounded-none shadow-none">
        <aside className="w-[260px] flex-shrink-0 border-r border-black/6 bg-[var(--fom-portal-sidebar)]">
          <div className="flex h-full flex-col">
            <div className="border-b border-black/6 px-4 py-4">
              <BrandMark compact />
              <div className="mt-4 rounded-2xl border border-black/6 bg-[var(--fom-portal-surface)] p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Shop portal
                </p>
                <p className="mt-2 font-semibold text-foreground">
                  {session.shopName}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline">
                    {session.subscriptionStatus === "trial"
                      ? "Trial"
                      : "Subscribed"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Owner access
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AppSideNav items={shopPortalNav} tone="shop" />
            </div>

            <div className="border-t border-black/6 px-4 py-4">
              <div className="rounded-2xl border border-black/6 bg-white p-4">
                <p className="text-sm font-semibold text-foreground">
                  {session.displayName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {session.email}
                </p>
                <div className="mt-4 flex gap-2">
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

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--fom-portal-surface)]">
          <header className="flex h-16 items-center gap-4 border-b border-black/6 bg-white px-6">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Shop dashboard
              </span>
              <span className="text-xs text-muted-foreground">
                Orders, customers, deliveries, templates, and reporting
              </span>
            </div>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-9 w-64 rounded-xl border border-black/8 bg-[var(--fom-portal-surface)] pr-3 pl-9 text-sm outline-none focus:border-[var(--fom-orange)]"
                  placeholder="Search orders or customers"
                />
              </div>
              <button className="flex size-9 items-center justify-center rounded-xl border border-black/8 bg-white text-muted-foreground">
                <Bell className="size-4" />
              </button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
