import Link from "next/link"
import {
  ArrowRight,
  Building2,
  LifeBuoy,
  Store,
  TrendingUp,
} from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getEnterpriseWorkspace } from "@/lib/enterprise/api"
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  buildQueryHref,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import { WorkspaceShopActions } from "./_components/workspace-shop-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const workspaceStatuses = [
  "all",
  "active",
  "trial",
  "expiring",
  "overdue",
  "inactive",
] as const

type WorkspacePageProps = {
  searchParams?: Promise<ShopSearchParams>
}

function getWorkspaceStatus(value: string | undefined) {
  return workspaceStatuses.includes(value as (typeof workspaceStatuses)[number])
    ? (value as (typeof workspaceStatuses)[number])
    : "all"
}

export default async function EnterpriseWorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const params = (await searchParams) ?? {}
  const status = getWorkspaceStatus(getSingleSearchParam(params.status))
  const shopId = getSingleSearchParam(params.shop_id)?.trim() || undefined
  const workspaceResponse = await getEnterpriseWorkspace(
    {
      ...(status !== "all" ? { status } : {}),
      ...(shopId ? { shop_id: shopId } : {}),
    },
    "/dashboard/workspace"
  )
  const workspace = workspaceResponse.data
  const deliveredRate =
    workspace.overview.total_orders > 0
      ? workspace.overview.delivered_orders / workspace.overview.total_orders
      : 0
  const lockMessage =
    workspace.entitlements.multi_shop_enabled
      ? null
      : workspace.entitlements.eligible_shop_count === 0
        ? "None of the accessible shops currently include the multi-shop enterprise feature. Assign an enterprise-ready plan to the shops you want to operate together."
        : "Only one accessible shop is enterprise-ready right now. The cross-shop shell is prepared, but a second eligible shop is still required for a real multi-shop workspace."

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Enterprise workspace"
        title="See multiple shops from one cross-shop control surface"
        description="Aggregate shop posture, recent order movement, and enterprise entitlements without switching one shop at a time."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/staffs">Governance</Link>
            </Button>
            <Button asChild size="sm" className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
              <Link href="/dashboard/orders">
                Open orders
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <PlatformStatusBadge
          status={workspace.entitlements.multi_shop_enabled ? "active" : "pending"}
          label={`${workspace.entitlements.eligible_shop_count} enterprise-ready shop${workspace.entitlements.eligible_shop_count === 1 ? "" : "s"}`}
        />
        <PlatformStatusBadge
          status={workspace.entitlements.analytics_enabled ? "active" : "inactive"}
          label={
            workspace.entitlements.analytics_enabled
              ? "Advanced analytics ready"
              : "Standard analytics only"
          }
        />
        <PlatformStatusBadge
          status={workspace.entitlements.priority_support_enabled ? "active" : "inactive"}
          label={
            workspace.entitlements.priority_support_enabled
              ? "Priority support ready"
              : "Standard support"
          }
        />
        <PlatformStatusBadge
          status={workspace.entitlements.locked_shop_count > 0 ? "pending" : "active"}
          label={`${workspace.entitlements.locked_shop_count} locked shop${workspace.entitlements.locked_shop_count === 1 ? "" : "s"}`}
        />
      </div>

      {lockMessage ? (
        <Card className="border border-amber-200 bg-amber-50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Workspace readiness</CardDescription>
            <CardTitle>Enterprise access is not fully enabled yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-[var(--fom-ink)]">
            <p>{lockMessage}</p>
            <p className="text-muted-foreground">
              Accessible shops: {workspace.overview.accessible_shops}. Locked by plan:{" "}
              {workspace.entitlements.locked_shop_count}.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Selected shops"
          value={String(workspace.overview.selected_shops)}
          detail={`${workspace.overview.accessible_shops} accessible in the current operator account.`}
          delta={`${workspace.entitlements.eligible_shop_count} enterprise-ready`}
          icon={Store}
          accent="sunset"
        />
        <DashboardStatCard
          title="Delivered revenue"
          value={formatCurrency(workspace.overview.total_revenue)}
          detail="Revenue is based on delivered orders inside the selected enterprise scope."
          delta={formatCurrency(workspace.overview.average_order_value)}
          icon={TrendingUp}
          accent="teal"
        />
        <DashboardStatCard
          title="Delivered rate"
          value={formatPercent(deliveredRate)}
          detail={`${workspace.overview.delivered_orders} delivered of ${workspace.overview.total_orders} total orders.`}
          delta={`${workspace.overview.customer_count} customers`}
          icon={Building2}
          accent="ink"
        />
        <DashboardStatCard
          title="Support posture"
          value={workspace.entitlements.priority_support_enabled ? "Priority" : "Standard"}
          detail="Priority support follows the plans attached to the enterprise-ready shops."
          delta={
            workspace.entitlements.analytics_enabled
              ? "Analytics enabled"
              : "Analytics locked"
          }
          icon={LifeBuoy}
          accent="default"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Filters</CardDescription>
            <CardTitle>Scope this enterprise view</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {workspaceStatuses.map((option) => (
                <Button
                  key={option}
                  asChild
                  size="sm"
                  variant={status === option ? "default" : "outline"}
                  className={
                    status === option
                      ? "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                      : undefined
                  }
                >
                  <Link
                    href={buildQueryHref("/dashboard/workspace", params, {
                      status: option === "all" ? null : option,
                    })}
                  >
                    {option === "all" ? "All statuses" : option.replace(/_/g, " ")}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                variant={!workspace.filters.shop_id ? "default" : "outline"}
                className={
                  !workspace.filters.shop_id
                    ? "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                    : undefined
                }
              >
                <Link
                  href={buildQueryHref("/dashboard/workspace", params, {
                    shop_id: null,
                  })}
                >
                  All enterprise-ready shops
                </Link>
              </Button>
              {workspace.shop_options.map((shop) => (
                <Button
                  key={shop.id}
                  asChild
                  size="sm"
                  variant={workspace.filters.shop_id === shop.id ? "default" : "outline"}
                  className={
                    workspace.filters.shop_id === shop.id
                      ? "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                      : undefined
                  }
                >
                  <Link
                    href={buildQueryHref("/dashboard/workspace", params, {
                      shop_id: shop.id,
                    })}
                  >
                    {shop.name}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Workspace shell
                </p>
                <p className="mt-2 text-sm text-foreground">
                  This route stays available even before every selected shop is on an enterprise plan.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Governance first
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Cross-shop control is paired with custom roles and audit logging so access stays explicit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <PlatformDataTable
          title="Accessible shop posture"
          description="Every shop currently visible to this operator"
          rows={workspace.shop_options}
          emptyMessage="No shops match the current workspace filters."
          footer={`Showing ${workspace.shop_options.length} shop records`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (shop) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{shop.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {shop.owner_name}
                    {shop.owner_email ? ` · ${shop.owner_email}` : ""}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (shop) => <PlatformStatusBadge status={shop.status} />,
            },
            {
              key: "plan",
              header: "Plan",
              render: (shop) => shop.plan_name ?? "No plan",
            },
            {
              key: "orders",
              header: "Orders",
              render: (shop) => `${shop.total_orders}`,
            },
            {
              key: "revenue",
              header: "Revenue",
              render: (shop) => formatCurrency(shop.total_revenue),
            },
            {
              key: "enterprise",
              header: "Entitlements",
              render: (shop) => (
                <div className="flex flex-wrap gap-1.5">
                  <PlatformStatusBadge
                    status={shop.enterprise_enabled ? "active" : "inactive"}
                    label="Multi-shop"
                  />
                  <PlatformStatusBadge
                    status={shop.analytics_enabled ? "active" : "inactive"}
                    label="Analytics"
                  />
                  <PlatformStatusBadge
                    status={shop.priority_support_enabled ? "active" : "inactive"}
                    label="Support"
                  />
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (shop) => <WorkspaceShopActions shopId={shop.id} shopName={shop.name} />,
            },
          ]}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Order movement</CardDescription>
            <CardTitle>Status mix across the selected enterprise scope</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 pt-0">
            {workspace.status_breakdown.map((item) => (
              <div
                key={item.status}
                className="rounded-2xl border border-[var(--fom-border-subtle)] bg-muted/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {item.status.replace(/_/g, " ")}
                  </p>
                  <PlatformStatusBadge status={item.status} />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {item.count}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <PlatformDataTable
          title="Recent orders across selected shops"
          description="Latest order activity from the current enterprise scope"
          rows={workspace.recent_orders}
          emptyMessage="No recent orders are available for the selected scope."
          footer={`Showing ${workspace.recent_orders.length} recent orders`}
          columns={[
            {
              key: "order",
              header: "Order",
              render: (order) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{order.order_no}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(order.updated_at)}
                  </span>
                </div>
              ),
            },
            {
              key: "shop",
              header: "Shop",
              render: (order) => (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {order.shop_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.customer_name}
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
            {
              key: "created",
              header: "Created",
              render: (order) => formatDate(order.created_at),
            },
          ]}
        />
      </section>

      <PlatformDataTable
        title="Top shops in the current selection"
        description="Sorted by delivered revenue inside the selected enterprise scope"
        rows={workspace.top_shops}
        emptyMessage="No enterprise-ready shops are currently selected."
        footer={`Showing ${workspace.top_shops.length} ranked shops`}
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (shop) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{shop.name}</span>
                <span className="text-xs text-muted-foreground">
                  {shop.plan_name ?? "No plan"}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (shop) => <PlatformStatusBadge status={shop.status} />,
          },
          {
            key: "members",
            header: "Active members",
            render: (shop) => `${shop.active_member_count}/${shop.member_count}`,
          },
          {
            key: "aov",
            header: "Avg order",
            render: (shop) => formatCurrency(shop.average_order_value),
          },
          {
            key: "revenue",
            header: "Revenue",
            render: (shop) => formatCurrency(shop.total_revenue),
          },
          {
            key: "last_active",
            header: "Last active",
            render: (shop) =>
              shop.last_active_at ? formatRelativeDate(shop.last_active_at) : "No recent activity",
          },
          {
            key: "actions",
            header: "",
            render: (shop) => <WorkspaceShopActions shopId={shop.id} shopName={shop.name} />,
          },
        ]}
      />
    </div>
  )
}
