import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Link2,
  MessageSquareText,
  PlugZap,
  Unplug,
} from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { disconnectShopMessengerConnectionFromFormAction } from "@/app/(shop-admin)/dashboard/actions"
import {
  getShopMessengerAutoReplyRules,
  getShopMessengerOverview,
  getShopMessengerThreads,
  getShopPortalContext,
  type ShopCursorPagination,
} from "@/lib/shop/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type ShopInboxPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopInboxPage({
  searchParams,
}: ShopInboxPageProps) {
  const params = (await searchParams) ?? {}
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageConnection = permissions.has("shops.write")
  const canReadInbox = permissions.has("orders.read")
  const canReadRules = permissions.has("templates.read")
  const canManageRules = permissions.has("templates.write")
  const search = getSingleSearchParam(params.search) ?? ""

  const overviewResponse = await getShopMessengerOverview("/dashboard/inbox", true)

  if (!overviewResponse.data || !canReadInbox) {
    return (
      <div className="flex flex-col gap-5">
        <PageIntro
          eyebrow="Inbox"
          title="Messenger inbox"
          description="Connect a Facebook Page, review incoming conversations, and turn inbound message history into order drafts."
        />

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader>
            <CardDescription>Access required</CardDescription>
            <CardTitle>Inbox access is not available</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {String(overviewResponse.meta?.message ?? "").trim() ||
              "This shop plan or your current role does not allow the Messenger inbox yet."}
          </CardContent>
        </Card>
      </div>
    )
  }

  const [threadsResponse, rulesResponse] = await Promise.all([
    getShopMessengerThreads(params, buildQueryHref("/dashboard/inbox", params, {})),
    canReadRules
      ? getShopMessengerAutoReplyRules("/dashboard/inbox")
      : Promise.resolve({ success: true, data: { rules: [] } }),
  ])

  const overview = overviewResponse.data
  const threads = threadsResponse.data
  const rules = rulesResponse.data.rules
  const pagination = threadsResponse.meta?.pagination as
    | ShopCursorPagination
    | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Inbox"
        title="Messenger inbox"
        description="Connect your Facebook Page, review conversations, and turn messages into orders."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageRules ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/inbox/rules/new">
                  New auto reply rule
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders/paste-from-messenger">
                Paste from Messenger
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Connected page"
          value={overview.connection?.page_name ?? "Not connected"}
          detail={overview.connection?.page_id ?? "Connect your Facebook Page to start syncing."}
          delta={overview.connection?.status ?? "inactive"}
          icon={PlugZap}
          accent="sunset"
        />
        <DashboardStatCard
          title="Threads"
          value={String(overview.stats.thread_count)}
          detail="Messenger conversations synced into this shop."
          delta="Inbox threads"
          icon={MessageSquareText}
          accent="teal"
        />
        <DashboardStatCard
          title="Unread"
          value={String(overview.stats.unread_count)}
          detail="Inbound messages still waiting for review."
          delta="Needs follow-up"
          icon={Link2}
          accent="ink"
        />
        <DashboardStatCard
          title="Auto reply rules"
          value={String(overview.stats.auto_reply_rule_count)}
          detail="Keyword-based replies for common questions."
          delta={canManageRules ? "Automation enabled" : "Read only"}
          icon={Bot}
          accent="default"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Connection</CardDescription>
            <CardTitle>Facebook Page</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canManageConnection ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
                  {overview.connection ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlatformStatusBadge status="active" label="Connected" />
                        <PlatformStatusBadge
                          status={overview.connection.status}
                          label={overview.connection.page_name}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {overview.connection.page_name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {overview.connection.page_id}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Reconnect if you changed permissions or want to switch to another Page.
                      </p>
                    </div>
                  ) : overview.setup.oauth_connect_enabled ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="size-4 text-[var(--fom-orange)]" />
                        <p className="text-sm font-semibold">
                          One-click Facebook connection
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Click connect, finish the Facebook screens, and FOM will handle the Page setup automatically.
                        If the Facebook account manages more than one Page, you will choose the Page once.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <PlatformStatusBadge
                        status="pending"
                        label="Platform setup required"
                      />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Messenger OAuth is not configured on this environment yet.
                        Ask the platform admin to complete the Meta app setup first.
                      </p>
                    </div>
                  )}
                </div>

                {overview.setup.oauth_connect_enabled ? (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href="/dashboard/inbox/connect-meta">
                        {overview.connection ? "Reconnect Page" : "Connect Facebook Page"}
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                    {overview.connection ? (
                      <form action={disconnectShopMessengerConnectionFromFormAction}>
                        <input type="hidden" name="return_to" value="/dashboard/inbox" />
                        <input type="hidden" name="shop_id" value={activeShop.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <Unplug data-icon="inline-start" />
                          Disconnect
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm leading-7 text-muted-foreground">
                <p>{overview.connection?.page_name ?? "No page connected."}</p>
                <p>{overview.connection?.page_id ?? "Page ID unavailable."}</p>
                <p className="mt-2">
                  Your role can view the connection status but cannot change shop integrations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Setup</CardDescription>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            <div className="flex flex-wrap gap-2">
              <PlatformStatusBadge
                status={overview.setup.verify_token_configured ? "active" : "pending"}
                label={
                  overview.setup.verify_token_configured
                    ? "Verify token ready"
                    : "Verify token missing"
                }
              />
              <PlatformStatusBadge
                status={
                  overview.setup.signature_validation_enabled ? "active" : "pending"
                }
                label={
                  overview.setup.signature_validation_enabled
                    ? "Signature check on"
                    : "Signature check off"
                }
              />
            </div>
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-muted-foreground">
              <p className="font-medium text-foreground">Environment</p>
              <p className="mt-2">
                OAuth connect:{" "}
                {overview.setup.oauth_connect_enabled
                  ? "configured"
                  : "missing Meta app environment variables"}
              </p>
              <p className="mt-2">Graph API version: {overview.setup.graph_api_version}</p>
              <p className="mt-2 break-all text-[12px]">
                Webhook URL: {overview.setup.webhook_url}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PlatformDataTable
        title="Inbox threads"
        description="Latest Messenger conversations for this shop"
        rows={threads}
        emptyMessage="No Messenger threads have been received yet."
        footer={`Showing ${threads.length} thread${threads.length === 1 ? "" : "s"}`}
        toolbar={
          <form method="GET" className="flex flex-wrap gap-2">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search customer, PSID, or message..."
              className="h-9 w-[260px]"
            />
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </form>
        }
        pagination={
          pagination
            ? {
                previousHref: previousCursor
                  ? buildQueryHref("/dashboard/inbox", params, {
                      cursor: previousCursor,
                    })
                  : currentCursor
                    ? buildQueryHref("/dashboard/inbox", params, {
                        cursor: null,
                      })
                    : null,
                nextHref: pagination.next_cursor
                  ? buildQueryHref("/dashboard/inbox", params, {
                      cursor: pagination.next_cursor,
                    })
                  : null,
              }
            : undefined
        }
        columns={[
          {
            key: "customer",
            header: "Customer",
            render: (thread) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {thread.customer_label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {thread.customer_psid}
                </span>
              </div>
            ),
          },
          {
            key: "page",
            header: "Page",
            render: (thread) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {thread.page?.name ?? "No page"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {thread.page?.id ?? "—"}
                </span>
              </div>
            ),
          },
          {
            key: "preview",
            header: "Latest message",
            render: (thread) => (
              <span className="text-sm text-muted-foreground">
                {thread.last_message_text ?? "No text preview"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Unread",
            render: (thread) => (
              <PlatformStatusBadge
                status={thread.unread_count > 0 ? "pending" : "active"}
                label={
                  thread.unread_count > 0
                    ? `${thread.unread_count} unread`
                    : "Reviewed"
                }
              />
            ),
          },
          {
            key: "activity",
            header: "Last activity",
            render: (thread) =>
              thread.last_message_at
                ? formatRelativeDate(thread.last_message_at)
                : "No activity",
          },
          {
            key: "actions",
            header: "",
            className: "w-[180px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (thread) => (
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/inbox/${thread.id}`}>View</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/dashboard/orders/paste-from-messenger?thread_id=${thread.id}`}
                  >
                    Draft order
                  </Link>
                </Button>
              </div>
            ),
          },
        ]}
      />

      <PlatformDataTable
        title="Auto reply rules"
        description="Keyword rules that send Messenger replies automatically"
        rows={rules}
        emptyMessage={
          canReadRules
            ? "No auto reply rules have been created yet."
            : "This role cannot read auto reply rules."
        }
        footer={`Showing ${rules.length} rule${rules.length === 1 ? "" : "s"}`}
        columns={[
          {
            key: "name",
            header: "Rule",
            render: (rule) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{rule.name}</span>
                <span className="text-xs text-muted-foreground">
                  {rule.pattern}
                </span>
              </div>
            ),
          },
          {
            key: "match",
            header: "Match",
            render: (rule) => <PlatformStatusBadge status="confirmed" label={rule.match_type} />,
          },
          {
            key: "reply",
            header: "Reply",
            render: (rule) => (
              <span className="text-sm text-muted-foreground">
                {rule.reply_text}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (rule) => (
              <PlatformStatusBadge
                status={rule.is_active ? "active" : "inactive"}
                label={rule.is_active ? "Active" : "Paused"}
              />
            ),
          },
          {
            key: "triggered",
            header: "Last triggered",
            render: (rule) =>
              rule.last_triggered_at
                ? formatRelativeDate(rule.last_triggered_at)
                : "Never",
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (rule) =>
              canManageRules ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/inbox/rules/${rule.id}`}>Edit</Link>
                </Button>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </div>
  )
}
