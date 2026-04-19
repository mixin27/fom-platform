import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopPortalContext, getShopRoles } from "@/lib/shop/api"
import { ShopRoleForm } from "../../../_components/shop-role-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface ShopRoleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopRoleEditPage({
  params,
}: ShopRoleEditPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const rolesResponse = await getShopRoles()
  const role = rolesResponse.data.roles.find((r) => r.id === id)
  const availablePermissions = rolesResponse.data.available_permissions

  if (!role) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Edit ${role.name}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/staffs">
              <ArrowLeftIcon data-icon="inline-start" />
              Discard changes
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Role Matrix Update</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopRoleForm
              shopId={activeShop.id}
              availablePermissions={availablePermissions}
              role={role}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
