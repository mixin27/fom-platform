import Link from "next/link"
import { ArrowLeft, ArrowRight, Bot, MessageCircleReply, ReceiptText } from "lucide-react"

import {
  markShopMessengerThreadReadFromFormAction,
  sendShopMessengerReplyFromFormAction,
} from "@/app/(shop-admin)/dashboard/actions"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopMessengerThread,
  getShopPortalContext,
} from "@/lib/shop/api"
import { formatRelativeDate } from "@/lib/platform/format"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"

type ShopInboxThreadPageProps = {
  params: Promise<{
    threadId: string
  }>
  searchParams?: Promise<ShopSearchParams>
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function ShopInboxThreadPage({
  params,
  searchParams,
}: ShopInboxThreadPageProps) {
  const { threadId } = await params
  const query = (await searchParams) ?? {}
  const returnTo = `/dashboard/inbox/${threadId}`
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canReadInbox = permissions.has("orders.read")
  const canReply = permissions.has("orders.write")
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)

  if (!canReadInbox) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="Messenger thread"
          description="Review message history, mark the thread as handled, reply manually, or move the customer conversation into the order parser."
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
            <CardTitle>Inbox access is restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Your current role cannot view Messenger inbox threads.
          </CardContent>
        </Card>
      </div>
    )
  }

  const response = await getShopMessengerThread(threadId, returnTo)
  if (!response.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="Messenger thread"
          description="Review message history, mark the thread as handled, reply manually, or move the customer conversation into the order parser."
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
            <CardTitle>Messenger thread could not be loaded</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {String(response.meta?.message ?? "").trim() ||
              "This inbox feature is not available for the current shop plan."}
          </CardContent>
        </Card>
      </div>
    )
  }
  const thread = response.data

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Inbox"
        title={thread.customer_label}
        description="Review message history, mark the thread as handled, reply manually, or move the customer conversation into the order parser."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inbox">
                <ArrowLeft data-icon="inline-start" />
                Back to inbox
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/orders/paste-from-messenger?thread_id=${thread.id}`}>
                Draft order
                <ReceiptText data-icon="inline-end" />
              </Link>
            </Button>
          </div>
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

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Customer"
          value={thread.customer_label}
          detail={thread.customer_psid}
          delta={thread.page?.name ?? thread.connection.page_name}
          icon={Bot}
          accent="sunset"
        />
        <DashboardStatCard
          title="Unread"
          value={String(thread.unread_count)}
          detail={
            thread.last_message_at
              ? `Last activity ${formatRelativeDate(thread.last_message_at)}`
              : "No message activity"
          }
          delta={String(thread.messages.length)}
          icon={MessageCircleReply}
          accent="teal"
        />
        <DashboardStatCard
          title="Connection"
          value={thread.connection.page_name}
          detail={thread.connection.page_id}
          delta={thread.connection.status}
          icon={ReceiptText}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Thread status</CardDescription>
            <CardTitle>Conversation context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            <div className="flex flex-wrap gap-2">
              <PlatformStatusBadge
                status={thread.unread_count > 0 ? "pending" : "active"}
                label={
                  thread.unread_count > 0
                    ? `${thread.unread_count} unread`
                    : "Reviewed"
                }
              />
              <PlatformStatusBadge
                status={thread.connection.status}
                label={thread.connection.status}
              />
            </div>
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
              <p className="font-medium text-foreground">Connected page</p>
              <p className="mt-2 text-muted-foreground">
                {thread.connection.page_name} ({thread.connection.page_id})
              </p>
              <p className="mt-2 text-muted-foreground">
                Webhook activity{" "}
                {thread.connection.last_webhook_at
                  ? formatDateTime(thread.connection.last_webhook_at)
                  : "not received yet"}
              </p>
            </div>
            {thread.unread_count > 0 ? (
              <form action={markShopMessengerThreadReadFromFormAction}>
                <input type="hidden" name="return_to" value={returnTo} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <input type="hidden" name="thread_id" value={thread.id} />
                <Button type="submit" size="sm" variant="outline">
                  Mark thread as read
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Manual reply</CardDescription>
            <CardTitle>Send a text reply to Messenger</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canReply ? (
              <form action={sendShopMessengerReplyFromFormAction} className="flex flex-col gap-3">
                <input type="hidden" name="return_to" value={returnTo} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <input type="hidden" name="thread_id" value={thread.id} />
                <Textarea
                  name="text"
                  placeholder="Type your Messenger reply..."
                  className="min-h-[140px]"
                />
                <Button type="submit" size="sm">
                  Send reply
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </form>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Your current role can review the thread, but it cannot send Messenger replies.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Message history</CardDescription>
          <CardTitle>Conversation timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {thread.messages.length > 0 ? (
            thread.messages.map((message) => {
              const isInbound = message.direction === "inbound"
              return (
                <div
                  key={message.id}
                  className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      isInbound
                        ? "border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)]"
                        : "border-[rgba(249,122,31,0.18)] bg-[rgba(249,122,31,0.08)]"
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <PlatformStatusBadge
                        status={isInbound ? "pending" : "active"}
                        label={isInbound ? "Customer" : "Shop"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.sent_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-foreground">
                      {message.text_body ?? `[${message.message_type}]`}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No messages are stored for this thread yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
