import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopOrder, getShopPortalContext } from "@/lib/shop/api"
import { ShopOrderForm } from "../../_components/shop-order-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface ShopOrderEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopOrderEditPage({
  params,
}: ShopOrderEditPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const response = await getShopOrder(id)
  const order = response.data

  if (!order) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Edit ${order.order_no}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/orders/${id}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Discard Changes
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Metadata Update</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopOrderForm shopId={activeShop.id} order={order} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
