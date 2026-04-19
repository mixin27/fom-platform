import Link from "next/link"
import {
  BadgeCheck,
  CircleSlash2,
  WalletCards,
  PlusIcon,
  BadgeCheckIcon,
  CircleSlash2Icon,
  EyeIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
import { formatCurrency } from "@/lib/platform/format"
import { getPlatformSettings } from "@/lib/platform/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function PlatformPlansPage() {
  const response = await getPlatformSettings()
  const plans = [...response.data.plans].sort(
    (left, right) =>
      left.sort_order - right.sort_order || left.name.localeCompare(right.name)
  )

  const activePlans = plans.filter((plan) => plan.is_active).length
  const availableItems = plans.reduce(
    (sum, plan) =>
      sum +
      plan.items.filter((item) => item.availability_status === "available").length,
    0
  )
  const unavailableItems = plans.reduce(
    (sum, plan) =>
      sum +
      plan.items.filter((item) => item.availability_status === "unavailable")
        .length,
    0
  )

  return (
    <div className="flex flex-col gap-4">
      <AdminHeader
        title="Subscription Plans"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/subscriptions">Invoices</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/platform/plans/new">
                <PlusIcon data-icon="inline-start" />
                New Plan
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <AdminStatCard
          label="Total Plans"
          value={String(plans.length)}
          detail={`${activePlans} active plans`}
          icon={WalletCards}
        />
        <AdminStatCard
          label="Active Features"
          value={String(availableItems)}
          detail="Enabled components"
          icon={BadgeCheck}
          trend={{ value: "Operational", positive: true }}
        />
        <AdminStatCard
          label="Future Features"
          value={String(unavailableItems)}
          detail="Pending activation"
          icon={CircleSlash2}
          trend={{ value: "Reserved", neutral: true }}
        />
      </section>

      <AdminDataTable
        title="Plan Catalog"
        data={plans}
        emptyMessage="No subscription plans found."
        columns={[
          {
            key: "plan",
            header: "Plan",
            render: (plan) => (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{plan.name}</span>
                  {!plan.is_active && (
                    <Badge variant="outline" className="text-[10px] uppercase h-4 px-1">
                      Draft
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {plan.code}
                  {plan.description ? ` · ${plan.description}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "billing",
            header: "Billing",
            render: (plan) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {formatCurrency(plan.price, plan.currency)}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  {plan.billing_period}
                </span>
              </div>
            ),
          },
          {
            key: "features",
            header: "Health",
            render: (plan) => {
              const numAvailableItems = plan.items.filter(
                (item) => item.availability_status === "available"
              ).length

              return (
                <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <BadgeCheckIcon className="size-3.5 text-emerald-600" />
                  <span>{numAvailableItems} active features</span>
                </div>
              )
            },
          },
          {
            key: "usage",
            header: "Population",
            render: (plan) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {plan.shop_count} shops
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {formatCurrency(plan.collected_revenue, plan.currency)} total
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (plan) => (
              <div className="flex justify-end">
                <Button asChild size="xs" variant="ghost" className="h-8 px-2 font-bold text-[var(--fom-accent)]">
                  <Link href={`/platform/plans/${plan.code}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
