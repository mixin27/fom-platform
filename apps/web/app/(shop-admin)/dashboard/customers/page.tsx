import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopCustomers,
  getShopPortalContext,
  type ShopCursorPagination,
} from "@/lib/shop/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import {
  formatCurrency,
  formatPercent,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PlusIcon, UserIcon, MapPinIcon, BadgeCheckIcon } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import Link from "next/link"

type CustomersPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/customers", params, {})
  const [{ activeShop }, customersResponse] = await Promise.all([
    getShopPortalContext(),
    getShopCustomers(params, currentHref),
  ])
  const rows = customersResponse.data
  const pagination = customersResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const search = getSingleSearchParam(params.search) ?? ""
  const segment = getSingleSearchParam(params.segment) ?? "all"
  const sort = getSingleSearchParam(params.sort) ?? "recent"
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canWriteCustomers = permissions.has("customers.write")
  const vipCount = rows.filter((customer) => customer.is_vip).length
  const newCount = rows.filter((customer) => customer.is_new_this_week).length
  const repeatRate =
    rows.length > 0
      ? rows.reduce((sum, customer) => sum + customer.delivered_rate, 0) /
        rows.length /
        100
      : 0
  const townshipCounts = rows.reduce<Record<string, number>>((accumulator, customer) => {
    if (!customer.township) {
      return accumulator
    }

    accumulator[customer.township] = (accumulator[customer.township] ?? 0) + 1
    return accumulator
  }, {})
  const topTownship =
    Object.entries(townshipCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "—"

  return (
    <div className="flex flex-col gap-5">
      <AdminHeader
        title="Customers"
        actions={
          canWriteCustomers && (
            <Button asChild size="sm">
              <Link href="/dashboard/customers/new">
                <PlusIcon data-icon="inline-start" />
                New Customer
              </Link>
            </Button>
          )
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
        <AdminStatCard
          label="Retention Rate"
          value={formatPercent(repeatRate)}
          detail={`${vipCount} VIP buyers`}
          icon={BadgeCheckIcon}
          trend={{ value: "Stable", neutral: true }}
        />
        <AdminStatCard
          label="Total Database"
          value={String(rows.length)}
          detail={`${newCount} new this week`}
          icon={UserIcon}
        />
        <AdminStatCard
          label="Hot Location"
          value={topTownship}
          detail="Most frequent mailing township"
          icon={MapPinIcon}
        />
      </section>

      <AdminDataTable
        title="Contact Ledger"
        data={rows}
        emptyMessage="No customer records found."
        toolbar={
          <form method="GET" className="flex flex-wrap items-center gap-2">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by Name or Phone"
              className="h-8 w-[200px] text-[13px]"
            />
            <select
              name="segment"
              defaultValue={segment}
              className="h-8 rounded-lg border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-2 text-[12px] font-medium"
            >
              <option value="all">Every Customer</option>
              <option value="vip">Only VIP</option>
              <option value="new_this_week">Recent Joiners</option>
              <option value="top_spenders">High Rollers</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="h-8 rounded-lg border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-2 text-[12px] font-medium"
            >
              <option value="recent">Recent Entry</option>
              <option value="top_spenders">Highest Value</option>
              <option value="name">Alphabetical</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" className="h-8">
              Filter
            </Button>
          </form>
        }
        columns={[
          {
            key: "customer",
            header: "Profile",
            render: (customer) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {customer.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium font-mono">
                  {customer.phone}
                </span>
              </div>
            ),
          },
          {
            key: "location",
            header: "Presence",
            render: (customer) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-foreground">
                  {customer.township ?? "—"}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px]">
                  {customer.address ?? "No address"}
                </span>
              </div>
            ),
          },
          {
            key: "activity",
            header: "Purchases",
            render: (customer) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-foreground">
                  {customer.total_orders} orders
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {customer.last_order_at ? `Last ${formatRelativeDate(customer.last_order_at)}` : "No orders"}
                </span>
              </div>
            ),
          },
          {
            key: "value",
            header: "Total Value",
            render: (customer) => (
              <span className="font-bold text-foreground">
                {formatCurrency(customer.total_spent)}
              </span>
            ),
          },
          {
            key: "flags",
            header: "Badges",
            render: (customer) => (
              <div className="flex flex-wrap gap-1">
                {customer.is_vip && (
                  <PlatformStatusBadge status="active" label="VIP" className="h-4 px-1.5 text-[9px]" />
                )}
                <PlatformStatusBadge
                  status={customer.delivered_rate >= 70 ? "active" : "pending"}
                  label={`${Math.round(customer.delivered_rate)}% rate`}
                  className="h-4 px-1.5 text-[9px]"
                />
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (customer) => (
              <div className="flex justify-end">
                <Button asChild size="xs" variant="ghost" className="h-7 px-2 font-bold text-muted-foreground hover:text-foreground">
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    Manage
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
                Showing {rows.length} customers
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    {previousCursor ? (
                      <PaginationPrevious href={buildQueryHref("/dashboard/customers", params, { cursor: previousCursor })} />
                    ) : (
                      <PaginationPrevious className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {pagination.next_cursor ? (
                      <PaginationNext href={buildQueryHref("/dashboard/customers", params, { cursor: pagination.next_cursor })} />
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
