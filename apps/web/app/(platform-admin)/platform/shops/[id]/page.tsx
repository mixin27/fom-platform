import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  CreditCardIcon,
  PencilLineIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformShop } from "@/lib/platform/api"
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

interface PlatformShopDetailPageProps {
  params: Promise<{ id: string }>
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function PlatformShopDetailPage({
  params,
}: PlatformShopDetailPageProps) {
  const { id } = await params
  const response = await getPlatformShop(id)
  const shop = response.data

  if (!shop) {
    notFound()
  }

  const deliveryRate =
    shop.total_orders > 0
      ? Math.round((shop.delivered_orders / shop.total_orders) * 100)
      : 0

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={shop.name}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/shops">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Shops
              </Link>
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href={`/platform/shops/${id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit Shop
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <Avatar size="lg">
                <AvatarFallback className="bg-[var(--fom-accent)]/10 text-[var(--fom-accent)] text-lg font-bold">
                  {getInitials(shop.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold tracking-tight">
                    {shop.name}
                  </CardTitle>
                  <PlatformStatusBadge status={shop.status} />
                </div>
                <CardDescription className="text-sm font-medium">
                  {shop.owner_name} · {shop.owner_email ?? "No email"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Plan & Billing
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground">
                          {shop.plan_name ?? "No active plan"}
                        </span>
                        {shop.billing_period && (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold"
                          >
                            {shop.billing_period}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-foreground">
                          {shop.plan_price !== null
                            ? formatCurrency(
                                shop.plan_price,
                                shop.plan_currency ?? "MMK"
                              )
                            : "Free"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Renewal: {formatDate(shop.current_period_end)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Workspace Details
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Timezone</span>
                        <span className="font-bold">{shop.timezone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Location</span>
                        <span className="font-bold">{shop.township ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Joined</span>
                        <span className="font-bold">{formatDate(shop.joined_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Operational Health
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-foreground">
                          {deliveryRate}% Delivery Rate
                        </span>
                        <span className="text-[11px] font-bold text-[var(--fom-accent)]">
                          {formatCompactNumber(shop.total_orders)} Total Orders
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden border border-[var(--fom-border-subtle)]">
                        <div
                          className="h-full bg-[var(--fom-accent)]"
                          style={{ width: `${deliveryRate}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 text-[11px]">
                        <div>
                          <p className="text-muted-foreground font-medium">Delivered</p>
                          <p className="font-bold text-lg">
                            {formatCompactNumber(shop.delivered_orders)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Sessions</p>
                          <p className="font-bold text-lg">
                            {formatCompactNumber(shop.active_session_count)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Contact Info
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Phone</span>
                        <span className="font-bold font-mono">{shop.owner_phone ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Last Active</span>
                        <span className="font-bold">
                          {formatRelativeDate(shop.last_active_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
              <Link href={`/platform/subscriptions?search=${encodeURIComponent(shop.name)}`}>
                <CreditCardIcon data-icon="inline-start" />
                View Subscription Ledger
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
              <Link href="/platform/support">
                <ChevronRightIcon data-icon="inline-end" />
                Open Support Context
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold">Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <AdminStatCard
                label="Total Revenue"
                value={formatCurrency(shop.total_revenue)}
                className="shadow-none border-none bg-muted/20"
              />
              <div className="grid grid-cols-2 gap-3">
                <AdminStatCard
                  label="Customers"
                  value={formatCompactNumber(shop.customer_count)}
                  className="shadow-none border-none bg-muted/20"
                />
                <AdminStatCard
                  label="Members"
                  value={formatCompactNumber(shop.member_count)}
                  className="shadow-none border-none bg-muted/20"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold">Latest Invoice</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-center">
              {shop.latest_invoice ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {shop.latest_invoice.invoice_no}
                    </span>
                    <PlatformStatusBadge status={shop.latest_invoice.status} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(
                      shop.latest_invoice.amount,
                      shop.latest_invoice.currency
                    )}
                  </p>
                  <div className="flex flex-col gap-1 text-[11px] text-left text-muted-foreground font-medium">
                    <p>Due: {formatDate(shop.latest_invoice.due_at)}</p>
                    <p>Paid: {formatDate(shop.latest_invoice.paid_at)}</p>
                  </div>
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground font-medium">
                  No invoices recorded
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
