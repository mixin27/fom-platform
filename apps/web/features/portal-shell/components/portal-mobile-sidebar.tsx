"use client"

import type { ReactNode } from "react"

import { PortalSidebarPanel } from "@/features/portal-shell/components/portal-sidebar-panel"
import { usePortalUiStore } from "@/features/portal-shell/store/portal-ui-store"
import type { NavSection } from "@/lib/navigation"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"

type PortalMobileSidebarProps = {
  tone: "shop" | "platform"
  sections: NavSection[]
  portalLabel: string
  workspaceSlot?: ReactNode
  primaryAction?: ReactNode
  footerName: string
  footerSubtitle: string
  footerMeta?: string
  landingHref?: string
}

export function PortalMobileSidebar(props: PortalMobileSidebarProps) {
  const mobileSidebarOpen = usePortalUiStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = usePortalUiStore(
    (state) => state.setMobileSidebarOpen
  )

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent
        side="left"
        className="w-[276px] border-r border-[var(--fom-border-subtle)] bg-[var(--fom-portal-sidebar)] p-0 sm:max-w-[276px]"
      >
        <PortalSidebarPanel {...props} />
      </SheetContent>
    </Sheet>
  )
}
