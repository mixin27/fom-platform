import Link from "next/link"
import { BadgeCheck, CircleSlash2, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformPlanCatalogWorkspace } from "../_components/platform-plan-catalog-workspace"
import { getPlatformSettings } from "@/lib/platform/api"
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

      <PlatformPlanCatalogWorkspace plans={plans} />
    </div>
  )
}
