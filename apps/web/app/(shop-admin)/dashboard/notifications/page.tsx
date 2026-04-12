import Link from "next/link"

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferencesAction,
} from "@/app/actions"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  getPortalNotifications,
} from "@/lib/notifications/api"
import { formatRelativeDate } from "@/lib/platform/format"
import { getShopPortalContext } from "@/lib/shop/api"
import {
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import { Bell, BellRing, Mail } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type ShopNotificationsPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

function resolveShopNotificationHref(actionType: string | null, actionTarget: string | null) {
  if (!actionTarget) {
    return null
  }

  if (actionType === "report" || actionTarget.startsWith("/reports")) {
    return "/dashboard/reports"
  }

  if (actionType === "order" || actionTarget.startsWith("/orders")) {
    return "/dashboard/orders"
  }

  if (actionTarget.startsWith("/deliveries")) {
    return "/dashboard/deliveries"
  }

  return "/dashboard"
}

export default async function ShopNotificationsPage({
  searchParams,
}: ShopNotificationsPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = "/dashboard/notifications"
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const { activeShop } = await getShopPortalContext()
  const [notificationsResponse, unreadResponse, preferencesResponse] =
    await Promise.all([
      getPortalNotifications({
        requiredAccess: "shop",
        retryPath: currentHref,
        searchParams: {
          shop_id: activeShop.id,
        },
      }),
      getNotificationUnreadCount({
        requiredAccess: "shop",
        retryPath: currentHref,
        searchParams: {
          shop_id: activeShop.id,
        },
      }),
      getNotificationPreferences({
        requiredAccess: "shop",
        retryPath: currentHref,
      }),
    ])

  const notifications = notificationsResponse.data
  const preferences = preferencesResponse.data.preferences
  const unreadCount = unreadResponse.data.unread_count
  const emailEnabledCount = preferences.filter((item) => item.email_enabled).length
  const inAppEnabledCount = preferences.filter((item) => item.in_app_enabled).length

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Notifications"
        title="Inbox and delivery preferences"
        description="Track shop activity, clear unread items, and decide which categories also go to email."
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice.replaceAll("_", " ")}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error.replaceAll("_", " ")}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Unread"
          value={String(unreadCount)}
          detail="Unread notifications for the active shop context."
          delta={activeShop.name}
          icon={BellRing}
          accent="sunset"
        />
        <DashboardStatCard
          title="In-app categories"
          value={String(inAppEnabledCount)}
          detail="Categories currently shown inside the inbox."
          delta={`${preferences.length} total`}
          icon={Bell}
          accent="teal"
        />
        <DashboardStatCard
          title="Email categories"
          value={String(emailEnabledCount)}
          detail="Categories that also generate email delivery."
          delta="User preference"
          icon={Mail}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>Active shop inbox</CardDescription>
                <CardTitle>Recent notifications</CardTitle>
              </div>
              <form action={markAllNotificationsReadAction}>
                <input type="hidden" name="returnTo" value={currentHref} />
                <input type="hidden" name="requiredAccess" value="shop" />
                <input type="hidden" name="shopId" value={activeShop.id} />
                <Button type="submit" size="sm" variant="outline">
                  Mark all read
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const href = resolveShopNotificationHref(
                  notification.action_type,
                  notification.action_target
                )

                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      notification.is_read
                        ? "border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)]"
                        : "border-transparent bg-muted/5 hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--fom-ink)]">
                            {notification.title}
                          </p>
                          <PlatformStatusBadge
                            status={notification.category}
                            label={notification.category}
                          />
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {href ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>Open</Link>
                          </Button>
                        ) : null}
                        {!notification.is_read ? (
                          <form action={markNotificationReadAction}>
                            <input
                              type="hidden"
                              name="notificationId"
                              value={notification.id}
                            />
                            <input type="hidden" name="returnTo" value={currentHref} />
                            <input type="hidden" name="requiredAccess" value="shop" />
                            <Button type="submit" size="sm">
                              Mark read
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-4 py-8 text-sm text-muted-foreground">
                No notifications are available for the current shop yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Preferences</CardDescription>
            <CardTitle>Notification channels</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form action={updateNotificationPreferencesAction} className="flex flex-col gap-3">
              <input type="hidden" name="returnTo" value={currentHref} />
              <input type="hidden" name="requiredAccess" value="shop" />
              <input
                type="hidden"
                name="categories"
                value={preferences.map((item) => item.category).join(",")}
              />
              {preferences.map((preference) => (
                <div
                  key={preference.category}
                  className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--fom-ink)]">{preference.label}</p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {preference.description ?? "No description provided."}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        name={`inApp:${preference.category}`}
                        defaultChecked={preference.in_app_enabled}
                      />
                      In-app
                    </label>
                    <label className="inline-flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        name={`email:${preference.category}`}
                        defaultChecked={preference.email_enabled}
                      />
                      Email
                    </label>
                  </div>
                </div>
              ))}
              <Button type="submit">Save preferences</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
