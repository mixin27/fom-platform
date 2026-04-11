"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  ArrowUpRightIcon,
  Building2Icon,
  ChevronRightIcon,
  CircleCheckBigIcon,
  CopyIcon,
  CreditCardIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  buildQueryHref,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import type {
  PlatformCursorPagination,
  PlatformShop,
} from "@/lib/platform/api"
import { DeletePlatformShopDialog } from "./delete-platform-shop-dialog"
import { PlatformShopFormSheet } from "./platform-shop-form-sheet"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
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

type SortableHeaderProps = {
  label: string
  column: {
    getCanSort: () => boolean
    getIsSorted: () => false | "asc" | "desc"
    toggleSorting: (desc?: boolean) => void
  }
  className?: string
}

type ShopMetricCardProps = {
  title: string
  value: string
  caption: string
}

function SortableHeader({ label, column, className }: SortableHeaderProps) {
  if (!column.getCanSort()) {
    return <span className={className}>{label}</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 px-2 text-muted-foreground", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}

function ShopMetricCard({ title, value, caption }: ShopMetricCardProps) {
  return (
    <Card size="sm" className="border border-black/6 bg-white shadow-none">
      <CardHeader className="pb-0">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-[-0.04em]">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getEstimatedMonthlyRevenue(shop: PlatformShop) {
  if (shop.plan_price === null) {
    return 0
  }

  if (shop.billing_period === "yearly") {
    return shop.plan_price / 12
  }

  return shop.plan_price
}

function ShopActions({
  shop,
  onInspect,
  onEdit,
  onDelete,
}: {
  shop: PlatformShop
  onInspect: (shop: PlatformShop) => void
  onEdit: (shop: PlatformShop) => void
  onDelete: (shop: PlatformShop) => void
}) {
  async function copyShopId() {
    await navigator.clipboard.writeText(shop.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Manage ${shop.name}`}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Manage shop</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onInspect(shop)}>
            <Building2Icon />
            Inspect details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(shop)}>
            <PencilLineIcon />
            Edit shop
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/platform/subscriptions?search=${encodeURIComponent(shop.name)}`}>
              <CreditCardIcon />
              Subscription ledger
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/platform/support">
              <RefreshCwIcon />
              Open support context
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {shop.owner_email ? (
            <DropdownMenuItem asChild>
              <a href={`mailto:${shop.owner_email}`}>
                <MailIcon />
                Email owner
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={copyShopId}>
            <CopyIcon />
            Copy shop ID
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(shop)}
          >
            <Trash2Icon />
            Delete shop
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ShopDetailsSheet({
  shop,
  open,
  onOpenChange,
  onEdit,
}: {
  shop: PlatformShop | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (shop: PlatformShop) => void
}) {
  if (!shop) {
    return null
  }

  const deliveryRate =
    shop.total_orders > 0
      ? Math.round((shop.delivered_orders / shop.total_orders) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l bg-white sm:max-w-xl">
        <SheetHeader className="border-b border-black/6 pb-4">
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(shop.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{shop.name}</SheetTitle>
                <PlatformStatusBadge status={shop.status} />
              </div>
              <SheetDescription>
                Owner: {shop.owner_name}
                {shop.owner_email ? ` · ${shop.owner_email}` : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card size="sm" className="border border-black/6 bg-white shadow-none">
              <CardHeader className="pb-0">
                <CardDescription>Plan</CardDescription>
                <CardTitle>
                  {shop.plan_name ?? "No active plan"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {shop.billing_period ? (
                    <Badge variant="outline" className="capitalize">
                      {shop.billing_period}
                    </Badge>
                  ) : null}
                  {shop.plan_price !== null ? (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(shop.plan_price, shop.plan_currency ?? "MMK")}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Renewal date: {formatDate(shop.current_period_end)}
                </p>
              </CardContent>
            </Card>

            <Card size="sm" className="border border-black/6 bg-white shadow-none">
              <CardHeader className="pb-0">
                <CardDescription>Usage health</CardDescription>
                <CardTitle>{deliveryRate}% delivery rate</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span>{formatCompactNumber(shop.total_orders)} total orders</span>
                <span>{formatCompactNumber(shop.delivered_orders)} delivered orders</span>
                <span>{formatCompactNumber(shop.active_session_count)} active sessions</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Ownership
                </span>
                <div className="rounded-xl border border-black/6 bg-muted/30 p-3">
                  <p className="font-medium text-foreground">{shop.owner_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shop.owner_email ?? "No email on file"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shop.owner_phone ?? "No phone on file"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Workspace
                </span>
                <div className="rounded-xl border border-black/6 bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p>Timezone: {shop.timezone}</p>
                  <p>Township: {shop.township ?? "—"}</p>
                  <p>Joined: {formatDate(shop.joined_at)}</p>
                  <p>Last active: {formatRelativeDate(shop.last_active_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Usage
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/6 bg-muted/30 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatCompactNumber(shop.member_count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customers</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatCompactNumber(shop.customer_count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatCompactNumber(shop.total_orders)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(shop.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                  Latest invoice
                </span>
                <div className="rounded-xl border border-black/6 bg-muted/30 p-3">
                  {shop.latest_invoice ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {shop.latest_invoice.invoice_no}
                        </p>
                        <PlatformStatusBadge status={shop.latest_invoice.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(
                          shop.latest_invoice.amount,
                          shop.latest_invoice.currency
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(shop.latest_invoice.due_at)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: {formatDate(shop.latest_invoice.paid_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No invoice recorded for this shop yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-black/6 bg-muted/20">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => onEdit(shop)}
            >
              Edit shop
              <PencilLineIcon data-icon="inline-end" />
            </Button>
            <Button asChild variant="outline" className="sm:flex-1">
              <Link href={`/platform/subscriptions?search=${encodeURIComponent(shop.name)}`}>
                View subscriptions
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild className="sm:flex-1">
              <Link href="/platform/support">
                Open support context
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
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
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    township: false,
    latestInvoice: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [selectedShop, setSelectedShop] = useState<PlatformShop | null>(null)
  const [shopBeingEdited, setShopBeingEdited] = useState<PlatformShop | null>(null)
  const [shopBeingDeleted, setShopBeingDeleted] = useState<PlatformShop | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.search)
  const [status, setStatus] = useState(initialFilters.status)
  const [plan, setPlan] = useState(initialFilters.plan)
  const [limit, setLimit] = useState(String(initialFilters.limit))
  const activeCount = rows.filter((shop) => shop.status === "active").length
  const atRiskCount = rows.filter((shop) =>
    ["overdue", "inactive", "expiring"].includes(shop.status)
  ).length
  const monthlyRevenue = rows.reduce(
    (sum, shop) => sum + getEstimatedMonthlyRevenue(shop),
    0
  )
  const revenue = rows.reduce((sum, shop) => sum + shop.total_revenue, 0)

  function handleMutationComplete(message: string) {
    setFeedbackMessage(message)
    setSelectedShop(null)
    setShopBeingEdited(null)
    setShopBeingDeleted(null)
  }

  function handleEdit(shop: PlatformShop) {
    setSelectedShop(null)
    setShopBeingEdited(shop)
  }

  function navigateWithFilters(
    updates: Record<string, string | null | undefined>,
    nextPathname = pathname
  ) {
    const href = buildQueryHref(nextPathname, currentSearchParams, updates)
    startTransition(() => {
      router.push(href)
    })
  }

  function applyFilters() {
    navigateWithFilters({
      search: search || null,
      status: status === "all" ? null : status,
      plan: plan || null,
      limit,
      cursor: null,
    })
  }

  function resetFilters() {
    setSearch("")
    setStatus("all")
    setPlan("")
    setLimit(String(initialFilters.limit))
    navigateWithFilters({
      search: null,
      status: null,
      plan: null,
      limit: String(initialFilters.limit),
      cursor: null,
    })
  }

  const columns: ColumnDef<PlatformShop>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.name}`}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        id: "shop",
        header: ({ column }) => (
          <SortableHeader label="Shop" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => {
          const shop = row.original

          return (
            <button
              type="button"
              onClick={() => setSelectedShop(shop)}
              className="flex w-full min-w-0 items-center gap-3 text-left"
            >
              <Avatar>
                <AvatarFallback>{getInitials(shop.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{shop.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {shop.owner_name}
                  {shop.owner_email ? ` · ${shop.owner_email}` : ""}
                </p>
              </div>
            </button>
          )
        },
      },
      {
        accessorKey: "plan_name",
        id: "plan",
        header: ({ column }) => (
          <SortableHeader label="Plan" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => {
          const shop = row.original

          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">
                {shop.plan_name ?? "No active plan"}
              </span>
              <span className="text-xs text-muted-foreground">
                {shop.plan_price !== null
                  ? formatCurrency(shop.plan_price, shop.plan_currency ?? "MMK")
                  : "No billing"}
                {shop.billing_period ? ` · ${shop.billing_period}` : ""}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader label="Status" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => <PlatformStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "member_count",
        id: "usage",
        header: ({ column }) => (
          <SortableHeader label="Usage" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {formatCompactNumber(row.original.total_orders)} orders
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCompactNumber(row.original.customer_count)} customers ·{" "}
              {formatCompactNumber(row.original.member_count)} members
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total_revenue",
        header: ({ column }) => (
          <SortableHeader label="Revenue" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {formatCurrency(row.original.total_revenue)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCompactNumber(row.original.delivered_orders)} delivered
            </span>
          </div>
        ),
      },
      {
        accessorKey: "last_active_at",
        id: "activity",
        header: ({ column }) => (
          <SortableHeader label="Activity" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {formatRelativeDate(row.original.last_active_at)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCompactNumber(row.original.active_session_count)} active sessions
            </span>
          </div>
        ),
      },
      {
        accessorKey: "latest_invoice.status",
        id: "latestInvoice",
        header: ({ column }) => (
          <SortableHeader
            label="Latest invoice"
            column={column}
            className="text-foreground"
          />
        ),
        cell: ({ row }) => {
          const invoice = row.original.latest_invoice

          if (!invoice) {
            return <span className="text-sm text-muted-foreground">No invoice</span>
          }

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{invoice.invoice_no}</span>
                <PlatformStatusBadge status={invoice.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(invoice.amount, invoice.currency)}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "township",
        header: ({ column }) => (
          <SortableHeader label="Location" column={column} className="text-foreground" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {row.original.township ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(row.original.joined_at)}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ShopActions
              shop={row.original}
              onInspect={setSelectedShop}
              onEdit={handleEdit}
              onDelete={setShopBeingDeleted}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <ShopMetricCard
          title="Results"
          value={pagination ? pagination.total.toLocaleString() : rows.length.toLocaleString()}
          caption="Shops matching the current platform filters."
        />
        <ShopMetricCard
          title="Active on this view"
          value={activeCount.toLocaleString()}
          caption="Healthy tenants with active usage or subscription status."
        />
        <ShopMetricCard
          title="Attention needed"
          value={atRiskCount.toLocaleString()}
          caption="Overdue, expiring, or inactive shops in this result set."
        />
        <ShopMetricCard
          title="Estimated MRR"
          value={formatCurrency(monthlyRevenue)}
          caption={`Tracked revenue on this page: ${formatCurrency(revenue)}.`}
        />
      </div>

      {feedbackMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CircleCheckBigIcon />
          <span>{feedbackMessage}</span>
        </div>
      ) : null}

      <Card className="border border-black/6 bg-white shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-black/6 pb-4">
          <div className="flex flex-col gap-1">
            <CardDescription>Shops</CardDescription>
            <CardTitle>Shop management workspace</CardTitle>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 md:w-[280px]">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyFilters()
                    }
                  }}
                  placeholder="Search shop, owner, township..."
                  className="pl-9"
                />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={plan || "all"} onValueChange={(value) => setPlan(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All plans</SelectItem>
                    <SelectItem value="trial">Free Trial</SelectItem>
                    <SelectItem value="pro_monthly">Pro Monthly</SelectItem>
                    <SelectItem value="pro_yearly">Pro Yearly</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFeedbackMessage(null)
                  setIsCreateOpen(true)
                }}
              >
                <PlusIcon data-icon="inline-start" />
                New shop
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === "latestInvoice"
                            ? "Latest invoice"
                            : column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={isPending}
              >
                Reset
              </Button>
              <Button size="sm" onClick={applyFilters} disabled={isPending}>
                {isPending ? "Updating..." : "Apply filters"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-4">
              <Empty className="border border-dashed border-black/8 bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2Icon />
                  </EmptyMedia>
                  <EmptyTitle>No shops match these filters</EmptyTitle>
                  <EmptyDescription>
                    Try widening the search, clearing the plan filter, or resetting the
                    status scope.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/20 hover:bg-muted/20">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-4 py-2.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="cursor-default"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-black/6 bg-muted/20 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {pagination
                ? `Showing ${rows.length} of ${pagination.total} shops`
                : `Showing ${rows.length} shops`}
            </p>
            {selectedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
              </p>
            ) : null}
          </div>

          {paginationLinks ? (
            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {paginationLinks.previousHref ? (
                    <PaginationPrevious href={paginationLinks.previousHref} />
                  ) : (
                    <PaginationPrevious
                      aria-disabled
                      className="pointer-events-none opacity-45"
                      href="#"
                    />
                  )}
                </PaginationItem>
                <PaginationItem>
                  {paginationLinks.nextHref ? (
                    <PaginationNext href={paginationLinks.nextHref} />
                  ) : (
                    <PaginationNext
                      aria-disabled
                      className="pointer-events-none opacity-45"
                      href="#"
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </CardFooter>
      </Card>

      <ShopDetailsSheet
        shop={selectedShop}
        open={selectedShop !== null}
        onEdit={handleEdit}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedShop(null)
          }
        }}
      />

      <PlatformShopFormSheet
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCompleted={handleMutationComplete}
      />

      <PlatformShopFormSheet
        mode="edit"
        shop={shopBeingEdited}
        open={shopBeingEdited !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShopBeingEdited(null)
          }
        }}
        onCompleted={handleMutationComplete}
      />

      <DeletePlatformShopDialog
        shop={shopBeingDeleted}
        open={shopBeingDeleted !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShopBeingDeleted(null)
          }
        }}
        onCompleted={handleMutationComplete}
      />
    </div>
  )
}
