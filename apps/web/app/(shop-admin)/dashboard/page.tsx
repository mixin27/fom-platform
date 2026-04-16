import Link from "next/link"
import {
  ArrowRight,
  PackageCheck,
  Truck,
  TrendingUp,
  Users,
} from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopDailySummary,
  getShopDeliveries,
  getShopPortalContext,
} from "@/lib/shop/api"
import { formatCodeLabel } from "@/lib/shop/format"
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatRelativeDate,
} from "@/lib/platform/format"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type ShopDashboardPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopDashboardPage({
  searchParams,
}: ShopDashboardPageProps) {
  const params = (await searchParams) ?? {}
  const date = getSingleSearchParam(params.date)
  const [{ activeShop }, summaryResponse, deliveriesResponse] =
    await Promise.all([
      getShopPortalContext(),
      getShopDailySummary(date ? { date } : undefined, "/dashboard"),
      getShopDeliveries(
        { limit: "5", status: "out_for_delivery" },
        "/dashboard"
      ),
    ])
  const summary = summaryResponse.data
  const deliveries = deliveriesResponse.data
  const isSummaryForbidden = summaryResponse.meta?.forbidden === true

  if (isSummaryForbidden || !summary) {
    return (
      <div className="flex flex-col gap-6">
        <PageIntro
          eyebrow="Dashboard"
          title={`Welcome back to ${activeShop.name}`}
          description="Your operational command center. Connect your order flow, dispatch progress, and customer momentum in one place."
          actions={
            <Button
              asChild
              size="sm"
              className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
            >
              <Link href="/dashboard/orders">
                View orders
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
        />

        <Card className="border-2 border-dashed border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">
              Reports & Analytics Restricted
            </CardTitle>
            <CardDescription className="text-base">
              {(summaryResponse.meta?.message as string) ??
                "Insights and daily summaries are available on paid plans."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Upgrade your subscription to unlock automated daily reporting,
              revenue tracking, and customer analytics.
            </p>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/dashboard/settings/billing">Upgrade now</Link>
            </Button>
          </CardContent>
        </Card>

        {deliveries.length > 0 && (
          <section className="grid gap-3">
            <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
              <CardHeader className="pb-3">
                <CardDescription>Dispatch board</CardDescription>
                <CardTitle>Orders currently on route</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {delivery.order.order_no}
                      </p>
                      <PlatformStatusBadge status={delivery.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {delivery.order.customer.name} · Driver:{" "}
                      {delivery.driver.name}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    )
  }

  const deliveryRate = summary.delivered_rate / 100
  const topProduct = summary.top_products[0]

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Dashboard"
        title={`Run ${activeShop.name} from one operational workspace`}
        description="Revenue, order flow, customer momentum, and dispatch progress stay visible without jumping between sections."
        actions={
          <Button
            asChild
            size="sm"
            className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
          >
            <Link href="/dashboard/orders">
              View orders
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <PlatformStatusBadge
          status="active"
          label={formatDate(summary.summary_date)}
        />
        <PlatformStatusBadge
          status="confirmed"
          label={`${summary.total_orders} orders in focus`}
        />
        <PlatformStatusBadge
          status="out_for_delivery"
          label={`${deliveries.length} active deliveries`}
        />
        {topProduct ? (
          <PlatformStatusBadge
            status="active"
            label={`Top product: ${topProduct.product_name}`}
          />
        ) : null}
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Daily revenue"
          value={formatCurrency(summary.total_revenue)}
          detail={`Average order value ${formatCurrency(summary.average_order_value)}.`}
          delta={`${summary.revenue_delta_vs_previous_day >= 0 ? "+" : ""}${formatCurrency(summary.revenue_delta_vs_previous_day)}`}
          icon={TrendingUp}
          accent="sunset"
        />
        <DashboardStatCard
          title="Orders created"
          value={String(summary.total_orders)}
          detail={`${summary.pending_count} still pending action.`}
          delta={`${summary.delivered_count} delivered`}
          icon={PackageCheck}
          accent="teal"
        />
        <DashboardStatCard
          title="Customers touched"
          value={String(summary.customer_count)}
          detail="Distinct customers with orders in the current summary window."
          delta={`${summary.top_customers.length} top buyers`}
          icon={Users}
          accent="ink"
        />
        <DashboardStatCard
          title="Delivered rate"
          value={formatPercent(deliveryRate)}
          detail="Delivered orders as a share of today’s order volume."
          delta={`${summary.status_breakdown.out_for_delivery} out for delivery`}
          icon={Truck}
          accent="default"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Today's pipeline</CardDescription>
            <CardTitle>Order movement by status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              {
                key: "new",
                count: summary.status_breakdown.new,
                note: "Needs confirmation or customer follow-up.",
              },
              {
                key: "confirmed",
                count: summary.status_breakdown.confirmed,
                note: "Ready for packing, rider assignment, or dispatch.",
              },
              {
                key: "out_for_delivery",
                count: summary.status_breakdown.out_for_delivery,
                note: "Currently assigned to a rider or in transit.",
              },
              {
                key: "delivered",
                count: summary.status_breakdown.delivered,
                note: "Already landed in collected revenue.",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCodeLabel(item.key)}
                  </p>
                  <PlatformStatusBadge status={item.key} />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {item.count}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Top customers</CardDescription>
            <CardTitle>Who is buying most often</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {summary.top_customers.length > 0 ? (
              summary.top_customers.slice(0, 4).map((customer) => (
                <div
                  key={customer.customer_id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {customer.customer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.order_count} orders
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(customer.total_spent)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3 text-sm text-muted-foreground">
                No repeat-customer data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <PlatformDataTable
          title="Recent orders"
          description="Latest shop activity"
          rows={summary.recent_orders}
          emptyMessage="No orders have been created yet."
          footer={`Showing ${summary.recent_orders.length} recent orders`}
          columns={[
            {
              key: "order",
              header: "Order",
              render: (order) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">
                    {order.order_no}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(order.created_at)}
                  </span>
                </div>
              ),
            },
            {
              key: "customer",
              header: "Customer",
              render: (order) => (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {order.customer_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.product_name}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (order) => <PlatformStatusBadge status={order.status} />,
            },
            {
              key: "amount",
              header: "Amount",
              render: (order) => formatCurrency(order.total_price),
            },
          ]}
        />

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Dispatch board</CardDescription>
            <CardTitle>Orders currently on route</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {delivery.order.order_no}
                    </p>
                    <PlatformStatusBadge status={delivery.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {delivery.order.customer.name}
                    {delivery.order.customer.township
                      ? ` · ${delivery.order.customer.township}`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Driver: {delivery.driver.name}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3 text-sm text-muted-foreground">
                No deliveries are currently out for delivery.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
