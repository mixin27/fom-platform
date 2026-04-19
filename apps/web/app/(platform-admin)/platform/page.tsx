import Link from "next/link"
import {
  CreditCard,
  LifeBuoy,
  ShieldAlert,
  Store,
  TrendingUp,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
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
      <AdminHeader
        title="Dashboard"
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
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Shops"
          value={String(dashboard.overview.total_shops)}
          detail={`${dashboard.overview.active_shops} active`}
          trend={{ value: `${dashboard.overview.overdue_invoices} overdue`, positive: dashboard.overview.overdue_invoices === 0 }}
          icon={Store}
        />
        <AdminStatCard
          label="Monthly Revenue"
          value={formatCompactNumber(dashboard.overview.monthly_recurring_revenue)}
          detail="Total MRR"
          trend={{ value: "MRR", neutral: true }}
          icon={CreditCard}
        />
        <AdminStatCard
          label="Projected ARR"
          value={formatCompactNumber(dashboard.overview.projected_arr)}
          detail="Annual projection"
          trend={{ value: "ARR", neutral: true }}
          icon={TrendingUp}
        />
        <AdminStatCard
          label="Support Issues"
          value={String(support.overview.open_items)}
          detail={`${support.overview.high_priority_items} high priority`}
          trend={{ value: "Open", positive: support.overview.open_items === 0 }}
          icon={LifeBuoy}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <DashboardRevenueChart data={dashboard.revenue_series} />
            <div className="grid gap-3 border-t border-[var(--fom-border-subtle)] pt-3 md:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Week
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[var(--fom-ink)]">
                  {formatCurrency(
                    dashboard.revenue_series.reduce(
                      (sum, entry) => sum + entry.amount,
                      0
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Revenue
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--fom-ink)]">
                  {formatCurrency(dashboard.overview.total_revenue)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Avg Orders/Shop
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--fom-ink)]">
                  {dashboard.health.average_orders_per_shop}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-4">
            {dashboard.attention_items.length > 0 ? (
              dashboard.attention_items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--fom-border-subtle)] bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <PlatformStatusBadge status={item.severity} label={item.severity} />
                    <p className="text-[13px] font-bold text-[var(--fom-ink)]">
                      {item.shop_name}
                    </p>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-[var(--fom-ink)]">
                    {item.title}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--fom-border-subtle)] p-4 text-center text-xs text-muted-foreground">
                Queue empty
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Plans</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            {dashboard.subscription_mix.map((plan) => (
              <div key={plan.plan_code} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-[var(--fom-ink)]">
                    {plan.plan_name}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {plan.shop_count} shops · {formatPercent(plan.share)}
                  </span>
                </div>
                <div className="h-[6px] rounded-full bg-muted overflow-hidden border border-[var(--fom-border-subtle)]">
                  <div
                    className="h-full bg-[var(--fom-accent)]"
                    style={{ width: `${Math.max(4, plan.share * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Renewals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-4">
            {subscriptions.upcoming_renewals.slice(0, 4).map((renewal) => (
              <div
                key={renewal.shop_id}
                className="flex items-center justify-between rounded-lg border border-[var(--fom-border-subtle)] bg-muted/20 px-3 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-bold text-[var(--fom-ink)]">
                    {renewal.shop_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {renewal.plan_name}
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-mono">
                  <p>{renewal.due_at ? formatDate(renewal.due_at) : "--"}</p>
                  <p className="font-bold text-foreground">
                    {renewal.amount ? formatCurrency(renewal.amount) : "—"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
            <CardTitle className="text-[13.5px] font-bold">Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-4">
            {[
              ["Active Shops", String(dashboard.health.active_shops)],
              [
                "Trials Expiring",
                String(dashboard.health.trials_expiring_this_week),
              ],
              [
                "Overdue Payments",
                String(dashboard.health.overdue_payments),
              ],
              [
                "Avg Orders / Shop",
                String(dashboard.health.average_orders_per_shop),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-[var(--fom-border-subtle)] bg-muted/20 px-3 py-2.5"
              >
                <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
                <span className="text-[12.5px] font-bold text-[var(--fom-ink)]">
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <AdminDataTable
        title="Recent Tenant Activity"
        data={dashboard.recent_shops}
        emptyMessage="No recent activity"
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (shop) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[var(--fom-ink)]">
                  {shop.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {shop.owner_name}
                  {shop.township ? ` · ${shop.township}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (shop) => <span className="font-medium">{shop.plan_name ?? "None"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (shop) => <PlatformStatusBadge status={shop.status} />,
          },
          {
            key: "orders",
            header: "Orders",
            render: (shop) => <span className="font-mono">{shop.total_orders.toLocaleString()}</span>,
          },
          {
            key: "revenue",
            header: "Revenue",
            render: (shop) => <span className="font-mono font-bold">{formatCurrency(shop.total_revenue)}</span>,
          },
          {
            key: "joined",
            header: "Joined",
            render: (shop) => <span className="text-muted-foreground">{formatDate(shop.joined_at)}</span>,
          },
          {
            key: "last_active",
            header: "Last active",
            render: (shop) => <span className="text-muted-foreground font-medium">{formatRelativeDate(shop.last_active_at)}</span>,
          },
        ]}
      />
    </div>
  )
}
