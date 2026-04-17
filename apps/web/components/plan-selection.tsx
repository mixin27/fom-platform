"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { initiateSubscriptionAction } from "../app/(shop-admin)/dashboard/billing/actions"
import { type ShopBilling } from "@/lib/shop/api"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PlanSelectionProps {
  plans: ShopBilling["plans"]
  currentPlanCode: string | null
}

export function PlanSelection({ plans, currentPlanCode }: PlanSelectionProps) {
  const router = useRouter()
  const [loadingCode, setLoadingCode] = useState<string | null>(null)

  const handleSelectPlan = async (planCode: string) => {
    setLoadingCode(planCode)
    try {
      const response = await initiateSubscriptionAction(planCode)
      if (response.data) {
        toast.success("Invoice created", {
          description:
            "Please complete your payment via MMQR to activate or renew your plan.",
        })
        router.push(`/dashboard/billing/${response.data.id}`)
      } else if (response.meta?.error) {
        const errorMsg = (response.meta.error as any).message || "Failed to initiate subscription. Please try again."
        toast.error("Subscription Error", {
          description: errorMsg,
        })
      }
    } catch (error) {
      toast.error("Network Error", {
        description: "Failed to connect to the server. Please check your connection.",
      })
    } finally {
      setLoadingCode(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.code === currentPlanCode
        return (
          <Card
            key={plan.code}
            className="flex flex-col border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)]"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase">
                    Active
                  </span>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {plan.currency} / {plan.billing_period}
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.items.slice(0, 5).map((item) => (
                  <li
                    key={item.code}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : "default"}
                disabled={loadingCode !== null}
                onClick={() => !isCurrent && handleSelectPlan(plan.code)}
              >
                {loadingCode === plan.code ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Initiating...
                  </>
                ) : isCurrent ? (
                  "Currently Selected"
                ) : (
                  "Select Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
