import Link from "next/link"
import { MessageSquareText } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopDailySummary,
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
import { updateShopOrderStatusFromFormAction } from "../actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ShopOrderSheet } from "./_components/shop-order-sheet"
import { Card } from "@workspace/ui/components/card"

const nextOrderActionByStatus: Record<
  string,
  { label: string; status: string; note: string } | undefined
> = {
  new: {
    label: "Confirm",
    status: "confirmed",
    note: "Confirmed from dashboard order queue.",
  },
  confirmed: {
    label: "Dispatch",
    status: "out_for_delivery",
    note: "Moved to delivery from dashboard order queue.",
  },
  out_for_delivery: {
    label: "Deliver",
    status: "delivered",
    note: "Marked delivered from dashboard order queue.",
  },
}

type OrdersPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/orders", params, {})
  const [{ activeShop }, ordersResponse, summaryResponse] = await Promise.all([
    getShopPortalContext(),
    getShopOrders(params, currentHref),
    getShopDailySummary(
      getSingleSearchParam(params.date)
        ? { date: getSingleSearchParam(params.date) }
        : undefined,
      currentHref
    ),
  ])
  const rows = ordersResponse.data
  const summary = summaryResponse.data
  const pagination = ordersResponse.meta?.pagination as
    | ShopCursorPagination
    | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(
    getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20
  )
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const search = getSingleSearchParam(params.search) ?? ""
  const status = getSingleSearchParam(params.status) ?? "pending"
  const date = getSingleSearchParam(params.date) ?? ""
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canCreateOrders = permissions.has("orders.write")
  const canAdvanceOrders = permissions.has("order_status.write")
  const canEditOrders = permissions.has("orders.write")

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Orders"
        title="Order management"
        description="Track the queue, edit order metadata and items, or move directly into the Messenger paste workflow."
        actions={
          <Card className="flex flex-wrap gap-2 border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] p-1 shadow-none">
            {canCreateOrders ? (
              <ShopOrderSheet
                shopId={activeShop.id}
                triggerLabel="Create order"
                triggerVariant="default"
              />
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders/paste-from-messenger">
                <MessageSquareText data-icon="inline-start" />
                Paste from Messenger
              </Link>
            </Button>
          </Card>
        }
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

      <div className="flex flex-wrap gap-2">
        <PlatformStatusBadge
          status="active"
          label={formatDate(summary.summary_date)}
        />
        <PlatformStatusBadge
          status="new"
          label={`New ${summary.status_breakdown.new}`}
        />
        <PlatformStatusBadge
          status="confirmed"
          label={`Confirmed ${summary.status_breakdown.confirmed}`}
        />
        <PlatformStatusBadge
          status="out_for_delivery"
          label={`Out ${summary.status_breakdown.out_for_delivery}`}
        />
        <PlatformStatusBadge
          status="delivered"
          label={`Delivered ${summary.status_breakdown.delivered}`}
        />
      </div>

      <PlatformDataTable
        title="Order queue"
        description="All active and recent orders"
        rows={rows}
        emptyMessage="No orders matched the current filters."
        footer={`Showing ${rows.length} order${rows.length === 1 ? "" : "s"}`}
        pagination={
          pagination
            ? {
                previousHref: previousCursor
                  ? buildQueryHref("/dashboard/orders", params, {
                      cursor: previousCursor,
                    })
                  : currentCursor
                    ? buildQueryHref("/dashboard/orders", params, {
                        cursor: null,
                      })
                    : null,
                nextHref: pagination.next_cursor
                  ? buildQueryHref("/dashboard/orders", params, {
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
              placeholder="Search orders or customers"
              className="h-9 w-[220px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="new">New</option>
              <option value="confirmed">Confirmed</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Input
              name="date"
              defaultValue={date}
              type="date"
              className="h-9"
            />
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
            render: (order) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {order.order_no}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(order.updated_at)}
                </span>
              </div>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (order) => (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {order.customer.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {order.customer.phone}
                </span>
              </div>
            ),
          },
          {
            key: "items",
            header: "Items",
            render: (order) => (
              <span className="text-sm text-muted-foreground">
                {order.items
                  .map((item) => `${item.product_name} x${item.qty}`)
                  .join(", ")}
              </span>
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
            render: (order) =>
              formatCurrency(order.total_price, order.currency),
          },
          {
            key: "actions",
            header: "Actions",
            render: (order) => {
              const nextAction = nextOrderActionByStatus[order.status]
              const hasAnyAction =
                canEditOrders || Boolean(canAdvanceOrders && nextAction)

              return (
                <div className="flex flex-wrap justify-end gap-2">
                  {canEditOrders ? (
                    <ShopOrderSheet shopId={activeShop.id} order={order} />
                  ) : null}
                  {canAdvanceOrders && nextAction ? (
                    <form action={updateShopOrderStatusFromFormAction}>
                      <input
                        type="hidden"
                        name="return_to"
                        value={currentHref}
                      />
                      <input
                        type="hidden"
                        name="shop_id"
                        value={activeShop.id}
                      />
                      <input type="hidden" name="order_id" value={order.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={nextAction.status}
                      />
                      <input
                        type="hidden"
                        name="note"
                        value={nextAction.note}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        {nextAction.label}
                      </Button>
                    </form>
                  ) : null}
                  {!hasAnyAction ? (
                    <span className="text-xs text-muted-foreground">
                      No actions
                    </span>
                  ) : null}
                </div>
              )
            },
            className: "w-[220px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
          },
        ]}
      />
    </div>
  )
}
