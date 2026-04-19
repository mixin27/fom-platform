"use client"

import { Calendar, Shield, WalletCards } from "lucide-react"

import { type ShopBilling } from "@/lib/shop/api"
import { formatCurrency, formatDate } from "@/lib/platform/format"
import { formatCodeLabel } from "@/lib/shop/format"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

interface SubscriptionStatusCardProps {
  overview: ShopBilling["overview"]
  onManageClick: () => void
  isShowingPlans: boolean
}

export function SubscriptionStatusCard({
  overview,
  onManageClick,
  isShowingPlans,
}: SubscriptionStatusCardProps) {
  const isOverdue = overview.status === "overdue"
  const isExpired = overview.status === "expired"

  return (
    <Card className="overflow-hidden border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-sm">
      <CardHeader className="border-b border-[var(--fom-border-subtle)] bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Subscription</CardTitle>
          <div className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isOverdue ? "bg-amber-500/10 text-amber-600" : 
            isExpired ? "bg-rose-500/10 text-rose-600" : 
            "bg-emerald-500/10 text-emerald-600"
          )}>
            {formatCodeLabel(overview.status ?? "inactive")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600">
              <WalletCards className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</p>
              <h3 className="mt-1 text-lg font-bold text-[var(--fom-ink)]">
                {overview.plan_name || "No Active Plan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {overview.plan_price != null
                  ? `${formatCurrency(overview.plan_price, overview.plan_currency || 'MMK')} / ${overview.billing_period}`
                  : "Pick a plan to get started"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={cn(
              "rounded-xl p-2.5",
              isOverdue || isExpired ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
            )}>
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renewal Date</p>
              <h3 className={cn(
                "mt-1 text-lg font-bold",
                isOverdue || isExpired ? "text-rose-600" : "text-[var(--fom-ink)]"
              )}>
                {overview.current_period_end ? formatDate(overview.current_period_end) : "Never"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {overview.auto_renews ? "Renews automatically" : "Manual renewal required"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Access Status</p>
              <h3 className="mt-1 text-lg font-bold text-[var(--fom-ink)]">
                {isExpired ? "Restricted" : "Full Access"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isOverdue ? "Grace period active" : "Everything is operational"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[var(--fom-border-subtle)] pt-6">
          <p className="text-xs text-muted-foreground">
            Looking to change your commitment? You can switch plans at any time.
          </p>
          <Button 
            onClick={onManageClick}
            variant={isShowingPlans ? "outline" : "default"}
            className={cn(!isShowingPlans && "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]")}
          >
            {isShowingPlans ? "Cancel Selection" : (overview.plan_code ? "Change Plan" : "Choose Plan")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
