"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { AppSideNav } from "@/components/app-side-nav"
import { BrandMark } from "@/components/brand-mark"
import { signOutAction } from "@/app/actions"
import type { NavSection } from "@/lib/navigation"
import { Button } from "@workspace/ui/components/button"

type PortalSidebarPanelProps = {
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function PortalSidebarPanel({
  tone,
  sections,
  portalLabel,
  workspaceSlot,
  primaryAction,
  footerName,
  footerSubtitle,
  footerMeta,
  landingHref,
}: PortalSidebarPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--fom-portal-sidebar)]">
      <div className="border-b border-[var(--fom-border-subtle)] px-4 py-4">
        <BrandMark compact />
        <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {portalLabel}
        </p>
        {workspaceSlot ? (
          <div className="mt-3 rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-3">
            {workspaceSlot}
          </div>
        ) : null}
        {primaryAction ? <div className="mt-3">{primaryAction}</div> : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AppSideNav sections={sections} tone={tone} />
      </div>

      <div className="border-t border-[var(--fom-border-subtle)] px-3 py-3">
        <div className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--fom-surface-variant)] text-[11px] font-semibold text-foreground">
              {getInitials(footerName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {footerName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {footerSubtitle}
              </p>
              {footerMeta ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  {footerMeta}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {landingHref ? (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={landingHref}>Landing</Link>
              </Button>
            ) : null}
            <form action={signOutAction} className={landingHref ? "flex-1" : "w-full"}>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
