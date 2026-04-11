import { BarChart3, CalendarRange, NotebookTabs } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import {
  getShopDailySummary,
  getShopMonthlyReport,
  getShopWeeklyReport,
} from "@/lib/shop/api"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type ReportsPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {}
  const date = getSingleSearchParam(params.date) ?? ""
  const month = getSingleSearchParam(params.month) ?? ""
  const currentHref = `/dashboard/reports${date || month ? `?${new URLSearchParams({
    ...(date ? { date } : {}),
    ...(month ? { month } : {}),
  }).toString()}` : ""}`
  const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
    getShopDailySummary(date ? { date } : undefined, currentHref),
    getShopWeeklyReport(date ? { date } : undefined, currentHref),
    getShopMonthlyReport(month ? { month } : undefined, currentHref),
  ])
  const daily = dailyResponse.data
  const weekly = weeklyResponse.data
  const monthly = monthlyResponse.data

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Reports"
        title="Daily, weekly, and monthly summaries"
        description="Use the summary views to compare operating rhythm, delivery performance, and revenue contribution across time windows."
        actions={
          <form method="GET" className="flex flex-wrap gap-2">
            <Input name="date" type="date" defaultValue={date} className="h-9" />
            <Input
              name="month"
              type="month"
              defaultValue={month}
              className="h-9"
            />
            <Button type="submit" size="sm" variant="outline">
              Refresh
            </Button>
          </form>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Daily summary"
          value={formatCurrency(daily.total_revenue)}
          detail={`${daily.total_orders} orders on ${formatDate(daily.summary_date)}.`}
          delta={`${daily.delivered_count} delivered`}
          icon={NotebookTabs}
          accent="sunset"
        />
        <DashboardStatCard
          title="Weekly trend"
          value={`${weekly.revenue_delta_vs_previous_period >= 0 ? "+" : ""}${formatCurrency(weekly.revenue_delta_vs_previous_period)}`}
          detail={`${weekly.total_orders} orders in ${weekly.period_label}.`}
          delta={formatPercent(weekly.delivered_rate / 100)}
          icon={CalendarRange}
          accent="teal"
        />
        <DashboardStatCard
          title="Monthly view"
          value={formatCurrency(monthly.total_revenue)}
          detail={`${monthly.total_orders} orders in ${monthly.period_label}.`}
          delta={formatPercent(monthly.delivered_rate / 100)}
          icon={BarChart3}
          accent="ink"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {[
          {
            title: "Daily",
            description: formatDate(daily.summary_date),
            stats: [
              ["Orders", daily.total_orders.toLocaleString()],
              ["Customers", daily.customer_count.toLocaleString()],
              ["Average order", formatCurrency(daily.average_order_value)],
              ["Delivered rate", formatPercent(daily.delivered_rate / 100)],
            ],
          },
          {
            title: "Weekly",
            description: weekly.period_label,
            stats: [
              ["Orders", weekly.total_orders.toLocaleString()],
              ["Revenue", formatCurrency(weekly.total_revenue)],
              ["Pending", weekly.pending_count.toLocaleString()],
              ["Delivered rate", formatPercent(weekly.delivered_rate / 100)],
            ],
          },
          {
            title: "Monthly",
            description: monthly.period_label,
            stats: [
              ["Orders", monthly.total_orders.toLocaleString()],
              ["Revenue", formatCurrency(monthly.total_revenue)],
              ["Customers", monthly.customer_count.toLocaleString()],
              ["Average order", formatCurrency(monthly.average_order_value)],
            ],
          },
        ].map((section) => (
          <Card key={section.title} className="border border-black/6 bg-white shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>{section.description}</CardDescription>
              <CardTitle>{section.title} snapshot</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 pt-0">
              {section.stats.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-[#f7f8fc] px-3.5 py-3"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <PlatformDataTable
          title="Top products"
          description="Monthly product contribution"
          rows={monthly.top_products}
          emptyMessage="No monthly product data yet."
          footer={`Showing ${monthly.top_products.length} products`}
          columns={[
            {
              key: "product",
              header: "Product",
              render: (product) => product.product_name,
            },
            {
              key: "qty",
              header: "Qty sold",
              render: (product) => product.qty_sold.toLocaleString(),
            },
            {
              key: "revenue",
              header: "Revenue",
              render: (product) => formatCurrency(product.revenue),
            },
          ]}
        />

        <PlatformDataTable
          title="Top customers"
          description="Weekly repeat buyers"
          rows={weekly.top_customers}
          emptyMessage="No weekly customer data yet."
          footer={`Showing ${weekly.top_customers.length} customers`}
          columns={[
            {
              key: "customer",
              header: "Customer",
              render: (customer) => customer.customer_name,
            },
            {
              key: "orders",
              header: "Orders",
              render: (customer) => customer.order_count.toLocaleString(),
            },
            {
              key: "spend",
              header: "Spend",
              render: (customer) => formatCurrency(customer.total_spent),
            },
          ]}
        />
      </div>

      <PlatformDataTable
        title="Daily recent orders"
        description="Most recent daily activity"
        rows={daily.recent_orders}
        emptyMessage="No daily orders available."
        footer={`Showing ${daily.recent_orders.length} recent orders`}
        columns={[
          {
            key: "order",
            header: "Order",
            render: (order) => order.order_no,
          },
          {
            key: "customer",
            header: "Customer",
            render: (order) => order.customer_name,
          },
          {
            key: "product",
            header: "Product",
            render: (order) => order.product_name,
          },
          {
            key: "amount",
            header: "Amount",
            render: (order) => formatCurrency(order.total_price),
          },
        ]}
      />
    </div>
  )
}
