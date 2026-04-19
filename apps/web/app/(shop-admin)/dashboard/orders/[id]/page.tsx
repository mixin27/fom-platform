import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  ClockIcon,
  CreditCardIcon,
  PackageIcon,
  PencilLineIcon,
  PrinterIcon,
  UserIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getShopOrder, getShopPortalContext } from "@/lib/shop/api"
import { formatCodeLabel } from "@/lib/shop/format"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

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
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Queue
              </Link>
            </Button>
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
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Line Items</CardTitle>
                <PlatformStatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--fom-border-subtle)]/50 bg-muted/5">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Qty</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Price</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
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
                      <td className="px-4 py-3 text-right text-muted-foreground font-medium">
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
                    <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">Subtotal</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        order.items.reduce((s, i) => s + i.line_total, 0),
                        order.currency
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">Delivery Fee</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(order.delivery_fee, order.currency)}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--fom-border-subtle)]/50 text-lg">
                    <td colSpan={3} className="px-4 py-4 text-right text-[var(--fom-accent)]">Total</td>
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
              <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
                <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                  <ClockIcon className="size-4" />
                  Movement Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {order.status_history.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="min-w-[80px] text-[11px] font-bold text-muted-foreground uppercase pt-1">
                      {formatRelativeDate(log.changed_at)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <PlatformStatusBadge status={log.to_status} className="h-5 text-[10px]" />
                        {log.changed_by && (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            by {log.changed_by.name}
                          </span>
                        )}
                      </div>
                      {log.note && (
                        <p className="text-[13px] text-foreground bg-muted/30 p-2 rounded-lg border border-[var(--fom-border-subtle)]/50 italic">
                          "{log.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                <UserIcon className="size-4" />
                Customer Record
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Name</p>
                <p className="text-[15px] font-bold text-foreground">{order.customer.name}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                <p className="text-[15px] font-bold font-mono text-foreground">{order.customer.phone}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Address</p>
                <p className="text-[13px] font-medium text-foreground leading-relaxed">
                  {order.customer.address ?? "No specific address provided."}
                </p>
                {order.customer.township && (
                  <p className="text-[11px] font-bold text-[var(--fom-accent)] uppercase mt-1">
                    {order.customer.township}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                <PackageIcon className="size-4" />
                Record Origins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Source</span>
                <span className="font-bold underline decoration-[var(--fom-accent)] underline-offset-4 uppercase">{order.source}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Entered</span>
                <span className="font-bold">{formatDate(order.created_at)}</span>
              </div>
              {order.note && (
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Internal Note</span>
                  <p className="text-[12px] font-medium text-foreground bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                    {order.note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="h-11 rounded-xl font-bold gap-2">
            <PrinterIcon className="size-4" />
            Print Dispatch Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
