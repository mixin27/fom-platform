import type { LucideIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

const accentClasses = {
  default: "bg-primary/10 text-primary",
  sunset: "bg-[rgba(249,122,31,0.12)] text-[rgba(148,67,7,1)]",
  teal: "bg-[rgba(24,183,165,0.14)] text-[rgba(10,102,92,1)]",
  ink: "bg-[rgba(19,26,34,0.08)] text-[rgba(19,26,34,0.78)]",
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
    <Card className={cn("border border-black/5 bg-white/82", className)}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-[10px]",
              accentClasses[accent]
            )}
          >
            <Icon className="size-4" />
          </span>
          {delta ? (
            <span className="text-xs font-semibold text-muted-foreground">
              {delta}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[1.7rem] leading-none font-extrabold tracking-[-0.03em] text-foreground">
            {value}
          </p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}
