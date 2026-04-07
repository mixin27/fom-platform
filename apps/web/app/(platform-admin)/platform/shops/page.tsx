import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformShops } from "@/lib/platform/api"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformShopsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformShopsPage({
  searchParams,
}: PlatformShopsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformShops(params)
  const rows = response.data
  const pagination = response.meta?.pagination as
    | {
        limit: number
        cursor: string | null
        next_cursor: string | null
        total: number
      }
    | undefined

  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const status = getSingleSearchParam(params.status) ?? "all"
  const plan = getSingleSearchParam(params.plan) ?? ""
  const search = getSingleSearchParam(params.search) ?? ""

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Shops"
        title="Tenant management"
        description="Search, filter, and review shop health from the platform workspace."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/subscriptions">View subscriptions</Link>
          </Button>
        }
      />

      <PlatformDataTable
        title="Shop list and health"
        description="Registered shops"
        rows={rows}
        emptyMessage="No shops match the current filters."
        toolbar={
          <form className="flex flex-col gap-2 sm:flex-row" action="/platform/shops">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search shops, owner, township..."
              className="h-9 w-full min-w-[220px] sm:w-[240px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expiring">Expiring</option>
              <option value="overdue">Overdue</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              name="plan"
              defaultValue={plan}
              className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
            >
              <option value="">All plans</option>
              <option value="trial">Free Trial</option>
              <option value="pro_monthly">Pro Monthly</option>
              <option value="pro_yearly">Pro Yearly</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
        footer={
          pagination
            ? `Showing ${rows.length} of ${pagination.total} shops`
            : `Showing ${rows.length} shops`
        }
        pagination={
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
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (shop) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--fom-ink)]">
                  {shop.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shop.owner_name}
                  {shop.owner_email ? ` · ${shop.owner_email}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (shop) => shop.plan_name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (shop) => <PlatformStatusBadge status={shop.status} />,
          },
          {
            key: "orders",
            header: "Orders",
            render: (shop) => shop.total_orders.toLocaleString(),
          },
          {
            key: "customers",
            header: "Customers",
            render: (shop) => shop.customer_count.toLocaleString(),
          },
          {
            key: "revenue",
            header: "Revenue",
            render: (shop) => formatCurrency(shop.total_revenue),
          },
          {
            key: "last_active",
            header: "Last active",
            render: (shop) => formatRelativeDate(shop.last_active_at),
          },
          {
            key: "joined",
            header: "Joined",
            render: (shop) => formatDate(shop.joined_at),
          },
        ]}
      />
    </div>
  )
}
