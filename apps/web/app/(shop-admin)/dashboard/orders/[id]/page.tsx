import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  ClockIcon,
  PackageIcon,
  PencilLineIcon,
  UserIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { getShopOrder, getShopPortalContext } from "@/lib/shop/api"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { OrderInvoiceDownloadMenu } from "../_components/order-invoice-download-menu"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

interface ShopOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopOrderDetailPage({
  params,
}: ShopOrderDetailPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const response = await getShopOrder(id)
  const order = response.data

  if (!order) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Order ${order.order_no}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Queue
              </Link>
            </Button>
            <OrderInvoiceDownloadMenu
              order={order}
              shopName={activeShop.name}
            />
            <Button asChild size="sm">
              <Link href={`/dashboard/orders/${id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit Order
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Line Items</CardTitle>
                <PlatformStatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--fom-border-subtle)]/50 bg-muted/5">
                    <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fom-border-subtle)]/50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {item.qty}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                        {formatCurrency(item.unit_price, order.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatCurrency(item.line_total, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/5 font-bold">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-muted-foreground"
                    >
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        order.items.reduce((s, i) => s + i.line_total, 0),
                        order.currency
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-muted-foreground"
                    >
                      Delivery Fee
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(order.delivery_fee, order.currency)}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--fom-border-subtle)]/50 text-lg">
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-right text-[var(--fom-accent)]"
                    >
                      Total
                    </td>
                    <td className="px-4 py-4 text-right text-[var(--fom-accent)]">
                      {formatCurrency(order.total_price, order.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {order.status_history && order.status_history.length > 0 && (
            <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-[13.5px] font-bold">
                  <ClockIcon className="size-4" />
                  Movement Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {order.status_history.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="min-w-[80px] pt-1 text-[11px] font-bold text-muted-foreground uppercase">
                      {formatRelativeDate(log.changed_at)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <PlatformStatusBadge
                          status={log.to_status}
                          className="h-5 text-[10px]"
                        />
                        {log.changed_by && (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            by {log.changed_by.name}
                          </span>
                        )}
                      </div>
                      {log.note && (
                        <p className="rounded-lg border border-[var(--fom-border-subtle)]/50 bg-muted/30 p-2 text-[13px] text-foreground italic">
                          "{log.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {order.audit_history && order.audit_history.length > 0 && (
            <PlatformDataTable
              title="Audit Trail"
              description="Order operation history"
              rows={order.audit_history}
              emptyMessage="No audit events recorded for this order yet."
              footer={`Showing ${order.audit_history.length} audit event${
                order.audit_history.length === 1 ? "" : "s"
              }`}
              columns={[
                {
                  key: "when",
                  header: "When",
                  render: (log) => (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {formatRelativeDate(log.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "action",
                  header: "Action",
                  render: (log) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">
                        {log.summary}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.action}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "actor",
                  header: "Actor",
                  render: (log) => log.actor?.name ?? "System",
                },
              ]}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-[13.5px] font-bold">
                <UserIcon className="size-4" />
                Customer Record
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Name
                </p>
                <p className="text-[15px] font-bold text-foreground">
                  {order.customer.name}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Phone
                </p>
                <p className="font-mono text-[15px] font-bold text-foreground">
                  {order.customer.phone}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Address
                </p>
                <p className="text-[13px] leading-relaxed font-medium text-foreground">
                  {order.customer.address ?? "No specific address provided."}
                </p>
                {order.customer.township && (
                  <p className="mt-1 text-[11px] font-bold text-[var(--fom-accent)] uppercase">
                    {order.customer.township}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-[13.5px] font-bold">
                <PackageIcon className="size-4" />
                Record Origins
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-muted-foreground">
                  Source
                </span>
                <span className="font-bold uppercase underline decoration-[var(--fom-accent)] underline-offset-4">
                  {order.source}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-muted-foreground">
                  Entered
                </span>
                <span className="font-bold">
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.note && (
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Internal Note
                  </span>
                  <p className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-[12px] font-medium text-foreground italic">
                    {order.note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
