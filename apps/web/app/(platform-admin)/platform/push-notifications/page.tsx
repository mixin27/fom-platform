import Link from "next/link"
import { BellRing, Smartphone, Users, WifiOff } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getPlatformPushNotifications,
  type PlatformCursorPagination,
} from "@/lib/platform/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { formatDate, formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformPushNotificationsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformPushNotificationsPage({
  searchParams,
}: PlatformPushNotificationsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformPushNotifications(params)
  const data = response.data
  const pagination = data.devices_pagination as PlatformCursorPagination
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(
    getSingleSearchParam(params.limit) ?? pagination.limit ?? 20
  )
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const platform = getSingleSearchParam(params.platform) ?? "all"
  const provider = getSingleSearchParam(params.provider) ?? ""
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Push Notifications"
        title="Push device inventory"
        description="Track which mobile devices are registered for push, which users are reachable, and which devices have gone stale."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/push-notifications/users">
                User coverage
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/notifications">Personal inbox</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Registered devices"
          value={String(data.overview.total_devices)}
          detail={`${data.overview.active_devices} active registrations across the platform.`}
          delta={`${data.overview.total_users} reachable users`}
          icon={BellRing}
          accent="sunset"
        />
        <DashboardStatCard
          title="Mobile split"
          value={String(
            data.overview.android_devices + data.overview.ios_devices
          )}
          detail={`${data.overview.android_devices} Android and ${data.overview.ios_devices} iOS.`}
          delta="Tracked platforms"
          icon={Smartphone}
          accent="teal"
        />
        <DashboardStatCard
          title="Active users"
          value={String(data.overview.active_users)}
          detail="Users with at least one active push device."
          delta={`${data.overview.inactive_devices} inactive devices`}
          icon={Users}
          accent="ink"
        />
        <DashboardStatCard
          title="Stale devices"
          value={String(data.overview.stale_devices)}
          detail="Devices not refreshed in the last 30 days."
          delta="Needs re-registration"
          icon={WifiOff}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Device register"
        description="Registered mobile endpoints"
        rows={data.devices}
        emptyMessage="No push devices match the current filters."
        footer={`Showing ${data.devices.length} device${data.devices.length === 1 ? "" : "s"}`}
        toolbar={
          <form
            className="flex flex-col gap-2 xl:flex-row"
            action="/platform/push-notifications"
          >
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search device, user, or shop..."
              className="h-9 w-full min-w-[220px] xl:w-[260px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              name="platform"
              defaultValue={platform}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
            <Input
              name="provider"
              defaultValue={provider}
              placeholder="Provider (for example fcm)"
              className="h-9 w-full min-w-[180px] xl:w-[220px]"
            />
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
        pagination={{
          previousHref: previousCursor
            ? buildQueryHref("/platform/push-notifications", params, {
                cursor: previousCursor,
              })
            : currentCursor
              ? buildQueryHref("/platform/push-notifications", params, {
                  cursor: null,
                })
              : null,
          nextHref: pagination.next_cursor
            ? buildQueryHref("/platform/push-notifications", params, {
                cursor: pagination.next_cursor,
              })
            : null,
        }}
        columns={[
          {
            key: "device",
            header: "Device",
            render: (device) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {device.device_name || device.device_id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {device.device_id}
                  {device.app_version ? ` · ${device.app_version}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "user",
            header: "User",
            render: (device) => (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {device.user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {device.user.email ??
                    device.user.phone ??
                    "No contact on file"}
                </span>
              </div>
            ),
          },
          {
            key: "shops",
            header: "Shops",
            render: (device) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {device.user.shops[0]?.shop_name ?? "No active shop"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {device.user.active_shop_count} active shop
                  {device.user.active_shop_count === 1 ? "" : "s"}
                </span>
              </div>
            ),
          },
          {
            key: "stack",
            header: "Stack",
            render: (device) => (
              <div className="flex flex-wrap gap-2">
                <PlatformStatusBadge
                  status={device.platform}
                  label={device.platform}
                />
                <PlatformStatusBadge
                  status={device.provider}
                  label={device.provider}
                />
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (device) => (
              <div className="flex flex-col gap-1">
                <PlatformStatusBadge
                  status={device.is_active ? "active" : "inactive"}
                  label={device.is_active ? "active" : "inactive"}
                />
                <span className="text-xs text-muted-foreground">
                  {device.session_active
                    ? "Session linked"
                    : "No active session"}
                </span>
              </div>
            ),
          },
          {
            key: "seen",
            header: "Seen",
            render: (device) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {formatRelativeDate(device.last_seen_at)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Registered {formatDate(device.created_at)}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (device) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/users/${device.user.id}`}>User</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
