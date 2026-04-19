"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CreditCard, Receipt, WalletCards } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { ClientApiError } from "@/features/shared/client/api-client"
import {
  fetchPlatformPayment,
  getPlatformPaymentQueryKey,
  updatePlatformPayment,
} from "@/features/platform/payments/client"
import type { PlatformPaymentDetail } from "@/lib/platform/api"
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
import { Input } from "@workspace/ui/components/input"

type PlatformPaymentDetailScreenProps = {
  invoiceId: string
  initialData: PlatformPaymentDetail
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

export function PlatformPaymentDetailScreen({
  invoiceId,
  initialData,
}: PlatformPaymentDetailScreenProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: payment } = useQuery({
    queryKey: getPlatformPaymentQueryKey(invoiceId),
    queryFn: () => fetchPlatformPayment(invoiceId),
    initialData,
  })

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const amount = Number.parseInt(String(formData.get("amount") ?? ""), 10)

      return updatePlatformPayment(invoiceId, {
        amount,
        currency: String(formData.get("currency") ?? "").trim(),
        status: String(formData.get("status") ?? "").trim(),
        dueAt: String(formData.get("due_at") ?? "").trim() || null,
        paidAt: String(formData.get("paid_at") ?? "").trim() || null,
      })
    },
    onSuccess: (nextPayment) => {
      queryClient.setQueryData(
        getPlatformPaymentQueryKey(invoiceId),
        nextPayment
      )
      toast.success("Invoice updated")
      router.refresh()
    },
    onError: (error) => {
      toast.error("Unable to update this invoice", {
        description:
          error instanceof ClientApiError
            ? error.message
            : "Please try again in a moment.",
      })
    },
  })

  const latestTransaction = payment.transactions[0] ?? null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(new FormData(event.currentTarget))
  }

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
          detail={
            payment.due_at ? `Due ${formatDate(payment.due_at)}` : "No due date"
          }
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
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
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
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
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
            <CardDescription>Provider session</CardDescription>
            <CardTitle>No payment session exists yet</CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
