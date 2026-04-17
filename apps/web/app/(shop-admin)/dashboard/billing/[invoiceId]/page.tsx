import Link from "next/link"
import { ArrowLeft, CreditCard, Receipt, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getShopBillingInvoice, getShopPortalContext } from "@/lib/shop/api"
import { formatCodeLabel } from "@/lib/shop/format"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { createInvoiceMmqrSessionFromFormAction } from "../../actions"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import QRView from "@/components/qr-view"
import { MmqrAutoActivator } from "@/components/mmqr-auto-activator"

type ShopBillingInvoicePageProps = {
  params: Promise<{
    invoiceId: string
  }>
  searchParams?: Promise<ShopSearchParams>
}

function toPaymentActionLabel(hasTransaction: boolean) {
  return hasTransaction ? "Refresh MyanMyanPay QR" : "Generate MyanMyanPay QR"
}

export default async function ShopBillingInvoicePage({
  params,
  searchParams,
}: ShopBillingInvoicePageProps) {
  const { invoiceId } = await params
  const query = (await searchParams) ?? {}
  const returnTo = `/dashboard/billing/${invoiceId}`
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const response = canManageShop
    ? await getShopBillingInvoice(invoiceId, returnTo)
    : null
  const invoice = response?.data ?? null
  const isForbidden = response?.meta?.forbidden === true
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)

  if (!canManageShop || isForbidden || !invoice) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Billing"
          title="Invoice access is restricted"
          description="Open this route with a shop manager account to manage invoice payment."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/billing">
                <ArrowLeft data-icon="inline-start" />
                Back to billing
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const latestTxn = invoice?.latest_transaction
  const needsAutoMmqr =
    invoice?.status === "pending" &&
    (!latestTxn || latestTxn.status === "expired" || latestTxn.status === "failed")

  return (
    <div className="flex flex-1 flex-col gap-8 pb-12">
      <MmqrAutoActivator invoiceId={invoiceId} active={needsAutoMmqr} />
      <PageIntro
        eyebrow="Billing"
        title={invoice.invoice_no}
        description="Invoice detail, payment state, and MyanMyanPay session management."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/billing">
              <ArrowLeft data-icon="inline-start" />
              Back to billing
            </Link>
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
          title="Invoice amount"
          value={formatCurrency(invoice.amount, invoice.currency)}
          detail={invoice.subscription.shop_name}
          delta={invoice.subscription.plan_name}
          icon={Receipt}
          accent="sunset"
        />
        <DashboardStatCard
          title="Invoice status"
          value={formatCodeLabel(invoice.status)}
          detail={
            invoice.due_at
              ? `Due ${formatDate(invoice.due_at)}`
              : "No due date is currently set."
          }
          delta={
            invoice.paid_at ? `Paid ${formatDate(invoice.paid_at)}` : "Unpaid"
          }
          icon={CreditCard}
          accent="teal"
        />
        <DashboardStatCard
          title="Plan cadence"
          value={formatCodeLabel(invoice.subscription.billing_period)}
          detail={`Subscription ${formatCodeLabel(invoice.subscription.status)}`}
          delta={
            invoice.subscription.end_at
              ? `Current period ends ${formatDate(invoice.subscription.end_at)}`
              : "No scheduled end"
          }
          icon={WalletCards}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Invoice context</CardDescription>
            <CardTitle>Subscription and payment details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            {[
              { label: "Shop", value: invoice.subscription.shop_name },
              { label: "Plan", value: invoice.subscription.plan_name },
              {
                label: "Subscription status",
                value: formatCodeLabel(invoice.subscription.status),
              },
              {
                label: "Created",
                value: formatRelativeDate(invoice.created_at),
              },
              {
                label: "Payment method",
                value: invoice.payment_method ?? "Not recorded",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
            <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
              <div className="flex flex-wrap gap-2">
                <PlatformStatusBadge
                  status={
                    invoice.payment_provider.is_enabled ? "active" : "inactive"
                  }
                  label={invoice.payment_provider.label}
                />
                <PlatformStatusBadge status={invoice.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {invoice.payment_provider.is_enabled
                  ? "Generate a fresh QR when you need a new MyanMyanPay session. The latest session and its status stay visible below."
                  : "MyanMyanPay is not configured for this environment yet."}
              </p>
              {invoice.status !== "paid" &&
              invoice.payment_provider.is_enabled ? (
                <form
                  action={createInvoiceMmqrSessionFromFormAction}
                  className="mt-4"
                >
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="shop_id" value={activeShop.id} />
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <Button type="submit" size="sm">
                    {toPaymentActionLabel(invoice.transactions.length > 0)}
                  </Button>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>MyanMyanPay session</CardDescription>
            <CardTitle>Latest payment session</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {invoice.latest_transaction ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <PlatformStatusBadge
                    status={invoice.latest_transaction.status}
                    label={formatCodeLabel(invoice.latest_transaction.status)}
                  />
                  {invoice.latest_transaction.expires_at ? (
                    <PlatformStatusBadge
                      status="pending"
                      label={`Expires ${formatDate(
                        invoice.latest_transaction.expires_at
                      )}`}
                    />
                  ) : null}
                </div>
                {invoice.latest_transaction.qr_image_url ? (
                  <div className="overflow-hidden rounded-2xl border border-[var(--fom-border-subtle)] bg-white p-6">
                    {/* <img
                      src={invoice.latest_transaction.qr_image_url}
                      alt="MyanMyanPay QR"
                      className="mx-auto max-h-[360px] w-full max-w-[320px] object-contain"
                    /> */}
                    <QRView payload={invoice.latest_transaction.qr_image_url} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                    No QR image was returned for the latest session.
                  </div>
                )}
                {invoice.latest_transaction.payment_url ? (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={invoice.latest_transaction.payment_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open payment link
                    </a>
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                No MyanMyanPay session has been created for this invoice yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlatformDataTable
        title="Transaction history"
        description="Payment session attempts for this invoice"
        rows={invoice.transactions}
        emptyMessage="No payment sessions have been created yet."
        footer={`Showing ${invoice.transactions.length} transaction${
          invoice.transactions.length === 1 ? "" : "s"
        }`}
        columns={[
          {
            key: "provider",
            header: "Provider",
            render: (transaction) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {transaction.provider}
                </span>
                <span className="text-xs text-muted-foreground">
                  {transaction.provider_order_id}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (transaction) => (
              <PlatformStatusBadge status={transaction.status} />
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (transaction) =>
              formatCurrency(transaction.amount, transaction.currency),
          },
          {
            key: "expires",
            header: "Expires",
            render: (transaction) =>
              transaction.expires_at ? formatDate(transaction.expires_at) : "—",
          },
          {
            key: "created",
            header: "Created",
            render: (transaction) => formatRelativeDate(transaction.created_at),
          },
        ]}
      />
    </div>
  )
}
