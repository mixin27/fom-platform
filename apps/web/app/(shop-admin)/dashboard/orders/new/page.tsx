import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopPortalContext } from "@/lib/shop/api"
import { ShopOrderForm } from "../_components/shop-order-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default async function ShopOrderNewPage() {
  const { activeShop } = await getShopPortalContext()

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Record New Order"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/orders">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Orders
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Manual Order Entry</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopOrderForm shopId={activeShop.id} mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
