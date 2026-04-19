import Link from "next/link"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlusIcon } from "lucide-react"
import {
  getPlatformShops,
  type PlatformCursorPagination,
} from "@/lib/platform/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { PlatformShopsTable } from "./_components/platform-shops-table"
import { Button } from "@workspace/ui/components/button"

type PlatformShopsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformShopsPage({
  searchParams,
}: PlatformShopsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformShops(params)
  const rows = response.data
  const pagination = response.meta?.pagination as PlatformCursorPagination | undefined

  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const plan = getSingleSearchParam(params.plan) ?? ""
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-5">
      <AdminHeader
        title="Shops"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/subscriptions">View subscriptions</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/platform/shops/new">
                <PlusIcon data-icon="inline-start" />
                New Shop
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Total Results"
          value={pagination ? pagination.total.toLocaleString() : rows.length.toLocaleString()}
          detail="Matching active filters"
        />
        <AdminStatCard
          label="Active Shops"
          value={rows.filter((s) => s.status === "active").length.toLocaleString()}
          detail="Ready and operational"
        />
        <AdminStatCard
          label="Risk Alert"
          value={rows.filter((s) => ["overdue", "inactive"].includes(s.status)).length.toLocaleString()}
          detail="Needs attention"
          trend={{ value: "Priority", neutral: true }}
        />
        <AdminStatCard
          label="View Density"
          value={`${rows.length} / ${limit}`}
          detail="Rows per page"
        />
      </div>

      <PlatformShopsTable
        rows={rows}
        currentSearchParams={params}
        pagination={pagination}
        initialFilters={{
          search,
          status,
          plan,
          limit,
        }}
        paginationLinks={
          pagination
            ? {
                previousHref: previousCursor
                  ? buildQueryHref("/platform/shops", params, {
                      cursor: previousCursor,
                    })
                  : currentCursor
                    ? buildQueryHref("/platform/shops", params, {
                        cursor: null,
                      })
                    : null,
                nextHref: pagination.next_cursor
                  ? buildQueryHref("/platform/shops", params, {
                      cursor: pagination.next_cursor,
                    })
                  : null,
              }
            : undefined
        }
      />
    </div>
  )
}
