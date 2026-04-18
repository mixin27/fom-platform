import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { ShopBillingInvoiceScreen } from "@/features/shop/billing/components/shop-billing-invoice-screen"
import { getShopBillingInvoice, getShopPortalContext } from "@/lib/shop/api"
import { type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"

type ShopBillingInvoicePageProps = {
  params: Promise<{
    invoiceId: string
  }>
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopBillingInvoicePage({
  params,
  searchParams: _searchParams,
}: ShopBillingInvoicePageProps) {
  const { invoiceId } = await params
  const returnTo = `/dashboard/billing/${invoiceId}`
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const response = canManageShop
    ? await getShopBillingInvoice(invoiceId, returnTo)
    : null
  const invoice = response?.data ?? null
  const isForbidden = response?.meta?.forbidden === true

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

  return <ShopBillingInvoiceScreen invoiceId={invoiceId} initialData={invoice} />
}
