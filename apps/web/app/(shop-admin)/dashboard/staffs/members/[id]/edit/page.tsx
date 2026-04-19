import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getShopMember, getShopPortalContext, getShopRoles } from "@/lib/shop/api"
import { ShopMemberForm } from "../../../_components/shop-member-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface ShopMemberEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopMemberEditPage({
  params,
}: ShopMemberEditPageProps) {
  const { id } = await params
  const { activeShop } = await getShopPortalContext()
  const [memberResponse, rolesResponse] = await Promise.all([
    getShopMember(id),
    getShopRoles(),
  ])
  const member = memberResponse.data
  const roles = rolesResponse.data.roles

  if (!member) {
    if (memberResponse.meta?.forbidden) {
      return (
        <div className="flex flex-col gap-6">
          <AdminHeader
            title="Staffs"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/staffs">
                  <ArrowLeftIcon data-icon="inline-start" />
                  Back to Staffs
                </Link>
              </Button>
            }
          />

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <CardTitle className="text-lg font-bold">
                Team management is not enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
              {String(memberResponse.meta?.message ?? "").trim() ||
                "This subscription plan does not include team member management."}
            </CardContent>
          </Card>
        </div>
      )
    }

    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Edit ${member.user.name}`}
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
            <CardTitle className="text-lg font-bold">Access Adjustment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ShopMemberForm shopId={activeShop.id} roles={roles} member={member} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
