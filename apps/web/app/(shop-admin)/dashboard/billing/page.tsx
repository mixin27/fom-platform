import {
  getShopBilling,
  getShopPortalContext,
  getAvailablePlans,
} from "@/lib/shop/api"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import Link from "next/link"
import { PageIntro } from "@/components/page-intro"
import { BillingView } from "./billing-view"

type ShopBillingPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopBillingPage({
  searchParams,
}: ShopBillingPageProps) {
  const params = (await searchParams) ?? {}
  const returnTo = "/dashboard/billing"
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  
  const [billingResponse, plansResponse] = await Promise.all([
    canManageShop ? getShopBilling(returnTo) : Promise.resolve(null),
    canManageShop ? getAvailablePlans(returnTo) : Promise.resolve({ data: [] }),
  ])
  
  const billing = billingResponse?.data ?? null
  const plans = plansResponse?.data ?? []
  const isForbidden = billingResponse?.meta?.forbidden === true
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

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <BillingView 
        billing={billing} 
        plans={plans} 
        canManageShop={canManageShop} 
      />
    </div>
  )
}
