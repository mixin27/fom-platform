"use client"

import { Menu } from "lucide-react"

import { usePortalUiStore } from "@/features/portal-shell/store/portal-ui-store"
import { Button } from "@workspace/ui/components/button"

export function PortalSidebarToggle() {
  const openMobileSidebar = usePortalUiStore((state) => state.openMobileSidebar)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="md:hidden"
      aria-label="Open navigation"
      onClick={openMobileSidebar}
    >
      <Menu />
    </Button>
  )
}
