import Link from "next/link"
import {
  CreditCard,
  LifeBuoy,
  ShieldAlert,
  Store,
  TrendingUp,
} from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { DashboardRevenueChart } from "./_components/dashboard-revenue-chart"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getPlatformDashboard,
  getPlatformSubscriptions,
  getPlatformSupport,
} from "@/lib/platform/api"
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatPercent,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default async function PlatformHomePage() {
  const [dashboardResponse, subscriptionsResponse, supportResponse] =
    await Promise.all([
      getPlatformDashboard(),
      getPlatformSubscriptions({ limit: "5" }),
      getPlatformSupport(),
    ])
  const dashboard = dashboardResponse.data
  const subscriptions = subscriptionsResponse.data
  const support = supportResponse.data

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Dashboard"
        title="Operate the platform from one dense workspace"
        description="Track tenant growth, recurring revenue, support pressure, renewals, and the next operator actions from one internal dashboard."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/shops">Shops</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/users">Users</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/subscriptions">Subscriptions</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/support">Support</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total registered shops"
          value={String(dashboard.overview.total_shops)}
          detail={`${dashboard.overview.active_shops} active, ${dashboard.overview.trial_shops} trial or expiring`}
          delta={`${dashboard.overview.overdue_invoices} overdue`}
          icon={Store}
          accent="sunset"
        />
        <DashboardStatCard
          title="MRR"
          value={formatCompactNumber(dashboard.overview.monthly_recurring_revenue)}
          detail="Current monthly recurring revenue from active plans."
          delta={formatCurrency(dashboard.overview.monthly_recurring_revenue)}
          icon={CreditCard}
          accent="teal"
        />
        <DashboardStatCard
          title="Projected ARR"
          value={formatCompactNumber(dashboard.overview.projected_arr)}
          detail="Annualized from current monthly subscriptions."
          delta={formatCurrency(dashboard.overview.projected_arr)}
          icon={TrendingUp}
          accent="ink"
        />
        <DashboardStatCard
          title="Open support queue"
          value={String(support.overview.open_items)}
          detail={`${support.overview.high_priority_items} high-priority issues currently active.`}
          delta={`${support.overview.billing_items} billing related`}
          icon={LifeBuoy}
          accent="default"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Revenue overview</CardDescription>
            <CardTitle>Collected invoice revenue this week</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <DashboardRevenueChart data={dashboard.revenue_series} />
            <div className="grid gap-3 border-t border-[var(--fom-border-subtle)] pt-3 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                  This week
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[var(--fom-ink)]">
                  {formatCurrency(
                    dashboard.revenue_series.reduce(
                      (sum, entry) => sum + entry.amount,
                      0
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                  Delivered revenue
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--fom-ink)]">
                  {formatCurrency(dashboard.overview.total_revenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                  Avg orders / shop
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--fom-ink)]">
                  {dashboard.health.average_orders_per_shop}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>What needs attention</CardDescription>
            <CardTitle>Operator queue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            {dashboard.attention_items.length > 0 ? (
              dashboard.attention_items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <PlatformStatusBadge status={item.severity} label={item.severity} />
                    <p className="text-sm font-semibold text-[var(--fom-ink)]">
                      {item.shop_name}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--fom-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                No urgent support items right now.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Plan breakdown</CardDescription>
            <CardTitle>Subscription mix</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {dashboard.subscription_mix.map((plan) => (
              <div key={plan.plan_code} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--fom-ink)]">
                    {plan.plan_name}
                  </span>
                  <span className="text-muted-foreground">
                    {plan.shop_count} shops · {formatPercent(plan.share)}
                  </span>
                </div>
                <div className="h-[6px] rounded-full bg-[var(--fom-border-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--fom-orange)]"
                    style={{ width: `${Math.max(8, plan.share * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Billing pressure</CardDescription>
            <CardTitle>Renewals and overdue risk</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            {subscriptions.overdue_notice ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <p className="text-xs font-semibold tracking-[0.08em] uppercase text-red-700">
                  Overdue invoice
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--fom-ink)]">
                  {subscriptions.overdue_notice.shop_name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscriptions.overdue_notice.invoice_no} ·{" "}
                  {formatCurrency(subscriptions.overdue_notice.amount)}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                No overdue invoice is currently leading the queue.
              </div>
            )}

            {subscriptions.upcoming_renewals.slice(0, 3).map((renewal) => (
              <div
                key={renewal.shop_id}
                className="flex items-center justify-between rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--fom-ink)]">
                    {renewal.shop_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {renewal.plan_name ?? "No plan"} · {renewal.status}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{renewal.due_at ? formatDate(renewal.due_at) : "No due date"}</p>
                  <p>{renewal.amount ? formatCurrency(renewal.amount) : "—"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Platform health</CardDescription>
            <CardTitle>Operational summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            {[
              ["Active shops", String(dashboard.health.active_shops)],
              [
                "Trials expiring",
                `${dashboard.health.trials_expiring_this_week} this week`,
              ],
              [
                "Overdue payments",
                `${dashboard.health.overdue_payments} invoice${
                  dashboard.health.overdue_payments === 1 ? "" : "s"
                }`,
              ],
              [
                "Avg orders / shop",
                String(dashboard.health.average_orders_per_shop),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-[var(--fom-ink)]">
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <PlatformDataTable
          title="Upcoming renewals"
          description="Billing horizon"
          rows={subscriptions.upcoming_renewals.slice(0, 6)}
          emptyMessage="No renewals are currently approaching."
          footer={`Showing ${Math.min(subscriptions.upcoming_renewals.length, 6)} upcoming renewals`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (renewal) => renewal.shop_name,
            },
            {
              key: "plan",
              header: "Plan",
              render: (renewal) => renewal.plan_name ?? "—",
            },
            {
              key: "due",
              header: "Due",
              render: (renewal) => formatDate(renewal.due_at),
            },
            {
              key: "amount",
              header: "Amount",
              render: (renewal) =>
                renewal.amount ? formatCurrency(renewal.amount) : "—",
            },
          ]}
        />

        <PlatformDataTable
          title="Support queue"
          description="Latest operator workflow"
          rows={support.issues.slice(0, 6)}
          emptyMessage="No support issues are open."
          footer={`Showing ${Math.min(support.issues.length, 6)} support issues`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (issue) => issue.shop_name,
            },
            {
              key: "issue",
              header: "Issue",
              render: (issue) => issue.title,
            },
            {
              key: "severity",
              header: "Severity",
              render: (issue) => <PlatformStatusBadge status={issue.severity} />,
            },
            {
              key: "status",
              header: "Status",
              render: (issue) => <PlatformStatusBadge status={issue.status} />,
            },
          ]}
        />
      </div>

      <PlatformDataTable
        title="Latest sign-ups and tenant activity"
        description="Recent shops"
        rows={dashboard.recent_shops}
        emptyMessage="No shops found yet."
        footer={`Showing ${dashboard.recent_shops.length} recent shops`}
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (shop) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--fom-ink)]">
                  {shop.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shop.owner_name}
                  {shop.township ? ` · ${shop.township}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (shop) => shop.plan_name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (shop) => <PlatformStatusBadge status={shop.status} />,
          },
          {
            key: "orders",
            header: "Orders",
            render: (shop) => shop.total_orders.toLocaleString(),
          },
          {
            key: "revenue",
            header: "Revenue",
            render: (shop) => formatCurrency(shop.total_revenue),
          },
          {
            key: "joined",
            header: "Joined",
            render: (shop) => formatDate(shop.joined_at),
          },
          {
            key: "last_active",
            header: "Last active",
            render: (shop) => formatRelativeDate(shop.last_active_at),
          },
        ]}
      />
    </div>
  )
}
