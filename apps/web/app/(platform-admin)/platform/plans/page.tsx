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

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
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
      <PageIntro
        eyebrow="Plans"
        title="Manage subscription plans"
        description="Control pricing, public plan visibility, and the feature-item matrix that drives runtime subscription enforcement."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/subscriptions">Subscriptions</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/settings">Settings</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Total plans"
          value={String(plans.length)}
          detail={`${activePlans} active and visible on current pricing surfaces.`}
          delta="Commercial catalog"
          icon={WalletCards}
          accent="sunset"
        />
        <DashboardStatCard
          title="Available items"
          value={String(availableItems)}
          detail="Feature rows currently enabled across the catalog."
          delta="Runtime allowed"
          icon={BadgeCheck}
          accent="teal"
        />
        <DashboardStatCard
          title="Unavailable items"
          value={String(unavailableItems)}
          detail="Future or upgrade-only items kept visible but disabled."
          delta="Reserved capacity"
          icon={CircleSlash2}
          accent="ink"
        />
      </section>

      <PlatformDataTable
        title="Plan catalog"
        description="Review pricing, feature posture, and quota restrictions."
        rows={plans}
        emptyMessage="No subscription plans are configured yet."
        footer={`Showing ${plans.length} plan${plans.length === 1 ? "" : "s"}`}
        toolbar={
          <Button asChild size="sm">
            <Link href="/platform/plans/new">
              <PlusIcon data-icon="inline-start" />
              New plan
            </Link>
          </Button>
        }
        columns={[
          {
            key: "plan",
            header: "Plan",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  <Badge variant={plan.is_active ? "secondary" : "outline"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
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
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(plan.price, plan.currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.billing_period} · sort {plan.sort_order}
                </span>
              </div>
            ),
          },
          {
            key: "features",
            header: "Features",
            render: (plan) => {
              const numAvailableItems = plan.items.filter(
                (item) => item.availability_status === "available"
              ).length
              const numUnavailableItems = plan.items.filter(
                (item) => item.availability_status === "unavailable"
              ).length

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <BadgeCheckIcon className="size-4 text-emerald-600" />
                    <span>{numAvailableItems} enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CircleSlash2Icon className="size-3.5" />
                    <span>{numUnavailableItems} unavailable</span>
                  </div>
                </div>
              )
            },
          },
          {
            key: "usage",
            header: "Usage",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {plan.shop_count} subscribed shop{plan.shop_count === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Revenue {formatCurrency(plan.collected_revenue, plan.currency)}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-[110px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (plan) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/plans/${plan.code}`}>
                  <EyeIcon data-icon="inline-start" />
                  View
                </Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
