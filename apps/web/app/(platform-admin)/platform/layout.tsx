import type { ReactNode } from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

import { AnnouncementBannerStack } from "@/components/announcement-banner-stack"
import { PortalRealtimeBellButton } from "@/components/portal-realtime-bell-button"
import { PortalBreadcrumb } from "@/features/portal-shell/components/portal-breadcrumb"
import { PortalMobileSidebar } from "@/features/portal-shell/components/portal-mobile-sidebar"
import { PortalSidebarPanel } from "@/features/portal-shell/components/portal-sidebar-panel"
import { PortalSidebarToggle } from "@/features/portal-shell/components/portal-sidebar-toggle"
import { platformPortalNav } from "@/lib/navigation"
import { getNotificationUnreadCount } from "@/lib/notifications/api"
import { requirePlatformAdmin } from "@/lib/auth/session"
import { getPlatformLiveAnnouncements } from "@/lib/platform/api"
import { Button } from "@workspace/ui/components/button"

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

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
  const workspaceSlot = (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-[rgba(244,98,42,0.12)] text-[var(--fom-orange)]">
        <Shield className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Internal
        </p>
        <p className="truncate text-[13px] font-semibold text-foreground">
          Platform operations
        </p>
      </div>
    </div>
  )

  return (
    <div className="fom-admin-canvas min-h-screen">
      <PortalMobileSidebar
        tone="platform"
        sections={platformPortalNav}
        portalLabel="Admin Portal"
        workspaceSlot={workspaceSlot}
        footerName={session.user.name}
        footerSubtitle={session.user.email ?? "No email"}
        footerMeta="Platform admin"
        landingHref="/"
      />
      <div className="fom-admin-shell flex min-h-screen w-full overflow-hidden rounded-none border-0 shadow-none">
        <aside className="hidden w-[236px] flex-shrink-0 border-r border-[var(--fom-border-subtle)] bg-[var(--fom-admin-sidebar)] md:block">
          <PortalSidebarPanel
            tone="platform"
            sections={platformPortalNav}
            portalLabel="Admin Portal"
            workspaceSlot={workspaceSlot}
            footerName={session.user.name}
            footerSubtitle={session.user.email ?? "No email"}
            footerMeta="Platform admin"
            landingHref="/"
          />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--fom-admin-surface)]">
          <AnnouncementBannerStack announcements={announcements} />
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 md:px-[26px]">
            <div className="flex min-w-0 items-center gap-3">
              <PortalSidebarToggle />
              <PortalBreadcrumb mode="platform" />
              {/* <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[var(--fom-ink)]">
                  Platform workspace
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Shops, billing, support, announcements, and platform health
                </p>
              </div> */}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
              >
                <Link href="/platform/payments">Payments</Link>
              </Button>
              <PortalRealtimeBellButton
                href="/platform/notifications"
                initialUnreadCount={unreadCount}
                scope="platform"
                surfaceClassName="bg-[var(--fom-admin-surface)]"
              />
              <div className="hidden min-w-8 items-center justify-center rounded-[8px] border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-2 py-1 text-[11px] font-semibold text-foreground md:inline-flex">
                {getInitials(session.user.name)}
              </div>
            </div>
          </header>
          {session.user.email && !session.user.emailVerifiedAt ? (
            <div className="border-b border-[var(--fom-orange)]/15 bg-[rgba(249,122,31,0.08)] px-4 py-2.5 md:px-[26px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--fom-ink)]">
                  Verify{" "}
                  <span className="font-medium">{session.user.email}</span> to
                  receive billing, recovery, and platform notices reliably.
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
