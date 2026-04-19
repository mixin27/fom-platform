"use client"

import type { ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

interface AdminHeaderProps {
  title: string
  actions?: ReactNode
  mode?: "platform" | "shop"
  breadcrumb?: ReactNode
  className?: string
}

export function AdminHeader({
  title,
  actions,
  mode,
  breadcrumb,
  className,
}: AdminHeaderProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {/* {breadcrumb ?? (mode ? <PortalBreadcrumb mode={mode} /> : null)} */}
        <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 empty:hidden">{actions}</div>
      )}
    </div>
  )
}
