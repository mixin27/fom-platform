import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

const accentClasses = {
  default: "bg-primary/10 text-primary",
  sunset: "bg-[var(--fom-orange)]/10 text-[var(--fom-orange)]",
  teal: "bg-[var(--fom-teal)]/10 text-[var(--fom-teal)]",
  ink: "bg-muted text-muted-foreground",
} as const

interface AdminStatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  detail?: string
  trend?: {
    value: string
    positive?: boolean
    neutral?: boolean
  }
  className?: string
  iconClassName?: string
  accent?: keyof typeof accentClasses
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  detail,
  trend,
  className,
  iconClassName,
  accent,
}: AdminStatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <CardContent className="p-4 flex flex-col gap-1">
        {Icon && (
          <div
            className={cn(
              "mb-2 flex size-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground",
              accent ? accentClasses[accent] : null,
              iconClassName
            )}
          >
            <Icon className="size-4" />
          </div>
        )}
        <p className="text-[10px] font-bold tracking-[0.05em] uppercase text-muted-foreground">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-[10px] font-semibold",
                trend.positive && "text-emerald-600",
                trend.neutral && "text-muted-foreground",
                !trend.positive && !trend.neutral && "text-red-600"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {detail && (
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-normal">
            {detail}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
