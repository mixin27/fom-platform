import Link from "next/link"
import { Shield, Store, Users } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getPlatformUsers,
  type PlatformCursorPagination,
} from "@/lib/platform/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { formatCodeLabel, formatList } from "@/lib/shop/format"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformUsersPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformUsersPage({
  searchParams,
}: PlatformUsersPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformUsers(params)
  const rows = response.data
  const pagination = response.meta?.pagination as PlatformCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const search = getSingleSearchParam(params.search) ?? ""
  const access = getSingleSearchParam(params.access) ?? "all"

  const platformUsers = rows.filter((user) => user.access_type === "platform")
  const shopOwners = rows.filter((user) => user.access_type === "shop_owner")
  const staffUsers = rows.filter((user) => user.access_type === "staff")
  const noShopUsers = rows.filter((user) => user.access_type === "no_shop")

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Users"
        title="Users management"
        description="Inspect owner, staff, and internal accounts across the platform with their linked shops, auth methods, and recent activity."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/shops">Shop management</Link>
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Visible users"
          value={String(pagination?.total ?? rows.length)}
          detail="Filtered results in the current workspace view."
          delta={`${rows.length} on this page`}
          icon={Users}
          accent="sunset"
        />
        <DashboardStatCard
          title="Platform access"
          value={String(platformUsers.length)}
          detail="Internal platform accounts on the current page."
          delta={`${shopOwners.length} shop owners`}
          icon={Shield}
          accent="teal"
        />
        <DashboardStatCard
          title="Staff accounts"
          value={String(staffUsers.length)}
          detail="Non-owner shop operators in the current page."
          delta={`${noShopUsers.length} no-shop accounts`}
          icon={Store}
          accent="ink"
        />
        <DashboardStatCard
          title="Owned shops"
          value={String(rows.reduce((sum, user) => sum + user.owned_shop_count, 0))}
          detail="Total owner-linked shops across the visible rows."
          delta={`${rows.reduce((sum, user) => sum + user.active_shop_count, 0)} active memberships`}
          icon={Store}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Workspace users"
        description="Access inventory across the current filtered result set"
        rows={rows}
        emptyMessage="No users matched the current filters."
        footer={`Showing ${rows.length} user${rows.length === 1 ? "" : "s"}`}
        pagination={
          pagination
            ? {
                previousHref: previousCursor
                  ? buildQueryHref("/platform/users", params, {
                      cursor: previousCursor,
                    })
                  : currentCursor
                    ? buildQueryHref("/platform/users", params, {
                        cursor: null,
                      })
                    : null,
                nextHref: pagination.next_cursor
                  ? buildQueryHref("/platform/users", params, {
                      cursor: pagination.next_cursor,
                    })
                  : null,
              }
            : undefined
        }
        toolbar={
          <form className="flex flex-wrap gap-2.5" method="get">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search users or shops"
              className="w-[240px]"
            />
            <select
              name="access"
              defaultValue={access}
              className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
            >
              <option value="all">All access</option>
              <option value="platform">Platform</option>
              <option value="shop_owner">Shop owners</option>
              <option value="staff">Staff</option>
              <option value="no_shop">No shop</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" variant="outline">
              Apply filters
            </Button>
          </form>
        }
        columns={[
          {
            key: "user",
            header: "User",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email ?? user.phone ?? "No primary contact"}
                </span>
              </div>
            ),
          },
          {
            key: "access",
            header: "Access",
            render: (user) => (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <PlatformStatusBadge
                    status={user.access_type === "no_shop" ? "pending" : "active"}
                    label={formatCodeLabel(user.access_type)}
                  />
                  {user.platform_roles.map((role) => (
                    <PlatformStatusBadge
                      key={role.id}
                      status="active"
                      label={role.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.platform_permissions_count} platform permissions
                </p>
              </div>
            ),
          },
          {
            key: "shops",
            header: "Linked shops",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {user.active_shop_count} active access
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatList(
                    user.shops.slice(0, 3).map((shop) => `${shop.shop_name} (${formatCodeLabel(shop.role ?? "member")})`)
                  ) || "No linked shops"}
                </span>
              </div>
            ),
          },
          {
            key: "auth",
            header: "Auth",
            render: (user) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {formatList(user.auth_methods) || "None"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.active_session_count} active sessions
                </span>
              </div>
            ),
          },
          {
            key: "activity",
            header: "Last active",
            render: (user) =>
              user.last_active_at
                ? formatRelativeDate(user.last_active_at)
                : formatRelativeDate(user.created_at),
          },
          {
            key: "actions",
            header: "Actions",
            render: (user) => (
              <div className="flex justify-end">
                {user.email ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/platform/shops?search=${encodeURIComponent(user.email)}`}>
                      Related shops
                    </Link>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No actions</span>
                )}
              </div>
            ),
            className: "w-[140px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
          },
        ]}
      />
    </div>
  )
}
