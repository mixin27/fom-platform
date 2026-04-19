import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import {
  deleteShopMessengerAutoReplyRuleFromFormAction,
  updateShopMessengerAutoReplyRuleFromFormAction,
} from "@/app/(shop-admin)/dashboard/actions"
import { PageIntro } from "@/components/page-intro"
import { getShopMessengerAutoReplyRule, getShopPortalContext } from "@/lib/shop/api"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
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

type ShopInboxRulePageProps = {
  params: Promise<{
    ruleId: string
  }>
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopInboxRulePage({
  params,
  searchParams,
}: ShopInboxRulePageProps) {
  const { ruleId } = await params
  const query = (await searchParams) ?? {}
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)
  const returnTo = `/dashboard/inbox/rules/${ruleId}`
  const { activeShop } = await getShopPortalContext()
  const canManageRules = activeShop.membership.permissions.includes("templates.write")

  if (!canManageRules) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="Auto reply rule"
          description="Update the keyword match or reply body for a Messenger auto reply rule."
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

  const response = await getShopMessengerAutoReplyRule(ruleId, returnTo)
  if (!response.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="Auto reply rule"
          description="Update the keyword match or reply body for a Messenger auto reply rule."
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
            <CardDescription>Unavailable</CardDescription>
            <CardTitle>Auto reply rule could not be loaded</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {String(response.meta?.message ?? "").trim() ||
              "This automation feature is not available for the current shop plan."}
          </CardContent>
        </Card>
      </div>
    )
  }
  const rule = response.data

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Inbox"
        title={rule.name}
        description="Update the keyword match or reply body for this Messenger auto reply rule."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/inbox">
              <ArrowLeft data-icon="inline-start" />
              Back to inbox
            </Link>
          </Button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Rule setup</CardDescription>
            <CardTitle>Edit auto reply rule</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updateShopMessengerAutoReplyRuleFromFormAction}
              className="grid gap-3 md:grid-cols-2"
            >
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="shop_id" value={activeShop.id} />
              <input type="hidden" name="rule_id" value={rule.id} />
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Rule name
                </label>
                <Input name="name" defaultValue={rule.name} />
              </div>
              <div className="md:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Match type
                </label>
                <select
                  name="match_type"
                  defaultValue={rule.match_type}
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
                <Input name="pattern" defaultValue={rule.pattern} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Reply text
                </label>
                <Textarea
                  name="reply_text"
                  defaultValue={rule.reply_text}
                  className="min-h-[180px]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked={rule.is_active}
                  className="size-4 rounded border border-[var(--fom-border-strong)]"
                />
                Keep this rule active
              </label>
              <div className="md:col-span-2">
                <Button type="submit" size="sm">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Rule lifecycle</CardDescription>
            <CardTitle>Delete this automation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm leading-6 text-muted-foreground">
            <p>
              Deleting the rule stops future automated replies immediately. Existing
              thread history stays unchanged.
            </p>
            <form action={deleteShopMessengerAutoReplyRuleFromFormAction}>
              <input type="hidden" name="return_to" value="/dashboard/inbox" />
              <input type="hidden" name="shop_id" value={activeShop.id} />
              <input type="hidden" name="rule_id" value={rule.id} />
              <Button type="submit" size="sm" variant="outline">
                Delete rule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
