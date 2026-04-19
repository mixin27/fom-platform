import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ArrowRight, Inbox, Link2 } from "lucide-react"

import { completeShopMessengerOauthSelectionFromFormAction } from "@/app/(shop-admin)/dashboard/actions"
import { PageIntro } from "@/components/page-intro"
import {
  decodeShopMessengerOauthSelection,
  formatMessengerOauthErrorMessage,
  SHOP_MESSENGER_OAUTH_SELECTION_COOKIE,
} from "@/lib/messenger/oauth"
import { getActiveShop, requireShopAdmin } from "@/lib/auth/session"
import { getShopMessengerOauthSelectionPages } from "@/lib/shop/api"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

function redirectToInboxWithError(message: string) {
  redirect(`/dashboard/inbox?error=${encodeURIComponent(message)}`)
}

export default async function ShopMessengerConnectSelectionPage() {
  const session = await requireShopAdmin()
  const activeShop = getActiveShop(session)

  if (!activeShop) {
    redirect("/dashboard/inbox?error=Shop context is missing.")
  }

  const cookieStore = await cookies()
  const selection = decodeShopMessengerOauthSelection(
    cookieStore.get(SHOP_MESSENGER_OAUTH_SELECTION_COOKIE)?.value
  )

  if (!selection || selection.shop_id !== activeShop.id) {
    redirectToInboxWithError("Messenger page selection expired.")
  }

  const validSelection = selection as NonNullable<typeof selection>

  let pages: Array<{ page_id: string; page_name: string }> = []

  try {
    const pagesResponse = await getShopMessengerOauthSelectionPages(
      validSelection.selection_token
    )
    pages = pagesResponse.data.pages
  } catch (error) {
    redirectToInboxWithError(
      formatMessengerOauthErrorMessage(
        error,
        "Unable to load Facebook Pages for this Messenger connection."
      )
    )
  }

  if (pages.length === 0) {
    redirectToInboxWithError(
      "Meta did not return any Facebook Pages for this account."
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Inbox"
        title="Select Page"
        description="Choose the Facebook Page that should connect to this shop."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/inbox">
              Back to inbox
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <Card
            key={page.page_id}
            className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none"
          >
            <CardHeader className="pb-3">
              <CardDescription>Facebook Page</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                {page.page_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{page.page_name}</p>
                <p className="mt-2 break-all">{page.page_id}</p>
              </div>
              <form action={completeShopMessengerOauthSelectionFromFormAction}>
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <input
                  type="hidden"
                  name="selection_token"
                  value={validSelection.selection_token}
                />
                <input type="hidden" name="page_id" value={page.page_id} />
                <input type="hidden" name="page_name" value={page.page_name} />
                <Button type="submit" size="sm" className="w-full">
                  Connect this page
                  <Inbox data-icon="inline-end" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
