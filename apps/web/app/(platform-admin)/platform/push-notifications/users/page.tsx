import Link from "next/link"
import { Layers3, Smartphone, UserCheck, Users } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getPlatformPushNotificationUsers,
  type PlatformCursorPagination,
} from "@/lib/platform/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformPushNotificationUsersPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformPushNotificationUsersPage({
  searchParams,
}: PlatformPushNotificationUsersPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformPushNotificationUsers(params)
  const data = response.data
  const pagination = data.users_pagination as PlatformCursorPagination
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(
    getSingleSearchParam(params.limit) ?? pagination.limit ?? 20
  )
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Push Notifications"
        title="User coverage"
        description="See which platform users have push-capable mobile reachability and how many devices are attached to each account."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/push-notifications">Device register</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/users">All users</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Push users"
          value={String(data.overview.total_users)}
          detail="Accounts with at least one registered push device."
          delta={`${data.overview.total_devices} devices total`}
          icon={Users}
          accent="sunset"
        />
        <DashboardStatCard
          title="Active coverage"
          value={String(data.overview.active_users)}
          detail="Users with at least one currently active device."
          delta={`${data.overview.inactive_users} inactive-only`}
          icon={UserCheck}
          accent="teal"
        />
        <DashboardStatCard
          title="Multi-device"
          value={String(data.overview.multi_device_users)}
          detail="Users connected from more than one device."
          delta="Potential cross-device operators"
          icon={Layers3}
          accent="ink"
        />
        <DashboardStatCard
          title="Average devices"
          value={
            data.overview.total_users > 0
              ? (
                  data.overview.total_devices / data.overview.total_users
                ).toFixed(1)
              : "0.0"
          }
          detail="Average registered devices per reachable user."
          delta="Coverage density"
          icon={Smartphone}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Reachable users"
        description="Push readiness by account"
        rows={data.users}
        emptyMessage="No push-enabled users match the current filters."
        footer={`Showing ${data.users.length} user${data.users.length === 1 ? "" : "s"}`}
        toolbar={
          <form
            className="flex flex-col gap-2 lg:flex-row"
            action="/platform/push-notifications/users"
          >
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search user, contact, or shop..."
              className="h-9 w-full min-w-[220px] lg:w-[280px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All users</option>
              <option value="active">Has active device</option>
              <option value="inactive">Inactive only</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
        pagination={{
          previousHref: previousCursor
            ? buildQueryHref("/platform/push-notifications/users", params, {
                cursor: previousCursor,
              })
            : currentCursor
              ? buildQueryHref("/platform/push-notifications/users", params, {
                  cursor: null,
                })
              : null,
          nextHref: pagination.next_cursor
            ? buildQueryHref("/platform/push-notifications/users", params, {
                cursor: pagination.next_cursor,
              })
            : null,
        }}
        columns={[
          {
            key: "user",
            header: "User",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email ?? user.phone ?? "No contact on file"}
                </span>
              </div>
            ),
          },
          {
            key: "shops",
            header: "Shops",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {user.shops[0]?.shop_name ?? "No active shop"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.active_shop_count} active shop
                  {user.active_shop_count === 1 ? "" : "s"}
                </span>
              </div>
            ),
          },
          {
            key: "devices",
            header: "Devices",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {user.active_devices} active / {user.total_devices} total
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.inactive_devices} inactive
                </span>
              </div>
            ),
          },
          {
            key: "platforms",
            header: "Platforms",
            render: (user) => (
              <div className="flex flex-wrap gap-2">
                {user.platforms.map((platform) => (
                  <PlatformStatusBadge
                    key={platform}
                    status={platform}
                    label={platform}
                  />
                ))}
              </div>
            ),
          },
          {
            key: "providers",
            header: "Providers",
            render: (user) => (
              <div className="flex flex-wrap gap-2">
                {user.providers.map((provider) => (
                  <PlatformStatusBadge
                    key={provider}
                    status={provider}
                    label={provider}
                  />
                ))}
              </div>
            ),
          },
          {
            key: "seen",
            header: "Last seen",
            render: (user) =>
              user.last_seen_at ? formatRelativeDate(user.last_seen_at) : "—",
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (user) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/users/${user.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
