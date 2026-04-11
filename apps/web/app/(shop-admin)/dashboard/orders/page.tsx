import Link from "next/link"
import { MessageSquareText, PencilLine, Plus } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopDailySummary,
  getShopOrder,
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
  addShopOrderItemFromFormAction,
  createShopOrderFromFormAction,
  removeShopOrderItemFromFormAction,
  updateShopOrderFromFormAction,
  updateShopOrderItemFromFormAction,
  updateShopOrderStatusFromFormAction,
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
import { Textarea } from "@workspace/ui/components/textarea"

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
  const editOrderId = getSingleSearchParam(params.edit)
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
  const selectedOrderSummary = editOrderId
    ? rows.find((order) => order.id === editOrderId) ?? null
    : null
  const selectedOrder = selectedOrderSummary
    ? (await getShopOrder(selectedOrderSummary.id, currentHref)).data
    : null
  const pagination = ordersResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
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
  const canManageItems = permissions.has("order_items.write")

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Orders"
        title="Order management"
        description="Track the queue, edit current order metadata and items, or move directly into the Messenger paste workflow."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders/paste-from-messenger">
                <MessageSquareText data-icon="inline-start" />
                Paste from Messenger
              </Link>
            </Button>
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

      <div className="flex flex-wrap gap-2">
        <PlatformStatusBadge status="active" label={formatDate(summary.summary_date)} />
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

      <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
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
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input name="date" defaultValue={date} type="date" className="h-9" />
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
                  <span className="font-semibold text-foreground">{order.order_no}</span>
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
              render: (order) => formatCurrency(order.total_price, order.currency),
            },
            {
              key: "actions",
              header: "Actions",
              render: (order) => {
                const nextAction = nextOrderActionByStatus[order.status]

                return (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildQueryHref("/dashboard/orders", params, {
                          edit: order.id,
                        })}
                      >
                        <PencilLine data-icon="inline-start" />
                        Edit
                      </Link>
                    </Button>
                    {canAdvanceOrders && nextAction ? (
                      <form action={updateShopOrderStatusFromFormAction}>
                        <input type="hidden" name="return_to" value={currentHref} />
                        <input type="hidden" name="shop_id" value={activeShop.id} />
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="status" value={nextAction.status} />
                        <input type="hidden" name="note" value={nextAction.note} />
                        <Button type="submit" size="sm" variant="outline">
                          {nextAction.label}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                )
              },
              className: "w-[210px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />

        <div className="flex flex-col gap-3">
          {selectedOrder ? (
            <>
              <Card className="border border-black/6 bg-white shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>Editing {selectedOrder.order_no}</CardDescription>
                  <CardTitle>Order details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4 rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedOrder.customer.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedOrder.customer.phone}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {selectedOrder.customer.address ?? "No saved address"}
                    </p>
                  </div>

                  {canEditOrders ? (
                    <form action={updateShopOrderFromFormAction} className="flex flex-col gap-2.5">
                      <input type="hidden" name="return_to" value={currentHref} />
                      <input type="hidden" name="shop_id" value={activeShop.id} />
                      <input type="hidden" name="order_id" value={selectedOrder.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          name="delivery_fee"
                          defaultValue={String(selectedOrder.delivery_fee)}
                          placeholder="Delivery fee"
                          className="h-9"
                        />
                        <Input
                          name="currency"
                          defaultValue={selectedOrder.currency}
                          placeholder="Currency"
                          className="h-9"
                        />
                      </div>
                      <select
                        name="source"
                        defaultValue={selectedOrder.source}
                        className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                      >
                        <option value="manual">Manual</option>
                        <option value="messenger">Messenger</option>
                      </select>
                      <Textarea
                        name="note"
                        defaultValue={selectedOrder.note ?? ""}
                        placeholder="Internal note"
                        className="min-h-[100px]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm">
                          Save changes
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={buildQueryHref("/dashboard/orders", params, {
                              edit: null,
                            })}
                          >
                            Close
                          </Link>
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your account can view this order but cannot edit its metadata.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-black/6 bg-white shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>Current basket</CardDescription>
                  <CardTitle>Order items</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-black/6 bg-[#fcfbf9] p-3"
                    >
                      {canManageItems ? (
                        <div className="flex flex-col gap-2">
                          <form
                            action={updateShopOrderItemFromFormAction}
                            className="flex flex-col gap-2"
                          >
                            <input type="hidden" name="return_to" value={currentHref} />
                            <input type="hidden" name="shop_id" value={activeShop.id} />
                            <input type="hidden" name="order_id" value={selectedOrder.id} />
                            <input type="hidden" name="item_id" value={item.id} />
                            <Input
                              name="product_name"
                              defaultValue={item.product_name}
                              className="h-9"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              <Input
                                name="qty"
                                defaultValue={String(item.qty)}
                                className="h-9"
                              />
                              <Input
                                name="unit_price"
                                defaultValue={String(item.unit_price)}
                                className="h-9"
                              />
                            </div>
                            <Button type="submit" size="sm" variant="outline">
                              Update item
                            </Button>
                          </form>
                          <form action={removeShopOrderItemFromFormAction}>
                            <input type="hidden" name="return_to" value={currentHref} />
                            <input type="hidden" name="shop_id" value={activeShop.id} />
                            <input type="hidden" name="order_id" value={selectedOrder.id} />
                            <input type="hidden" name="item_id" value={item.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Remove
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty {item.qty} · {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.line_total)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {canManageItems ? (
                    <form action={addShopOrderItemFromFormAction} className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-black/10 p-3">
                      <input type="hidden" name="return_to" value={currentHref} />
                      <input type="hidden" name="shop_id" value={activeShop.id} />
                      <input type="hidden" name="order_id" value={selectedOrder.id} />
                      <Input name="product_name" placeholder="New item name" className="h-9" />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input name="qty" placeholder="Qty" className="h-9" />
                        <Input name="unit_price" placeholder="Unit price" className="h-9" />
                      </div>
                      <Button type="submit" size="sm">
                        Add item
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border border-black/6 bg-white shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>Workflow</CardDescription>
                  <CardTitle>Status history</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  {selectedOrder.status_history && selectedOrder.status_history.length > 0 ? (
                    selectedOrder.status_history.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <PlatformStatusBadge status={event.to_status} />
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(event.changed_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {event.note ?? "No note"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No status history is available for this order yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border border-black/6 bg-white shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>Manual entry</CardDescription>
                  <CardTitle>Create order</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {canCreateOrders ? (
                    <form action={createShopOrderFromFormAction} className="flex flex-col gap-2.5">
                      <input type="hidden" name="return_to" value={currentHref} />
                      <input type="hidden" name="shop_id" value={activeShop.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input name="customer_name" placeholder="Customer name" className="h-9" />
                        <Input name="customer_phone" placeholder="Phone" className="h-9" />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input name="customer_township" placeholder="Township" className="h-9" />
                        <Input name="delivery_fee" placeholder="Delivery fee" className="h-9" />
                      </div>
                      <Input name="customer_address" placeholder="Address" className="h-9" />
                      <Textarea
                        name="items"
                        placeholder={`Product name | Qty | Unit price\nT-shirt | 2 | 18000\nPants | 1 | 24000`}
                        className="min-h-[110px]"
                      />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <select
                          name="status"
                          defaultValue="new"
                          className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                        >
                          <option value="new">New</option>
                          <option value="confirmed">Confirmed</option>
                        </select>
                        <select
                          name="source"
                          defaultValue="manual"
                          className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                        >
                          <option value="manual">Manual</option>
                          <option value="messenger">Messenger</option>
                        </select>
                        <Input
                          name="currency"
                          defaultValue="MMK"
                          placeholder="Currency"
                          className="h-9"
                        />
                      </div>
                      <Textarea
                        name="note"
                        placeholder="Optional internal note"
                        className="min-h-[84px]"
                      />
                      <Button type="submit" size="sm">
                        <Plus data-icon="inline-start" />
                        Create order
                      </Button>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Each item line must use <span className="font-medium">Product | Qty | Unit price</span>.
                      </p>
                    </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your account can review orders but cannot create new ones.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-black/6 bg-white shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>Messenger intake</CardDescription>
                  <CardTitle>Paste a chat into a structured draft</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Use the dedicated parser workspace when an order arrives as raw Messenger text instead of a clean form.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/dashboard/orders/paste-from-messenger">
                      <MessageSquareText data-icon="inline-start" />
                      Open parser
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
