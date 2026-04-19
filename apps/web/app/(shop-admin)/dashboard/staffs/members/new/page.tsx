import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopPortalContext, getShopRoles } from "@/lib/shop/api"
import { ShopMemberForm } from "../../_components/shop-member-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default async function ShopMemberNewPage() {
  const { activeShop } = await getShopPortalContext()
  const rolesResponse = await getShopRoles()
  const roles = rolesResponse.data.roles

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Add Team Member"
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
            <CardTitle className="text-lg font-bold">Base Access Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopMemberForm shopId={activeShop.id} roles={roles} mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
