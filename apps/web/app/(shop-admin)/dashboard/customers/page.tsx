import { HeartHandshake, MapPinned, Users } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopCustomers,
  getShopPortalContext,
  type ShopCursorPagination,
} from "@/lib/shop/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import {
  formatCurrency,
  formatPercent,
  formatRelativeDate,
} from "@/lib/platform/format"
import { createShopCustomerFromFormAction } from "../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

type CustomersPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/customers", params, {})
  const [{ activeShop }, customersResponse] = await Promise.all([
    getShopPortalContext(),
    getShopCustomers(params, currentHref),
  ])
  const rows = customersResponse.data
  const pagination = customersResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const search = getSingleSearchParam(params.search) ?? ""
  const segment = getSingleSearchParam(params.segment) ?? "all"
  const sort = getSingleSearchParam(params.sort) ?? "recent"
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canWriteCustomers = permissions.has("customers.write")
  const vipCount = rows.filter((customer) => customer.is_vip).length
  const newCount = rows.filter((customer) => customer.is_new_this_week).length
  const repeatRate =
    rows.length > 0
      ? rows.reduce((sum, customer) => sum + customer.delivered_rate, 0) /
        rows.length /
        100
      : 0
  const townshipCounts = rows.reduce<Record<string, number>>((accumulator, customer) => {
    if (!customer.township) {
      return accumulator
    }

    accumulator[customer.township] = (accumulator[customer.township] ?? 0) + 1
    return accumulator
  }, {})
  const topTownship =
    Object.entries(townshipCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "—"

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Customers"
        title="Customer relationships"
        description="Track repeat buyers, segment recent activity, and keep delivery notes close to the order workflow."
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Repeat buyers"
          value={formatPercent(repeatRate)}
          detail="Average delivered-rate across the customers in the current view."
          delta={`${vipCount} VIP`}
          icon={HeartHandshake}
          accent="sunset"
        />
        <DashboardStatCard
          title="Visible customers"
          value={String(rows.length)}
          detail="Filtered customers currently in the workspace."
          delta={`${newCount} new this week`}
          icon={Users}
          accent="teal"
        />
        <DashboardStatCard
          title="Top township"
          value={topTownship}
          detail="Most common township in the current filtered list."
          delta={segment === "all" ? "All segments" : segment}
          icon={MapPinned}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <PlatformDataTable
          title="Customer list"
          description="Recent buyer activity"
          rows={rows}
          emptyMessage="No customers matched the current filters."
          footer={`Showing ${rows.length} customer${rows.length === 1 ? "" : "s"}`}
          pagination={
            pagination
              ? {
                  previousHref: previousCursor
                    ? buildQueryHref("/dashboard/customers", params, {
                        cursor: previousCursor,
                      })
                    : currentCursor
                      ? buildQueryHref("/dashboard/customers", params, {
                          cursor: null,
                        })
                      : null,
                  nextHref: pagination.next_cursor
                    ? buildQueryHref("/dashboard/customers", params, {
                        cursor: pagination.next_cursor,
                      })
                    : null,
                }
              : undefined
          }
          toolbar={
            <form method="GET" className="flex flex-wrap gap-2">
              <Input
                name="search"
                defaultValue={search}
                placeholder="Search customers"
                className="h-9 w-[220px]"
              />
              <select
                name="segment"
                defaultValue={segment}
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="vip">VIP</option>
                <option value="new_this_week">New this week</option>
                <option value="top_spenders">Top spenders</option>
              </select>
              <select
                name="sort"
                defaultValue={sort}
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="recent">Recent</option>
                <option value="top_spenders">Top spenders</option>
                <option value="name">Name</option>
              </select>
              <input type="hidden" name="limit" value={String(limit)} />
              <Button type="submit" size="sm" variant="outline">
                Filter
              </Button>
            </form>
          }
          columns={[
            {
              key: "customer",
              header: "Customer",
              render: (customer) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {customer.phone}
                  </span>
                </div>
              ),
            },
            {
              key: "location",
              header: "Location",
              render: (customer) => (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground">{customer.township ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {customer.address ?? "No saved address"}
                  </span>
                </div>
              ),
            },
            {
              key: "orders",
              header: "Orders",
              render: (customer) => (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground">
                    {customer.total_orders.toLocaleString()} orders
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Last {formatRelativeDate(customer.last_order_at)}
                  </span>
                </div>
              ),
            },
            {
              key: "spend",
              header: "Spend",
              render: (customer) => formatCurrency(customer.total_spent),
            },
            {
              key: "flags",
              header: "Flags",
              render: (customer) => (
                <div className="flex flex-wrap gap-2">
                  {customer.is_vip ? (
                    <PlatformStatusBadge status="active" label="VIP" />
                  ) : null}
                  {customer.is_new_this_week ? (
                    <PlatformStatusBadge status="new" label="New this week" />
                  ) : null}
                  <PlatformStatusBadge
                    status={customer.delivered_rate >= 70 ? "active" : "pending"}
                    label={`${Math.round(customer.delivered_rate)}% delivered`}
                  />
                </div>
              ),
            },
          ]}
        />

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Customer intake</CardDescription>
            <CardTitle>Create customer</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canWriteCustomers ? (
              <form
                action={createShopCustomerFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input name="name" placeholder="Customer name" className="h-9" />
                <Input name="phone" placeholder="Phone" className="h-9" />
                <Input name="township" placeholder="Township" className="h-9" />
                <Input name="address" placeholder="Address" className="h-9" />
                <Textarea
                  name="notes"
                  placeholder="Internal notes"
                  className="min-h-[90px]"
                />
                <Button type="submit" size="sm">
                  Save customer
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your account can review customer records but cannot create or update them.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
