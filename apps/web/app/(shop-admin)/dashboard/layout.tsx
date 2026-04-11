import type { ReactNode } from "react"
import Link from "next/link"
import { Bell, Plus, Search } from "lucide-react"

import { signOutAction } from "@/app/actions"
import { AppSideNav } from "@/components/app-side-nav"
import { BrandMark } from "@/components/brand-mark"
import { shopPortalNav } from "@/lib/navigation"
import { getActiveShop, requireShopAdmin } from "@/lib/auth/session"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function ShopAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireShopAdmin()
  const activeShop = getActiveShop(session)
  const primaryRole =
    activeShop?.membership.role === "owner"
      ? "Owner"
      : activeShop?.membership.role === "staff"
        ? "Staff"
        : "Member"

  return (
    <div className="fom-portal-canvas min-h-screen">
      <div className="fom-portal-shell flex h-screen w-full max-w-none max-h-none overflow-hidden rounded-none border-0 shadow-none">
        <aside className="w-[236px] flex-shrink-0 border-r border-black/6 bg-[var(--fom-portal-sidebar)]">
          <div className="flex h-full flex-col">
            <div className="border-b border-black/6 px-4 py-3.5">
              <BrandMark compact />
              <div className="mt-3 rounded-2xl border border-black/6 bg-[var(--fom-portal-surface)] p-3.5">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Shop portal
                </p>
                <p className="mt-1.5 text-sm font-semibold text-foreground">
                  {activeShop?.name ?? "Shop workspace"}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Badge variant="outline">
                    {primaryRole}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {activeShop ? `${activeShop.membership.permissions.length} permissions` : "No shop selected"}
                  </span>
                </div>
              </div>
              <Button className="mt-3 w-full bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
                <Plus data-icon="inline-start" />
                Add order
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <AppSideNav items={shopPortalNav} tone="shop" />
            </div>

            <div className="border-t border-black/6 px-4 py-3">
              <div className="rounded-2xl border border-black/6 bg-white p-3.5">
                <p className="text-sm font-semibold text-foreground">
                  {session.user.name}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {session.user.email}
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

        <div className="flex min-w-0 flex-1 flex-col bg-[#f7f4ef]">
          <header className="flex h-14 items-center gap-4 border-b border-black/6 bg-white px-5">
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
                  className="h-8 w-60 rounded-xl border border-black/8 bg-[#f7f4ef] pr-3 pl-9 text-sm outline-none focus:border-[var(--fom-orange)]"
                  placeholder="Search orders or customers"
                />
              </div>
              <button className="flex size-8 items-center justify-center rounded-xl border border-black/8 bg-white text-muted-foreground">
                <Bell className="size-4" />
              </button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
