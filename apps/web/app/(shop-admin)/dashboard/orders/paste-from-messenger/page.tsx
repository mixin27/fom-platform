import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import {
  getShopMessengerOrderSource,
  getShopPortalContext,
} from "@/lib/shop/api"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { MessengerOrderWorkspace } from "./_components/messenger-order-workspace"
import { Button } from "@workspace/ui/components/button"

type PasteFromMessengerPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function PasteFromMessengerPage({
  searchParams,
}: PasteFromMessengerPageProps) {
  const { activeShop } = await getShopPortalContext()
  const params = (await searchParams) ?? {}
  const canUseParser = activeShop.membership.permissions.includes("orders.write")
  const threadId = getSingleSearchParam(params.thread_id)
  const sourceResponse = threadId
    ? await getShopMessengerOrderSource(
        threadId,
        `/dashboard/orders/paste-from-messenger?thread_id=${threadId}`
      )
    : null
  const initialMessage = sourceResponse?.data?.message ?? ""
  const initialContextLabel = threadId ? `Messenger thread ${threadId}` : null

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

      <MessengerOrderWorkspace
        shopId={activeShop.id}
        canUseParser={canUseParser}
        initialMessage={initialMessage}
        initialContextLabel={initialContextLabel}
        autoParseOnLoad={Boolean(threadId && initialMessage)}
      />
    </div>
  )
}
