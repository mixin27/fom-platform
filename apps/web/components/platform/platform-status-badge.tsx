import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const badgeClasses: Record<string, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  trial: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
  trialing: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
  expiring:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  overdue: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  new: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
  confirmed:
    "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50",
  out_for_delivery:
    "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  scheduled:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
  invited:
    "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50",
  disabled:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
  inactive:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
  cancelled:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
  expired:
    "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  queued: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  failed: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  high: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  low: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
}

type PlatformStatusBadgeProps = {
  status: string | null | undefined
  label?: string | null
}

export function PlatformStatusBadge({
  status,
  label,
}: PlatformStatusBadgeProps) {
  const normalized = status?.toLowerCase() ?? "inactive"

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        badgeClasses[normalized] ?? badgeClasses.inactive
      )}
    >
      {label ?? normalized.replace(/_/g, " ")}
    </Badge>
  )
}
