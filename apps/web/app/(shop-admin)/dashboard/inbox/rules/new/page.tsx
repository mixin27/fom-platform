import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createShopMessengerAutoReplyRuleFromFormAction } from "@/app/(shop-admin)/dashboard/actions"
import { PageIntro } from "@/components/page-intro"
import { getShopPortalContext } from "@/lib/shop/api"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

export default async function NewShopInboxRulePage() {
  const { activeShop } = await getShopPortalContext()
  const canManageRules = activeShop.membership.permissions.includes("templates.write")

  if (!canManageRules) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="New auto reply rule"
          description="Create a keyword rule that automatically replies to Messenger customers."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inbox">
                <ArrowLeft data-icon="inline-start" />
                Back to inbox
              </Link>
            </Button>
          }
        />

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader>
            <CardDescription>Access required</CardDescription>
            <CardTitle>Rule management is restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Your current role can view inbox activity, but it cannot create or edit
            auto reply rules.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Inbox"
        title="New auto reply rule"
        description="Create a keyword rule that automatically replies to Messenger customers."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/inbox">
              <ArrowLeft data-icon="inline-start" />
              Back to inbox
            </Link>
          </Button>
        }
      />

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Rule setup</CardDescription>
          <CardTitle>Keyword match and reply content</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form
            action={createShopMessengerAutoReplyRuleFromFormAction}
            className="grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="return_to" value="/dashboard/inbox" />
            <input type="hidden" name="shop_id" value={activeShop.id} />
            <div className="md:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Rule name
              </label>
              <Input name="name" placeholder="Greeting" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Match type
              </label>
              <select
                name="match_type"
                defaultValue="contains"
                className="h-9 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
              >
                <option value="contains">contains</option>
                <option value="exact">exact</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Match pattern
              </label>
              <Input name="pattern" placeholder="price" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Reply text
              </label>
              <Textarea
                name="reply_text"
                placeholder="Our latest price list is available in the pinned catalog post."
                className="min-h-[180px]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked
                className="size-4 rounded border border-[var(--fom-border-strong)]"
              />
              Activate this rule immediately
            </label>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">
                Create rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
