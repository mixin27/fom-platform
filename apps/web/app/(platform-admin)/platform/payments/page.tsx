import Link from "next/link"
import { CreditCard, Receipt, ShieldAlert, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getPlatformPayments,
  type PlatformCursorPagination,
} from "@/lib/platform/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformPaymentsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformPaymentsPage({
  searchParams,
}: PlatformPaymentsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformPayments(params)
  const data = response.data
  const pagination = data.invoices_pagination as PlatformCursorPagination
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Payments"
        title="Payments"
        description="Track invoice status, transaction references, and provider session activity from a dedicated billing workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/subscriptions">Subscriptions</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/support">Support</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total invoices"
          value={String(data.overview.total_invoices)}
          detail="All recorded payment and invoice rows."
          delta={`${data.invoices_pagination.total} in current filter`}
          icon={Receipt}
          accent="sunset"
        />
        <DashboardStatCard
          title="Paid invoices"
          value={String(data.overview.paid_invoices)}
          detail="Invoices already completed."
          delta="Paid"
          icon={CreditCard}
          accent="teal"
        />
        <DashboardStatCard
          title="Pending invoices"
          value={String(data.overview.pending_invoices)}
          detail="Invoices that are still awaiting payment."
          delta="Pending"
          icon={WalletCards}
          accent="ink"
        />
        <DashboardStatCard
          title="Overdue / failed"
          value={String(
            data.overview.overdue_invoices + data.overview.failed_invoices
          )}
          detail={`${data.overview.overdue_invoices} overdue and ${data.overview.failed_invoices} failed.`}
          delta="Needs follow-up"
          icon={ShieldAlert}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Invoice register"
        description="Payment records and follow-up state"
        rows={data.invoices}
        emptyMessage="No invoices match the current filters."
        footer={`Showing ${data.invoices.length} invoice${
          data.invoices.length === 1 ? "" : "s"
        }`}
        toolbar={
          <form className="flex flex-col gap-2 sm:flex-row" action="/platform/payments">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search invoice, shop, or reference..."
              className="h-9 w-full min-w-[220px] sm:w-[260px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
        pagination={{
          previousHref: previousCursor
            ? buildQueryHref("/platform/payments", params, {
                cursor: previousCursor,
              })
            : currentCursor
              ? buildQueryHref("/platform/payments", params, { cursor: null })
              : null,
          nextHref: pagination.next_cursor
            ? buildQueryHref("/platform/payments", params, {
                cursor: pagination.next_cursor,
              })
            : null,
        }}
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
                  {invoice.latest_transaction_id ?? "No provider reference"}
                </span>
              </div>
            ),
          },
          {
            key: "shop",
            header: "Shop",
            render: (invoice) => (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {invoice.shop_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {invoice.plan_name}
                </span>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (invoice) =>
              formatCurrency(invoice.amount, invoice.currency),
          },
          {
            key: "method",
            header: "Method",
            render: (invoice: any) =>
              invoice.latest_transaction_id ? "Provider" : "—",
          },
          {
            key: "status",
            header: "Status",
            render: (invoice) => <PlatformStatusBadge status={invoice.status} />,
          },
          {
            key: "dates",
            header: "Dates",
            render: (invoice) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  Due {invoice.due_at ? formatDate(invoice.due_at) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Updated {formatRelativeDate(invoice.updated_at ?? invoice.created_at)}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (invoice) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/payments/${invoice.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
