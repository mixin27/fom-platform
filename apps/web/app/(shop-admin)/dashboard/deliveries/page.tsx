import { PackageCheck, TimerReset, Truck } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopDeliveries,
  getShopMembers,
  getShopOrders,
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
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  createShopDeliveryFromFormAction,
  updateShopDeliveryFromFormAction,
} from "../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

const nextDeliveryActionByStatus: Record<string, { label: string; status: string } | undefined> =
  {
    scheduled: {
      label: "Start route",
      status: "out_for_delivery",
    },
    out_for_delivery: {
      label: "Mark delivered",
      status: "delivered",
    },
  }

type DeliveriesPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function DeliveriesPage({
  searchParams,
}: DeliveriesPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/deliveries", params, {})
  const [{ activeShop }, deliveriesResponse, membersResponse, availableOrdersResponse] =
    await Promise.all([
      getShopPortalContext(),
      getShopDeliveries(params, currentHref),
      getShopMembers({ limit: "100" }, currentHref),
      getShopOrders({ status: "confirmed", limit: "100" }, currentHref),
    ])
  const rows = deliveriesResponse.data
  const members = membersResponse.data.filter((member) => member.status === "active")
  const availableOrders = availableOrdersResponse.data
  const pagination = deliveriesResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "scheduled"
  const driverUserId = getSingleSearchParam(params.driver_user_id) ?? ""
  const search = getSingleSearchParam(params.search) ?? ""
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canManageDeliveries = permissions.has("deliveries.write")
  const scheduledCount = rows.filter((delivery) => delivery.status === "scheduled").length
  const outForDeliveryCount = rows.filter(
    (delivery) => delivery.status === "out_for_delivery"
  ).length
  const deliveredCount = rows.filter((delivery) => delivery.status === "delivered").length

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Deliveries"
        title="Delivery coordination"
        description="Assign riders, monitor route state, and keep delivery fees visible alongside the customer and order details."
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
          title="Scheduled"
          value={String(scheduledCount)}
          detail="Deliveries created and assigned but not yet on route."
          delta={`${rows.length} visible`}
          icon={TimerReset}
          accent="ink"
        />
        <DashboardStatCard
          title="Out for delivery"
          value={String(outForDeliveryCount)}
          detail="Orders currently in the rider workflow."
          delta={`${members.length} active drivers`}
          icon={Truck}
          accent="teal"
        />
        <DashboardStatCard
          title="Delivered"
          value={String(deliveredCount)}
          detail="Completed deliveries in the current filtered list."
          delta={formatDate(rows[0]?.updated_at)}
          icon={PackageCheck}
          accent="sunset"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <PlatformDataTable
          title="Delivery board"
          description="Assignments and route state"
          rows={rows}
          emptyMessage="No deliveries matched the current filters."
          footer={`Showing ${rows.length} deliver${rows.length === 1 ? "y" : "ies"}`}
          pagination={
            pagination
              ? {
                  previousHref: previousCursor
                    ? buildQueryHref("/dashboard/deliveries", params, {
                        cursor: previousCursor,
                      })
                    : currentCursor
                      ? buildQueryHref("/dashboard/deliveries", params, {
                          cursor: null,
                        })
                      : null,
                  nextHref: pagination.next_cursor
                    ? buildQueryHref("/dashboard/deliveries", params, {
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
                placeholder="Search order or customer"
                className="h-9 w-[220px]"
              />
              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="scheduled">Scheduled</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
              </select>
              <select
                name="driver_user_id"
                defaultValue={driverUserId}
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="">All drivers</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
              <input type="hidden" name="limit" value={String(limit)} />
              <Button type="submit" size="sm" variant="outline">
                Filter
              </Button>
            </form>
          }
          columns={[
            {
              key: "order",
              header: "Order",
              render: (delivery) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">
                    {delivery.order.order_no}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {delivery.order.customer.name}
                  </span>
                </div>
              ),
            },
            {
              key: "driver",
              header: "Driver",
              render: (delivery) => (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground">{delivery.driver.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {delivery.driver.phone ?? delivery.driver.email ?? "No contact"}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (delivery) => <PlatformStatusBadge status={delivery.status} />,
            },
            {
              key: "amount",
              header: "Fee",
              render: (delivery) =>
                formatCurrency(delivery.delivery_fee ?? delivery.order.delivery_fee),
            },
            {
              key: "updated",
              header: "Updated",
              render: (delivery) => formatRelativeDate(delivery.updated_at),
            },
            {
              key: "actions",
              header: "Actions",
              render: (delivery) => {
                const nextAction = nextDeliveryActionByStatus[delivery.status]

                if (!canManageDeliveries || !nextAction) {
                  return <span className="text-xs text-muted-foreground">No actions</span>
                }

                return (
                  <form action={updateShopDeliveryFromFormAction}>
                    <input type="hidden" name="return_to" value={currentHref} />
                    <input type="hidden" name="shop_id" value={activeShop.id} />
                    <input type="hidden" name="delivery_id" value={delivery.id} />
                    <input type="hidden" name="status" value={nextAction.status} />
                    <Button type="submit" size="sm" variant="outline">
                      {nextAction.label}
                    </Button>
                  </form>
                )
              },
              className: "w-[140px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Dispatch</CardDescription>
            <CardTitle>Create delivery</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canManageDeliveries ? (
              <form
                action={createShopDeliveryFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <select
                  name="order_id"
                  defaultValue=""
                  className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                >
                  <option value="" disabled>
                    Select confirmed order
                  </option>
                  {availableOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_no} · {order.customer.name}
                    </option>
                  ))}
                </select>
                <select
                  name="driver_user_id"
                  defaultValue=""
                  className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                >
                  <option value="" disabled>
                    Assign driver
                  </option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    name="status"
                    defaultValue="scheduled"
                    className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="out_for_delivery">Out for delivery</option>
                  </select>
                  <Input name="delivery_fee" placeholder="Delivery fee" className="h-9" />
                </div>
                <Input
                  name="scheduled_at"
                  type="datetime-local"
                  placeholder="Scheduled time"
                  className="h-9"
                />
                <Input
                  name="address_snapshot"
                  placeholder="Address snapshot override"
                  className="h-9"
                />
                <Button type="submit" size="sm">
                  Create delivery
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your account can review deliveries but cannot create or update them.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
