"use client"

import { Check, Lock, ShieldCheck, Zap } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ClientApiError } from "@/features/shared/client/api-client"
import { createShopSubscriptionInvoice } from "@/features/shop/billing/client"
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

interface SubscriptionPaywallProps {
  status: string | null
  plans: ShopBilling["plans"]
}

export function SubscriptionPaywall({
  status,
  plans,
}: SubscriptionPaywallProps) {
  const router = useRouter()
  const createInvoiceMutation = useMutation({
    mutationFn: createShopSubscriptionInvoice,
    onSuccess: (invoice) => {
      toast.success("Invoice created", {
        description: "Please complete your payment via MMQR to reactivate your shop.",
      })
      router.push(`/dashboard/billing/${invoice.id}`)
      router.refresh()
    },
    onError: (error) => {
      toast.error("Unable to initiate subscription", {
        description:
          error instanceof ClientApiError
            ? error.message
            : "Please try again in a moment.",
      })
    },
  })

  if (status !== "expired" && status !== "inactive") {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--fom-portal-bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--fom-orange)]/10 text-[var(--fom-orange)]">
            <Lock className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--fom-ink)] sm:text-4xl">
            Access Restricted
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your shop trial or subscription has expired. Pick a plan below to
            keep using your Facebook Order Manager.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.code}
              className="relative flex flex-col border-[var(--fom-border-subtle)] shadow-xl"
            >
              {plan.code.includes("yearly") && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--fom-orange)] px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                  Best Value
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.currency} / {plan.billing_period}
                  </span>
                </div>
                <ul className="space-y-2.5 text-left">
                  {plan.items.slice(0, 5).map((item) => (
                    <li
                      key={item.code}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <Check className="size-3" />
                      </div>
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                  disabled={createInvoiceMutation.isPending}
                  onClick={() => createInvoiceMutation.mutate(plan.code)}
                >
                  {createInvoiceMutation.variables === plan.code
                    ? "Initiating..."
                    : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 border-t border-[var(--fom-border-subtle)] pt-8 opacity-60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[var(--fom-orange)]" />
            <span className="text-xs font-medium tracking-wider uppercase">
              Secure Payment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-[var(--fom-orange)]" />
            <span className="text-xs font-medium tracking-wider uppercase">
              Instant Activation
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
