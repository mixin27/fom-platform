import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  ShoppingBagIcon,
  StarIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getShopCustomer, getShopPortalContext } from "@/lib/shop/api"
import {
  formatCurrency,
  formatDate,
  formatPercent,
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

interface ShopCustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopCustomerDetailPage({
  params,
}: ShopCustomerDetailPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const response = await getShopCustomer(id)
  const customer = response.data

  if (!customer) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={customer.name}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/customers">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to List
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/dashboard/customers/${id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit Profile
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-4">
        <AdminStatCard
          label="Lifetime Spend"
          value={formatCurrency(customer.total_spent)}
          icon={CreditCardIcon}
          accent="sunset"
        />
        <AdminStatCard
          label="Order Volume"
          value={String(customer.total_orders)}
          icon={ShoppingBagIcon}
          accent="teal"
        />
        <AdminStatCard
          label="Success Rate"
          value={formatPercent(customer.delivered_rate / 100)}
          icon={BadgeCheckIcon}
          accent="ink"
        />
        <AdminStatCard
          label="Last Purchase"
          value={customer.last_order_at ? formatRelativeDate(customer.last_order_at) : "N/A"}
          icon={CalendarIcon}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
                <Link href={`/dashboard/orders?search=${customer.phone}`} className="text-[12px] font-bold text-[var(--fom-accent)] hover:underline">
                  View full history
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customer.recent_orders && customer.recent_orders.length > 0 ? (
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--fom-border-subtle)]/50 bg-muted/5">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fom-border-subtle)]/50">
                    {customer.recent_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/5 transition-colors group">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/orders/${order.id}`} className="font-bold text-foreground hover:text-[var(--fom-accent)]">
                            {order.order_no}
                          </Link>
                          <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[180px]">
                            {order.product_name}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PlatformStatusBadge status={order.status} className="h-5 text-[10px]" />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground font-medium">
                          {formatRelativeDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                  No transaction records found for this customer.
                </div>
              )}
            </CardContent>
          </Card>

          {customer.notes && (
            <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
                <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                  <StarIcon className="size-4" />
                  Internal Operational Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 italic text-[14px] leading-relaxed text-foreground bg-amber-50/50">
                "{customer.notes}"
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                <PhoneIcon className="size-4" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                <p className="text-[16px] font-bold font-mono text-foreground">{customer.phone}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saved Township</p>
                <p className="text-[15px] font-bold text-[var(--fom-accent)] uppercase">
                  {customer.township ?? "Unspecified"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold flex items-center gap-2">
                <MapPinIcon className="size-4" />
                Primary Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[13.5px] font-medium text-foreground leading-relaxed">
                {customer.address ?? "This customer has no saved address history."}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted-foreground font-medium">Registered</span>
                <span className="font-bold">{formatDate(customer.created_at)}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted-foreground font-medium">VIP Status</span>
                {customer.is_vip ? (
                  <PlatformStatusBadge status="active" label="VIP" className="h-4 px-1.5 text-[9px]" />
                ) : (
                  <span className="font-bold text-muted-foreground uppercase tracking-tighter text-[10px]">Standard</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
