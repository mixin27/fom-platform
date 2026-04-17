import type { ReactNode } from "react"
import Link from "next/link"
import { Search, Shield } from "lucide-react"

import { signOutAction } from "@/app/actions"
import { AnnouncementBannerStack } from "@/components/announcement-banner-stack"
import { AppSideNav } from "@/components/app-side-nav"
import { BrandMark } from "@/components/brand-mark"
import { PortalRealtimeBellButton } from "@/components/portal-realtime-bell-button"
import { platformPortalNav } from "@/lib/navigation"
import { getNotificationUnreadCount } from "@/lib/notifications/api"
import { requirePlatformAdmin } from "@/lib/auth/session"
import { getPlatformLiveAnnouncements } from "@/lib/platform/api"
import { Button } from "@workspace/ui/components/button"

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requirePlatformAdmin()
  const [unreadResponse, announcementResponse] = await Promise.all([
    getNotificationUnreadCount({
      requiredAccess: "platform",
      retryPath: "/platform",
    }),
    getPlatformLiveAnnouncements(),
  ])
  const unreadCount = unreadResponse.data.unread_count
  const announcements = announcementResponse.data.announcements

  return (
    <div className="fom-admin-canvas min-h-screen">
      <div className="fom-admin-shell flex h-screen w-full max-w-none max-h-none overflow-hidden rounded-none border-0 shadow-none">
        <aside className="w-[232px] flex-shrink-0 border-r border-white/10 bg-[var(--fom-admin-sidebar)] text-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-4 py-3.5">
              <BrandMark tone="light" compact />
              <div className="mt-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-xl bg-white/8 text-white/85">
                    <Shield className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/45">
                      Internal
                    </p>
                    <p className="truncate text-sm font-semibold text-white">
                      Platform workspace
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <AppSideNav items={platformPortalNav} tone="platform" />
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <p className="text-sm font-semibold text-white">
                  {session.user.name}
                </p>
                <p className="mt-1 text-xs text-white/40">{session.user.email}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 bg-transparent text-white hover:bg-white/10"
                  >
                    <Link href="/">Landing</Link>
                  </Button>
                  <form action={signOutAction} className="flex-1">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 bg-transparent text-white hover:bg-white/10"
                    >
                      Sign out
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--fom-admin-surface)]">
          <AnnouncementBannerStack announcements={announcements} />
          <header className="flex h-14 items-center gap-4 border-b border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-5">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[var(--fom-ink)]">
                Platform workspace
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tenants, subscriptions, and operational health
              </span>
            </div>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-8 w-60 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] pr-3 pl-9 text-sm outline-none focus:border-[var(--fom-orange)]"
                  placeholder="Search shops or invoices..."
                />
              </div>
              <PortalRealtimeBellButton
                href="/platform/notifications"
                initialUnreadCount={unreadCount}
                scope="platform"
                surfaceClassName="bg-[var(--fom-admin-surface)]"
              />
            </div>
          </header>
          {session.user.email && !session.user.emailVerifiedAt ? (
            <div className="border-b border-[var(--fom-orange)]/15 bg-[rgba(249,122,31,0.08)] px-5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--fom-ink)]">
                  Verify <span className="font-medium">{session.user.email}</span> to
                  receive billing, recovery, and platform notices reliably.
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
