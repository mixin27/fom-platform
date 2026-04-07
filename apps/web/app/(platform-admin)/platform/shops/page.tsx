import Link from "next/link"

import { PageIntro } from "@/components/page-intro"
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
      <PageIntro
        eyebrow="Shops"
        title="Shop management"
        description="Review tenant health, subscription posture, and operational usage from one workspace."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/subscriptions">View subscriptions</Link>
          </Button>
        }
      />

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
