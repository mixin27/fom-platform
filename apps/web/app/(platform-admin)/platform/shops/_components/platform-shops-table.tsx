"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUpDownIcon,
  CreditCardIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react"

import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  buildQueryHref,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import {
  formatCompactNumber,
  formatCurrency,
  formatRelativeDate,
} from "@/lib/platform/format"
import type {
  PlatformCursorPagination,
  PlatformShop,
} from "@/lib/platform/api"
import { DeletePlatformShopDialog } from "./delete-platform-shop-dialog"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { cn } from "@workspace/ui/lib/utils"

type PlatformShopsTableProps = {
  rows: PlatformShop[]
  currentSearchParams: PlatformSearchParams
  pagination?: PlatformCursorPagination
  paginationLinks?: {
    previousHref?: string | null
    nextHref?: string | null
  }
  initialFilters: {
    search: string
    status: string
    plan: string
    limit: number
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function PlatformShopsTable({
  rows,
  currentSearchParams,
  pagination,
  paginationLinks,
  initialFilters,
}: PlatformShopsTableProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [shopBeingDeleted, setShopBeingDeleted] = useState<PlatformShop | null>(null)
  const [search, setSearch] = useState(initialFilters.search)
  const [status, setStatus] = useState(initialFilters.status)
  const [limit, setLimit] = useState(String(initialFilters.limit))

  function navigateWithFilters(
    updates: Record<string, string | null | undefined>
  ) {
    const href = buildQueryHref(pathname, currentSearchParams, updates)
    startTransition(() => {
      router.push(href)
    })
  }

  function applyFilters() {
    navigateWithFilters({
      search: search || null,
      status: status === "all" ? null : status,
      limit,
      cursor: null,
    })
  }

  function resetFilters() {
    setSearch("")
    setStatus("all")
    setLimit(String(initialFilters.limit))
    navigateWithFilters({
      search: null,
      status: null,
      limit: String(initialFilters.limit),
      cursor: null,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminDataTable
        title="Workspace Inventory"
        toolbar={
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyFilters()
            }}
          >
            <Input
              placeholder="Search shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] h-8 text-[13px]"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 rounded-lg border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-2 text-[12px] font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button type="submit" size="sm" className="h-8" disabled={isPending}>
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px]"
              onClick={resetFilters}
              disabled={isPending}
            >
              Reset
            </Button>
          </form>
        }
        data={rows}
        columns={[
          {
            key: "name",
            header: "Shop",
            render: (shop) => (
              <Link
                href={`/platform/shops/${shop.id}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-[10px] font-bold bg-muted/50 group-hover:bg-[var(--fom-accent)]/10 group-hover:text-[var(--fom-accent)] transition-colors">
                    {getInitials(shop.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-foreground group-hover:text-[var(--fom-accent)] transition-colors truncate">
                    {shop.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium truncate">
                    {shop.owner_name}
                  </p>
                </div>
              </Link>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (shop) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">
                  {shop.plan_name ?? "None"}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {shop.plan_price !== null
                    ? formatCurrency(shop.plan_price, shop.plan_currency ?? "MMK")
                    : "--"}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (shop) => <PlatformStatusBadge status={shop.status} />,
          },
          {
            key: "usage",
            header: "Usage",
            render: (shop) => (
              <div className="flex flex-col gap-0.5 font-medium">
                <span className="text-foreground">
                  {formatCompactNumber(shop.total_orders)} orders
                </span>
                <span className="text-[11px] text-muted-foreground italic">
                  {formatCompactNumber(shop.delivered_orders)} delivered
                </span>
              </div>
            ),
          },
          {
            key: "activity",
            header: "Activity",
            render: (shop) => (
              <div className="flex flex-col gap-0.5 text-right font-medium">
                <span className="text-foreground">
                  {formatRelativeDate(shop.last_active_at)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {shop.active_session_count} active
                </span>
              </div>
            ),
            className: "text-right",
          },
          {
            key: "actions",
            header: "",
            render: (shop) => (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={`/platform/shops/${shop.id}`}>
                          <EyeIcon className="mr-2 size-3.5" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/platform/shops/${shop.id}/edit`}>
                          <PencilLineIcon className="mr-2 size-3.5" />
                          Edit Shop
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={`/platform/subscriptions?search=${encodeURIComponent(shop.name)}`}>
                          <CreditCardIcon className="mr-2 size-3.5" />
                          Subscription
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setShopBeingDeleted(shop)}
                      >
                        <Trash2Icon className="mr-2 size-3.5" />
                        Delete Shop
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
        footer={
          paginationLinks && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Page {pagination ? Math.ceil((pagination.cursor ? 2 : 1)) : 1} of {pagination ? Math.ceil(pagination.total / pagination.limit) : 1}
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    {paginationLinks.previousHref ? (
                      <PaginationPrevious href={paginationLinks.previousHref} />
                    ) : (
                      <PaginationPrevious className="pointer-events-none opacity-40" />
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {paginationLinks.nextHref ? (
                      <PaginationNext href={paginationLinks.nextHref} />
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

      {shopBeingDeleted && (
        <DeletePlatformShopDialog
          shop={shopBeingDeleted}
          open={!!shopBeingDeleted}
          onOpenChange={(open) => !open && setShopBeingDeleted(null)}
          onCompleted={(message) => {
            setShopBeingDeleted(null)
          }}
        />
      )}
    </div>
  )
}
