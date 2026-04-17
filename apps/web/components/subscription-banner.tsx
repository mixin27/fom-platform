"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface SubscriptionBannerProps {
  status: string | null
  endAt: string | null
  className?: string
}

export function SubscriptionBanner({
  status,
  endAt,
  className,
}: SubscriptionBannerProps) {
  if (status !== "trialing" || !endAt) {
    return null
  }

  const expiryDate = new Date(endAt)
  const now = new Date()
  const diffDays = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Only show if trial is ending in 3 days or less
  if (diffDays > 3) {
    return null
  }

  return (
    <div
      className={cn(
        "border-b border-[var(--fom-orange)]/15 bg-[rgba(249,122,31,0.08)] px-5 py-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--fom-orange)]/10 text-[var(--fom-orange)]">
            <AlertCircle className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--fom-ink)]">
              Trial ending {diffDays <= 0 ? "today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Upgrade to a paid plan now to keep your shop workspace active and avoid service interruption.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
        >
          <Link href="/dashboard/billing">
            Choose a plan
            <ArrowRight data-icon="inline-end" className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
