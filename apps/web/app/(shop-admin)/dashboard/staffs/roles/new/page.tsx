import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopPortalContext, getShopRoles } from "@/lib/shop/api"
import { ShopRoleForm } from "../../_components/shop-role-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default async function ShopRoleNewPage() {
  const { activeShop } = await getShopPortalContext()
  const rolesResponse = await getShopRoles()
  const availablePermissions = rolesResponse.data.available_permissions

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Create Custom Role"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/staffs">
              <ArrowLeftIcon data-icon="inline-start" />
              Discard
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Role Definition</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopRoleForm
              shopId={activeShop.id}
              availablePermissions={availablePermissions}
              mode="create"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
