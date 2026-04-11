import { AlertTriangle, CheckCircle2, LifeBuoy, MessagesSquare } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformSupport } from "@/lib/platform/api"
import { formatRelativeDate } from "@/lib/platform/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default async function PlatformSupportPage() {
  const response = await getPlatformSupport()
  const data = response.data

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Support"
        title="Support queue and operational follow-up"
        description="This workspace tracks billing risk, renewals, onboarding gaps, and low-adoption tenants."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Open items"
          value={String(data.overview.open_items)}
          detail="Current support and operator tasks."
          delta={`${data.overview.high_priority_items} high priority`}
          icon={LifeBuoy}
          accent="sunset"
        />
        <DashboardStatCard
          title="Billing items"
          value={String(data.overview.billing_items)}
          detail="Invoices or payment follow-up issues."
          delta="Billing"
          icon={AlertTriangle}
          accent="ink"
        />
        <DashboardStatCard
          title="Onboarding items"
          value={String(data.overview.onboarding_items)}
          detail="New shops that may still need setup help."
          delta="Onboarding"
          icon={MessagesSquare}
          accent="teal"
        />
        <DashboardStatCard
          title="Active shops"
          value={String(data.health.active_shops)}
          detail={`${data.health.inactive_shops} inactive shops currently detected.`}
          delta={`${data.health.total_shops} total`}
          icon={CheckCircle2}
          accent="default"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformDataTable
          title="Current operator tasks"
          description="Open queue"
          rows={data.issues}
          emptyMessage="No open operator tasks right now."
          footer={`Showing ${data.issues.length} current issues`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (issue) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[var(--fom-ink)]">
                    {issue.shop_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{issue.kind}</span>
                </div>
              ),
            },
            {
              key: "title",
              header: "Issue",
              render: (issue) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[var(--fom-ink)]">
                    {issue.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {issue.detail}
                  </span>
                </div>
              ),
            },
            {
              key: "severity",
              header: "Severity",
              render: (issue) => (
                <PlatformStatusBadge status={issue.severity} label={issue.severity} />
              ),
            },
            {
              key: "when",
              header: "When",
              render: (issue) => formatRelativeDate(issue.occurred_at),
            },
          ]}
        />

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Platform health</CardDescription>
            <CardTitle>Current posture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            {[
              {
                label: "Active shops",
                value: `${data.health.active_shops} / ${data.health.total_shops}`,
              },
              {
                label: "Inactive shops",
                value: String(data.health.inactive_shops),
              },
              {
                label: "Overdue invoices",
                value: String(data.health.overdue_invoices),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl bg-[var(--fom-admin-surface)] px-3.5 py-3"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-[var(--fom-ink)]">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <PlatformDataTable
        title="Recent tenant activity"
        description="Activity snapshot"
        rows={data.recent_activity}
        emptyMessage="No recent tenant activity."
        footer={`Showing ${data.recent_activity.length} tenant activity rows`}
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (row) => row.shop_name,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <PlatformStatusBadge status={row.status} />,
          },
          {
            key: "orders",
            header: "Orders",
            render: (row) => row.total_orders.toLocaleString(),
          },
          {
            key: "last_active",
            header: "Last active",
            render: (row) => formatRelativeDate(row.last_active_at),
          },
        ]}
      />
    </div>
  )
}
