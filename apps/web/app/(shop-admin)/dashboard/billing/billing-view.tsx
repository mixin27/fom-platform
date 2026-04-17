"use client"

import { useState } from "react"
import { type ShopBilling } from "@/lib/shop/api"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/platform/format"
import { formatCodeLabel } from "@/lib/shop/format"
import { Button } from "@workspace/ui/components/button"
import { Receipt } from "lucide-react"
import Link from "next/link"
import { SubscriptionStatusCard } from "@/components/subscription-status-card"
import { PlanSelection } from "@/components/plan-selection"

interface BillingViewProps {
  billing: ShopBilling
  plans: ShopBilling["plans"]
  canManageShop: boolean
}

function canShowPayAction(billing: ShopBilling, invoiceStatus: string) {
  return billing.payment_provider.is_enabled && invoiceStatus !== "paid"
}

export function BillingView({ billing, plans, canManageShop }: BillingViewProps) {
  const [showPlans, setShowPlans] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Billing"
        title="Billing & Subscription"
        description="Manage your shop subscription, renewal periods, and review your payment history."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/settings">Settings</Link>
          </Button>
        }
      />

      <SubscriptionStatusCard 
        overview={billing.overview} 
        isShowingPlans={showPlans}
        onManageClick={() => setShowPlans(!showPlans)}
      />

      {showPlans && (
        <div className="flex animate-in fade-in slide-in-from-top-4 duration-500 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-[var(--fom-ink)]">Available Plans</h2>
            <p className="text-sm text-muted-foreground">Choose the plan that best fits your shop operations.</p>
          </div>
          <PlanSelection plans={plans} currentPlanCode={billing.overview.plan_code} />
        </div>
      )}

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
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link href={`/dashboard/billing/${invoice.id}`}>
                  <Receipt className="mr-2 size-3.5" />
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
