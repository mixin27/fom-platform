import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CircleSlash2Icon,
  PencilLineIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { getPlatformSettings } from "@/lib/platform/api"
import { formatCurrency } from "@/lib/platform/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function PlatformPlanDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const response = await getPlatformSettings()
  const plan = response.data.plans.find((p) => p.code === code)

  if (!plan) {
    notFound()
  }

  const availableItems = plan.items.filter(
    (i) => i.availability_status === "available"
  )
  const unavailableItems = plan.items.filter(
    (i) => i.availability_status === "unavailable"
  )

  return (
    <div className="flex flex-col gap-4">
      <AdminHeader
        title={plan.name}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/plans">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Catalog
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/platform/plans/${plan.code}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit Plan
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Plan Identity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Internal Code</span>
              <span className="font-mono font-bold">{plan.code}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Status</span>
              <Badge variant={plan.is_active ? "secondary" : "outline"} className="text-[10px] uppercase font-bold px-2 py-0">
                {plan.is_active ? "Active" : "Draft"}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Display Sort</span>
              <span className="font-bold">{plan.sort_order}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Standard Billing</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Price Point</span>
              <span className="font-bold underline decoration-[var(--fom-accent)] underline-offset-4">
                {formatCurrency(plan.price, plan.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Interval</span>
              <span className="font-bold uppercase tracking-wider">{plan.billing_period}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Currency</span>
              <span className="font-bold">{plan.currency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Live Stats</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Shop Population</span>
              <span className="font-bold">{plan.shop_count} active</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-muted-foreground font-medium">Collected Revenue</span>
              <span className="font-bold">{formatCurrency(plan.collected_revenue, plan.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50 bg-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13.5px] font-bold">Core Features</CardTitle>
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {availableItems.length} Available
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {plan.items.length === 0 ? (
              <p className="py-12 text-center text-[13px] text-muted-foreground italic">
                No features recorded for this plan.
              </p>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <tbody className="divide-y divide-[var(--fom-border-subtle)]/50">
                  {plan.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 min-w-[32px]">
                        {item.availability_status === "available" ? (
                          <BadgeCheckIcon className="size-4 text-emerald-600" />
                        ) : (
                          <CircleSlash2Icon className="size-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-1 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{item.label}</span>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {item.code}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50 bg-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13.5px] font-bold">Usage Limits</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold">
                {plan.limits.length} Restrictions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {plan.limits.length === 0 ? (
              <p className="py-12 text-center text-[13px] text-muted-foreground italic">
                No limits defined for this plan.
              </p>
            ) : (
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--fom-border-subtle)]/50">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Metric</th>
                    <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fom-border-subtle)]/50">
                  {plan.limits.map((limit) => (
                    <tr key={limit.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{limit.label}</span>
                          <span className="text-[11px] text-muted-foreground font-medium capitalize">
                            {limit.code.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-foreground">
                          {limit.value === null ? "∞" : limit.value.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
