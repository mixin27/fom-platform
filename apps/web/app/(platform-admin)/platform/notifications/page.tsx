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
import {
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { Bell, BellRing, Mail } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type PlatformNotificationsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

function resolvePlatformNotificationHref(actionType: string | null, actionTarget: string | null) {
  if (!actionTarget) {
    return null
  }

  if (actionType === "report" || actionTarget.startsWith("/reports")) {
    return "/platform"
  }

  if (actionType === "order" || actionTarget.startsWith("/orders")) {
    return "/platform/shops"
  }

  return "/platform"
}

export default async function PlatformNotificationsPage({
  searchParams,
}: PlatformNotificationsPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = "/platform/notifications"
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const [notificationsResponse, unreadResponse, preferencesResponse] =
    await Promise.all([
      getPortalNotifications({
        requiredAccess: "platform",
        retryPath: currentHref,
      }),
      getNotificationUnreadCount({
        requiredAccess: "platform",
        retryPath: currentHref,
      }),
      getNotificationPreferences({
        requiredAccess: "platform",
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
        title="Platform inbox and delivery preferences"
        description="Track your personal notification stream, clear unread items, and control which categories also send email."
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
          detail="Unread notifications across the current platform account."
          delta="Personal inbox"
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
          delta="Personal preference"
          icon={Mail}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>Account inbox</CardDescription>
                <CardTitle>Recent notifications</CardTitle>
              </div>
              <form action={markAllNotificationsReadAction}>
                <input type="hidden" name="returnTo" value={currentHref} />
                <input type="hidden" name="requiredAccess" value="platform" />
                <Button type="submit" size="sm" variant="outline">
                  Mark all read
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const href = resolvePlatformNotificationHref(
                  notification.action_type,
                  notification.action_target
                )

                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      notification.is_read
                        ? "border-black/6 bg-[var(--fom-admin-surface)]"
                        : "border-[var(--fom-orange)]/20 bg-[rgba(249,122,31,0.06)]"
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
                            <input type="hidden" name="requiredAccess" value="platform" />
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
              <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--fom-admin-surface)] px-4 py-8 text-sm text-muted-foreground">
                No notifications are available for this account yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Preferences</CardDescription>
            <CardTitle>Notification channels</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form action={updateNotificationPreferencesAction} className="flex flex-col gap-3">
              <input type="hidden" name="returnTo" value={currentHref} />
              <input type="hidden" name="requiredAccess" value="platform" />
              <input
                type="hidden"
                name="categories"
                value={preferences.map((item) => item.category).join(",")}
              />
              {preferences.map((preference) => (
                <div
                  key={preference.category}
                  className="rounded-2xl border border-black/6 bg-[var(--fom-admin-surface)] p-3"
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
