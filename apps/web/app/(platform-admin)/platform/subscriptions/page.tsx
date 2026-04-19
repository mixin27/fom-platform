import Link from "next/link"
import { CreditCard, Receipt, TrendingUp, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformSubscriptions } from "@/lib/platform/api"
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
} from "@/lib/platform/format"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { PlatformInvoiceHistoryTable } from "./_components/platform-invoice-history-table"
import { PlatformSubscriptionsTable } from "./_components/platform-subscriptions-table"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type PlatformSubscriptionsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformSubscriptionsPage({
  searchParams,
}: PlatformSubscriptionsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformSubscriptions(params)
  const data = response.data

  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(
    getSingleSearchParam(params.limit) ?? data.invoices_pagination.limit ?? 20
  )
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Subscriptions"
        title="Subscriptions"
        description="Review recurring revenue, invoices, renewals, and the current plan mix from one route."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/shops">View shops</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="MRR"
          value={formatCompactNumber(data.overview.monthly_recurring_revenue)}
          detail="Current monthly recurring revenue from active subscriptions."
          delta={formatCurrency(data.overview.monthly_recurring_revenue)}
          icon={WalletCards}
          accent="sunset"
        />
        <DashboardStatCard
          title="Projected ARR"
          value={formatCompactNumber(data.overview.projected_arr)}
          detail="Annualized from active monthly subscriptions."
          delta={formatCurrency(data.overview.projected_arr)}
          icon={TrendingUp}
          accent="teal"
        />
        <DashboardStatCard
          title="Yearly plan revenue"
          value={formatCompactNumber(data.overview.yearly_plan_revenue)}
          detail="Collected revenue from yearly contracts."
          delta={formatCurrency(data.overview.yearly_plan_revenue)}
          icon={CreditCard}
          accent="ink"
        />
        <DashboardStatCard
          title="Paid invoices"
          value={String(data.overview.paid_invoices)}
          detail={`${data.overview.overdue_invoices} overdue invoices need follow-up.`}
          delta={`${data.invoices_pagination.total} total invoices`}
          icon={Receipt}
          accent="default"
        />
      </div>

      {data.overdue_notice ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{data.overdue_notice.shop_name}</span>{" "}
          has an overdue invoice of{" "}
          <span className="font-semibold">
            {formatCurrency(
              data.overdue_notice.amount,
              data.overdue_notice.currency
            )}
          </span>
          {data.overdue_notice.due_at
            ? ` since ${formatDate(data.overdue_notice.due_at)}.`
            : "."}
        </div>
      ) : null}

      <PlatformSubscriptionsTable
        rows={data.subscriptions}
        plans={data.available_plans}
      />

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <PlatformInvoiceHistoryTable
          rows={data.invoices}
          subscriptions={data.subscriptions}
          pagination={data.invoices_pagination}
          paginationLinks={{
            previousHref: previousCursor
              ? buildQueryHref("/platform/subscriptions", params, {
                  cursor: previousCursor,
                })
              : currentCursor
                ? buildQueryHref("/platform/subscriptions", params, {
                    cursor: null,
                  })
                : null,
            nextHref: data.invoices_pagination.next_cursor
              ? buildQueryHref("/platform/subscriptions", params, {
                  cursor: data.invoices_pagination.next_cursor,
                })
              : null,
          }}
          initialFilters={{
            search,
            status,
            limit,
          }}
        />

        <div className="flex flex-col gap-3">
          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Upcoming renewals</CardDescription>
              <CardTitle>What is due next</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 pt-0">
              {data.upcoming_renewals.length > 0 ? (
                data.upcoming_renewals.map((renewal) => (
                  <div
                    key={renewal.shop_id}
                    className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--fom-ink)]">
                          {renewal.shop_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {renewal.plan_name ?? "Plan"} · due{" "}
                          {formatDate(renewal.due_at)}
                        </p>
                      </div>
                      <PlatformStatusBadge status={renewal.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {renewal.amount !== null
                        ? formatCurrency(
                            renewal.amount ?? undefined,
                            renewal.currency ?? undefined
                          )
                        : "No charge"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                  No renewals due in the next 30 days.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Plan mix</CardDescription>
              <CardTitle>Current catalog usage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {data.plans.map((plan) => (
                <div
                  key={plan.plan_code}
                  className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--fom-ink)]">
                      {plan.plan_name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {plan.shop_count} shops
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.billing_period}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Collected {formatCurrency(plan.collected_revenue)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
