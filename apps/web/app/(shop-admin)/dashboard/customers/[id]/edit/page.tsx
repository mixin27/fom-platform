import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopCustomer, getShopPortalContext } from "@/lib/shop/api"
import { ShopCustomerForm } from "../../_components/shop-customer-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface ShopCustomerEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopCustomerEditPage({
  params,
}: ShopCustomerEditPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const response = await getShopCustomer(id)
  const customer = response.data

  if (!customer) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Edit ${customer.name}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/customers/${id}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Discard Changes
            </Link>
          </Button>
        }
      />

      <div className="max-w-xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Profile Update</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopCustomerForm shopId={activeShop.id} customer={customer} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
