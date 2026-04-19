import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { getPlatformShop } from "@/lib/platform/api"
import { PlatformShopForm } from "../../_components/platform-shop-form"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface PlatformShopEditPageProps {
  params: Promise<{ id: string }>
}

export default async function PlatformShopEditPage({
  params,
}: PlatformShopEditPageProps) {
  const { id } = await params
  const response = await getPlatformShop(id)
  const shop = response.data

  if (!shop) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={`Edit ${shop.name}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/platform/shops/${id}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Details
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="border-b border-[var(--fom-border-subtle)]/50 pb-4">
            <CardTitle className="text-lg font-bold">Shop Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PlatformShopForm mode="edit" shop={shop} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
