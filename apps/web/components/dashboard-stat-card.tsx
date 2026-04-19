import type { LucideIcon } from "lucide-react"

import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"

const accentClasses = {
  default: "bg-primary/10 text-primary",
  sunset: "bg-[var(--fom-orange)]/10 text-[var(--fom-orange)]",
  teal: "bg-[var(--fom-teal)]/10 text-[var(--fom-teal)]",
  ink: "bg-muted text-muted-foreground",
} as const

type DashboardStatCardProps = {
  title: string
  value: string
  detail: string
  delta?: string
  icon: LucideIcon
  accent?: keyof typeof accentClasses
  className?: string
}

export function DashboardStatCard({
  title,
  value,
  detail,
  delta,
  icon: Icon,
  accent = "default",
  className: _className,
}: DashboardStatCardProps) {
  return (
    <AdminStatCard
      label={title}
      value={value}
      icon={Icon}
      detail={detail}
      trend={delta ? { value: delta, neutral: true } : undefined}
      iconClassName={accentClasses[accent]}
    />
  )
}
