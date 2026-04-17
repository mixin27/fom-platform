import Link from "next/link"
import { CreditCard, Receipt, Shield, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPublicLaunchConfig } from "@/lib/launch/api"
import {
  getShopBilling,
  getShopPortalContext,
  type ShopBilling,
} from "@/lib/shop/api"
import { formatCodeLabel } from "@/lib/shop/format"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type ShopBillingPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

function canShowPayAction(billing: ShopBilling, invoiceStatus: string) {
  return billing.payment_provider.is_enabled && invoiceStatus !== "paid"
}

export default async function ShopBillingPage({
  searchParams,
}: ShopBillingPageProps) {
  const params = (await searchParams) ?? {}
  const returnTo = "/dashboard/billing"
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const [billingResponse, launchConfig] = await Promise.all([
    canManageShop ? getShopBilling(returnTo) : Promise.resolve(null),
    getPublicLaunchConfig(),
  ])
  const billing = billingResponse?.data ?? null
  const isForbidden = billingResponse?.meta?.forbidden === true
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)

  if (!canManageShop || isForbidden || !billing) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Billing"
          title="Billing & Subscription"
          description="This workspace is available to shop managers with billing visibility."
        />
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader>
            <CardTitle>Billing access is restricted</CardTitle>
            <CardDescription>
              Open this page with a shop manager account to review plan status,
              invoices, and MyanMyanPay payment sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Back to settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const enabledItems = billing.plan?.items.filter(
    (item) => item.availability_status === "available"
  )

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Billing"
        title="Billing & Subscription"
        description="Review the active plan, invoice history, and direct MyanMyanPay payment flow for this shop."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/settings">Settings</Link>
          </Button>
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

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Current plan"
          value={billing.overview.plan_name ?? "No plan"}
          detail={
            billing.overview.plan_price != null && billing.overview.plan_currency
              ? `${formatCurrency(
                  billing.overview.plan_price,
                  billing.overview.plan_currency
                )} · ${billing.overview.billing_period ?? "custom"}`
              : "No billing plan is attached to this shop yet."
          }
          delta={billing.overview.plan_code ?? "billing"}
          icon={WalletCards}
          accent="sunset"
        />
        <DashboardStatCard
          title="Subscription state"
          value={formatCodeLabel(billing.overview.status ?? "inactive")}
          detail={
            billing.overview.current_period_end
              ? `Current period ends ${formatDate(
                  billing.overview.current_period_end
                )}.`
              : "No renewal date is currently scheduled."
          }
          delta={
            billing.overview.auto_renews ? "Auto renew enabled" : "Manual renewal"
          }
          icon={Shield}
          accent="teal"
        />
        <DashboardStatCard
          title="Outstanding balance"
          value={formatCurrency(billing.overview.outstanding_balance)}
          detail="Pending and overdue invoices that still need attention."
          delta={`${billing.overview.overdue_invoice_count} overdue`}
          icon={CreditCard}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Payment flow</CardDescription>
            <CardTitle>How billing works now</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <PlatformStatusBadge
                  status={
                    billing.payment_provider.is_enabled ? "active" : "inactive"
                  }
                  label={billing.payment_provider.label}
                />
                <PlatformStatusBadge
                  status={
                    billing.payment_provider.is_enabled ? "confirmed" : "pending"
                  }
                  label={
                    billing.payment_provider.is_enabled
                      ? "Direct payment enabled"
                      : "Provider not configured"
                  }
                />
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {billing.payment_provider.is_enabled
                  ? "Open an invoice to generate or refresh the MyanMyanPay payment session. The subscription updates automatically after the payment webhook is confirmed."
                  : "MyanMyanPay is not configured for this environment yet. Use the support contact below until the direct payment flow is available."}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--fom-orange)]/20 bg-[rgba(249,122,31,0.06)] p-4 text-sm leading-7 text-[var(--fom-ink)]">
              <p className="font-semibold">{launchConfig.billing.title}</p>
              <p className="mt-2 text-muted-foreground">
                {launchConfig.billing.body}
              </p>
              {launchConfig.billing.channels.length > 0 ? (
                <p className="mt-2 text-muted-foreground">
                  Accepted channels: {launchConfig.billing.channels.join(", ")}.
                </p>
              ) : null}
              <Button asChild size="sm" className="mt-4" variant="outline">
                <a href={launchConfig.billing.contact_url}>
                  {launchConfig.billing.contact_label}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Included in your plan</CardDescription>
            <CardTitle>Current feature posture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {(enabledItems ?? []).length > 0 ? (
              enabledItems?.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                No plan features are attached to this shop yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlatformDataTable
        title="Invoices"
        description="Billing records for this shop"
        rows={billing.invoices}
        emptyMessage="No invoices have been created for this shop yet."
        footer={`Showing ${billing.invoices.length} invoice${
          billing.invoices.length === 1 ? "" : "s"
        }`}
        columns={[
          {
            key: "invoice",
            header: "Invoice",
            render: (invoice) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {invoice.invoice_no}
                </span>
                <span className="text-xs text-muted-foreground">
                  Created {formatRelativeDate(invoice.created_at)}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (invoice) => <PlatformStatusBadge status={invoice.status} />,
          },
          {
            key: "provider",
            header: "Payment",
            render: (invoice) =>
              invoice.latest_transaction ? (
                <PlatformStatusBadge
                  status={invoice.latest_transaction.status}
                  label={`${billing.payment_provider.label} ${formatCodeLabel(
                    invoice.latest_transaction.status
                  )}`}
                />
              ) : canShowPayAction(billing, invoice.status) ? (
                <span className="text-xs text-muted-foreground">
                  Not started
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Awaiting action
                </span>
              ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (invoice) =>
              formatCurrency(invoice.amount, invoice.currency),
          },
          {
            key: "due",
            header: "Due",
            render: (invoice) =>
              invoice.due_at ? formatDate(invoice.due_at) : "—",
          },
          {
            key: "paid",
            header: "Paid",
            render: (invoice) =>
              invoice.paid_at ? formatDate(invoice.paid_at) : "—",
          },
          {
            key: "actions",
            header: "",
            className: "w-[130px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (invoice) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/billing/${invoice.id}`}>
                  <Receipt data-icon="inline-start" />
                  View
                </Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
