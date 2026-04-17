import Link from "next/link"
import { ArrowLeft, CreditCard, Receipt, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformPayment } from "@/lib/platform/api"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { getSingleSearchParam, type PlatformSearchParams } from "@/lib/platform/query"
import { updatePlatformPaymentFromFormAction } from "../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type PlatformPaymentPageProps = {
  params: Promise<{
    invoiceId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

export default async function PlatformPaymentPage({
  params,
  searchParams,
}: PlatformPaymentPageProps) {
  const { invoiceId } = await params
  const query = (await searchParams) ?? {}
  const returnTo = `/platform/payments/${invoiceId}`
  const response = await getPlatformPayment(invoiceId, returnTo)
  const payment = response.data
  const latestTransaction = payment.transactions[0] ?? null
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Payments"
        title={payment.invoice_no}
        description="Invoice detail and provider transaction history."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/payments">
              <ArrowLeft data-icon="inline-start" />
              Back to payments
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
          value={formatCurrency(payment.amount, payment.currency)}
          detail={payment.subscription.shop_name}
          delta={payment.subscription.plan_name}
          icon={Receipt}
          accent="sunset"
        />
        <DashboardStatCard
          title="Status"
          value={payment.status}
          detail={payment.due_at ? `Due ${formatDate(payment.due_at)}` : "No due date"}
          delta={payment.paid_at ? `Paid ${formatDate(payment.paid_at)}` : "Unpaid"}
          icon={CreditCard}
          accent="teal"
        />
        <DashboardStatCard
          title="Subscription"
          value={payment.subscription.status}
          detail={`${payment.subscription.shop_name} · ${payment.subscription.billing_period}`}
          delta={
            payment.subscription.end_at
              ? `Renews ${formatDate(payment.subscription.end_at)}`
              : "No renewal date"
          }
          icon={WalletCards}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Invoice context</CardDescription>
            <CardTitle>Shop and owner details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            {[
              { label: "Shop", value: payment.subscription.shop_name },
              { label: "Owner", value: payment.subscription.owner_name },
              {
                label: "Owner email",
                value: payment.subscription.owner_email ?? "No email",
              },
              { label: "Plan", value: payment.subscription.plan_name },
              {
                label: "Created",
                value: formatRelativeDate(payment.created_at),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-[var(--fom-ink)]">
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Edit invoice</CardDescription>
            <CardTitle>Payment state and references</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updatePlatformPaymentFromFormAction}
              className="grid gap-3 md:grid-cols-2"
            >
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="invoice_id" value={payment.id} />
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Amount
                </label>
                <Input
                  name="amount"
                  type="number"
                  min={0}
                  defaultValue={String(payment.amount)}
                />
              </div>
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Currency
                </label>
                <Input name="currency" defaultValue={payment.currency} />
              </div>
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={payment.status}
                  className="h-9 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="overdue">overdue</option>
                  <option value="failed">failed</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Due date
                </label>
                <Input
                  name="due_at"
                  type="date"
                  defaultValue={toDateInputValue(payment.due_at)}
                />
              </div>
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Paid date
                </label>
                <Input
                  name="paid_at"
                  type="date"
                  defaultValue={toDateInputValue(payment.paid_at)}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" size="sm">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {latestTransaction ? (
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Latest provider session</CardDescription>
              <CardTitle>{latestTransaction.provider}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="flex flex-wrap gap-2">
                <PlatformStatusBadge status={latestTransaction.status} />
                {latestTransaction.expires_at ? (
                  <PlatformStatusBadge
                    status="pending"
                    label={`Expires ${formatDate(latestTransaction.expires_at)}`}
                  />
                ) : null}
              </div>
              {latestTransaction.qr_image_url ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--fom-border-subtle)] bg-white p-4">
                  <img
                    src={latestTransaction.qr_image_url}
                    alt="Payment QR"
                    className="mx-auto max-h-[280px] w-full max-w-[260px] object-contain"
                  />
                </div>
              ) : null}
              {latestTransaction.payment_url ? (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={latestTransaction.payment_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open payment link
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <PlatformDataTable
            title="Provider transactions"
            description="Recorded transaction attempts for this invoice"
            rows={payment.transactions}
            emptyMessage="No provider transactions are recorded for this invoice."
            footer={`Showing ${payment.transactions.length} transaction${
              payment.transactions.length === 1 ? "" : "s"
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
                key: "created",
                header: "Created",
                render: (transaction) =>
                  formatRelativeDate(transaction.created_at),
              },
            ]}
          />
        </div>
      ) : (
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader>
            <CardTitle>No provider transactions yet</CardTitle>
            <CardDescription>
              This invoice has not created a payment session yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
