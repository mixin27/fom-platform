"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"

type PageIntroProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageIntro({ title, actions }: PageIntroProps) {
  const pathname = usePathname()
  const mode = pathname.startsWith("/platform")
    ? "platform"
    : pathname.startsWith("/dashboard")
      ? "shop"
      : undefined

  return <AdminHeader title={title} actions={actions} mode={mode} />
}
