import Link from "next/link"
import { Shield, Store, Users } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
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
import { formatCodeLabel } from "@/lib/shop/format"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"

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
      <AdminHeader
        title="Users"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/shops">Manage Shops</Link>
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Users"
          value={String(pagination?.total ?? rows.length)}
          detail={`${rows.length} on this page`}
          icon={Users}
        />
        <AdminStatCard
          label="Platform Access"
          value={String(platformUsers.length)}
          detail="Internal accounts"
          icon={Shield}
        />
        <AdminStatCard
          label="Shop Owners"
          value={String(shopOwners.length)}
          detail="Primary accounts"
          icon={Store}
        />
        <AdminStatCard
          label="Staff & Members"
          value={String(staffUsers.length + noShopUsers.length)}
          detail="Operator accounts"
          icon={Users}
        />
      </section>

      <AdminDataTable
        title="Account Inventory"
        data={rows}
        emptyMessage="No users found."
        toolbar={
          <form className="flex flex-wrap items-center gap-2" method="get">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email"
              className="w-[200px] h-8 text-[13px]"
            />
            <select
              name="access"
              defaultValue={access}
              className="h-8 rounded-lg border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-2 text-[12px] font-medium"
            >
              <option value="all">All Access</option>
              <option value="platform">Platform</option>
              <option value="shop_owner">Owners</option>
              <option value="staff">Staff</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" className="h-8">
              Filter
            </Button>
          </form>
        }
        columns={[
          {
            key: "user",
            header: "Account",
            render: (user) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">{user.name}</span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {user.email ?? user.phone ?? "No contact info"}
                </span>
              </div>
            ),
          },
          {
            key: "access",
            header: "Permissions",
            render: (user) => (
              <div className="flex flex-wrap gap-1.5">
                <PlatformStatusBadge
                  status={user.access_type === "no_shop" ? "pending" : "active"}
                  label={formatCodeLabel(user.access_type)}
                />
                {user.platform_roles.slice(0, 2).map((role) => (
                  <PlatformStatusBadge
                    key={role.id}
                    status="active"
                    label={role.name}
                  />
                ))}
              </div>
            ),
          },
          {
            key: "shops",
            header: "Linked Shops",
            render: (user) => (
              <span className="font-medium text-foreground">
                {user.active_shop_count} active access
              </span>
            ),
          },
          {
            key: "activity",
            header: "Activity",
            render: (user) => (
              <span className="text-muted-foreground font-medium">
                {user.last_active_at
                  ? formatRelativeDate(user.last_active_at)
                  : "Never"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (user) => (
              <div className="flex justify-end">
                <Button asChild size="xs" variant="ghost" className="h-8 px-2 font-bold text-[var(--fom-accent)]">
                  <Link href={`/platform/users/${user.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ),
          },
        ]}
        footer={
          pagination && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Showing {rows.length} accounts
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    {previousCursor ? (
                      <PaginationPrevious href={buildQueryHref("/platform/users", params, { cursor: previousCursor })} />
                    ) : (
                      <PaginationPrevious className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {pagination.next_cursor ? (
                      <PaginationNext href={buildQueryHref("/platform/users", params, { cursor: pagination.next_cursor })} />
                    ) : (
                      <PaginationNext className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )
        }
      />
    </div>
  )
}
