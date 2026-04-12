import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

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
  className,
}: DashboardStatCardProps) {
  return (
    <Card className={cn("border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none", className)}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-xl",
              accentClasses[accent]
            )}
          >
            <Icon className="size-4" />
          </span>
          {delta ? (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {delta}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[1.9rem] leading-none font-extrabold tracking-[-0.04em] text-foreground">
            {value}
          </p>
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="text-[11px] leading-5 text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}
