import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import { getShopPortalContext } from "@/lib/shop/api"
import { MessengerOrderWorkspace } from "./_components/messenger-order-workspace"
import { Button } from "@workspace/ui/components/button"

export default async function PasteFromMessengerPage() {
  const { activeShop } = await getShopPortalContext()
  const canUseParser = activeShop.membership.permissions.includes("orders.write")

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Orders"
        title="Paste from Messenger"
        description="Turn copied chat text into a structured order draft, review the parsed customer and items, then create the order only after the draft looks correct."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/orders">Back to orders</Link>
          </Button>
        }
      />

      <MessengerOrderWorkspace shopId={activeShop.id} canUseParser={canUseParser} />
    </div>
  )
}
