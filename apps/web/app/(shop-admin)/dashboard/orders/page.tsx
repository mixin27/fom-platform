import Link from "next/link"
import { MessageSquareText } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
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
import { Card } from "@workspace/ui/components/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { PlusIcon, MessageSquareTextIcon } from "lucide-react"

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
      <AdminHeader
        title="Order Queue"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders/paste-from-messenger">
                <MessageSquareTextIcon data-icon="inline-start" />
                Paste Flow
              </Link>
            </Button>
            {canCreateOrders && (
              <Button asChild size="sm">
                <Link href="/dashboard/orders/new">
                  <PlusIcon data-icon="inline-start" />
                  New Order
                </Link>
              </Button>
            )}
          </div>
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

      <div className="flex flex-wrap gap-2 items-center bg-muted/20 p-2 rounded-xl border border-[var(--fom-border-subtle)]/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Today Snapshot</span>
        <PlatformStatusBadge
          status="new"
          label={`New ${summary.status_breakdown.new}`}
        />
        <PlatformStatusBadge
          status="confirmed"
          label={`Ready ${summary.status_breakdown.confirmed}`}
        />
        <PlatformStatusBadge
          status="out_for_delivery"
          label={`Dispatch ${summary.status_breakdown.out_for_delivery}`}
        />
        <PlatformStatusBadge
          status="delivered"
          label={`Done ${summary.status_breakdown.delivered}`}
        />
      </div>

      <AdminDataTable
        title="Movement Tracking"
        data={rows}
        emptyMessage="No orders matched the current filters."
        toolbar={
          <form method="GET" className="flex flex-wrap items-center gap-2">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by ID or Name"
              className="h-8 w-[200px] text-[13px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-8 rounded-lg border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-2 text-[12px] font-medium"
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
              className="h-8 text-[12px]"
            />
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" className="h-8">
              Filter
            </Button>
          </form>
        }
        columns={[
          {
            key: "order",
            header: "Record",
            render: (order) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {order.order_no}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {formatRelativeDate(order.updated_at)}
                </span>
              </div>
            ),
          },
          {
            key: "customer",
            header: "Buyer",
            render: (order) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {order.customer.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {order.customer.phone}
                </span>
              </div>
            ),
          },
          {
            key: "items",
            header: "Package",
            render: (order) => (
              <span className="text-[12px] font-medium text-muted-foreground">
                {order.items
                  .map((item) => `${item.product_name} x${item.qty}`)
                  .join(", ")}
              </span>
            ),
          },
          {
            key: "status",
            header: "Stage",
            render: (order) => <PlatformStatusBadge status={order.status} />,
          },
          {
            key: "amount",
            header: "Total",
            render: (order) => (
              <span className="font-bold text-foreground">
                {formatCurrency(order.total_price, order.currency)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (order) => {
              const nextAction = nextOrderActionByStatus[order.status]

              return (
                <div className="flex justify-end items-center gap-3">
                  {canAdvanceOrders && nextAction && (
                    <form action={updateShopOrderStatusFromFormAction}>
                      <input type="hidden" name="return_to" value={currentHref} />
                      <input type="hidden" name="shop_id" value={activeShop.id} />
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="status" value={nextAction.status} />
                      <input type="hidden" name="note" value={nextAction.note} />
                      <Button type="submit" size="xs" variant="outline" className="h-7 px-3 font-bold text-[var(--fom-accent)] border-[var(--fom-accent)]/20 hover:bg-[var(--fom-accent)]/5">
                        {nextAction.label}
                      </Button>
                    </form>
                  )}
                  <Button asChild size="xs" variant="ghost" className="h-7 px-2 font-bold text-muted-foreground hover:text-foreground">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              )
            },
          },
        ]}
        footer={
          pagination && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Showing {rows.length} orders
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    {previousCursor ? (
                      <PaginationPrevious href={buildQueryHref("/dashboard/orders", params, { cursor: previousCursor })} />
                    ) : (
                      <PaginationPrevious className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {pagination.next_cursor ? (
                      <PaginationNext href={buildQueryHref("/dashboard/orders", params, { cursor: pagination.next_cursor })} />
                    ) : (
                      <PaginationNext className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )
        }
      />
    </div>
  )
}
