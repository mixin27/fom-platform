import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopPortalContext } from "@/lib/shop/api"
import { ShopCustomerForm } from "../_components/shop-customer-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default async function ShopCustomerNewPage() {
  const { activeShop } = await getShopPortalContext()

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Add Customer"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/customers">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to List
            </Link>
          </Button>
        }
      />

      <div className="max-w-xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Base Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopCustomerForm shopId={activeShop.id} mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
