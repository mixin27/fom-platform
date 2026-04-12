"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  CreditCardIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  RefreshCwIcon,
} from "lucide-react"

import type {
  PlatformPlanOption,
  PlatformSubscription,
} from "@/lib/platform/api"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { PlatformInvoiceFormSheet } from "./platform-invoice-form-sheet"
import { PlatformSubscriptionFormSheet } from "./platform-subscription-form-sheet"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

type PlatformSubscriptionsTableProps = {
  rows: PlatformSubscription[]
  plans: PlatformPlanOption[]
}

type SortableHeaderProps = {
  label: string
  column: {
    getCanSort: () => boolean
    getIsSorted: () => false | "asc" | "desc"
    toggleSorting: (desc?: boolean) => void
  }
}

function SortableHeader({ label, column }: SortableHeaderProps) {
  if (!column.getCanSort()) {
    return <span>{label}</span>
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2 text-muted-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}

function SubscriptionMetricCard({
  title,
  value,
  caption,
}: {
  title: string
  value: string
  caption: string
}) {
  return (
    <Card size="sm" className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
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

function SubscriptionActions({
  subscription,
  onEdit,
  onCreateInvoice,
}: {
  subscription: PlatformSubscription
  onEdit: (subscription: PlatformSubscription) => void
  onCreateInvoice: (subscription: PlatformSubscription) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Manage ${subscription.shop_name}`}
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>Manage subscription</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              onEdit(subscription)
            }}
          >
            <PencilLineIcon />
            Edit subscription
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              onCreateInvoice(subscription)
            }}
          >
            <CreditCardIcon />
            Create invoice
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/platform/shops?search=${encodeURIComponent(subscription.shop_name)}`}
            >
              <RefreshCwIcon />
              Open shop context
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PlatformSubscriptionsTable({
  rows,
  plans,
}: PlatformSubscriptionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "updated_at",
      desc: true,
    },
  ])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [plan, setPlan] = useState("all")
  const [notice, setNotice] = useState<string | null>(null)
  const [editingSubscription, setEditingSubscription] =
    useState<PlatformSubscription | null>(null)
  const [invoiceTarget, setInvoiceTarget] =
    useState<PlatformSubscription | null>(null)
  const [, startTransition] = useTransition()

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return rows.filter((subscription) => {
      if (status !== "all" && subscription.status !== status) {
        return false
      }

      if (plan !== "all" && subscription.plan_code !== plan) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        subscription.shop_name,
        subscription.owner_name,
        subscription.owner_email ?? "",
        subscription.plan_name,
        subscription.latest_invoice?.invoice_no ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [rows, search, status, plan])

  const totalMrr = useMemo(() => {
    return filteredRows.reduce((sum, subscription) => {
      if (subscription.billing_period === "yearly") {
        return sum + subscription.plan_price / 12
      }

      if (subscription.billing_period === "monthly") {
        return sum + subscription.plan_price
      }

      return sum
    }, 0)
  }, [filteredRows])

  const columns = useMemo<ColumnDef<PlatformSubscription>[]>(
    () => [
      {
        accessorKey: "shop_name",
        id: "shop_name",
        header: ({ column }) => <SortableHeader label="Shop" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-[var(--fom-ink)]">
              {row.original.shop_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.owner_name}
              {row.original.owner_email ? ` · ${row.original.owner_email}` : ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "plan_name",
        id: "plan_name",
        header: ({ column }) => <SortableHeader label="Plan" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-[var(--fom-ink)]">
              {row.original.plan_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(
                row.original.plan_price,
                row.original.plan_currency
              )}{" "}
              · {row.original.billing_period}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <SortableHeader label="Status" column={column} />
        ),
        cell: ({ row }) => <PlatformStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "end_at",
        id: "end_at",
        header: ({ column }) => (
          <SortableHeader label="Renewal" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-[var(--fom-ink)]">
              {formatDate(row.original.end_at)}
            </span>
            <span className="text-xs text-muted-foreground">
              Started {formatDate(row.original.start_at)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "latest_invoice",
        id: "latest_invoice",
        header: "Latest invoice",
        cell: ({ row }) =>
          row.original.latest_invoice ? (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-[var(--fom-ink)]">
                {row.original.latest_invoice.invoice_no}
              </span>
              <div className="flex items-center gap-2">
                <PlatformStatusBadge
                  status={row.original.latest_invoice.status}
                />
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(
                    row.original.latest_invoice.amount,
                    row.original.latest_invoice.currency
                  )}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No invoices yet
            </span>
          ),
      },
      {
        accessorKey: "auto_renews",
        id: "auto_renews",
        header: "Auto renew",
        cell: ({ row }) => (
          <PlatformStatusBadge
            status={row.original.auto_renews ? "active" : "inactive"}
            label={row.original.auto_renews ? "Enabled" : "Manual"}
          />
        ),
      },
      {
        id: "updated_at",
        accessorFn: (row) => row.updated_at,
        header: ({ column }) => (
          <SortableHeader label="Updated" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <SubscriptionActions
              subscription={row.original}
              onEdit={setEditingSubscription}
              onCreateInvoice={setInvoiceTarget}
            />
          </div>
        ),
      },
    ],
    [setEditingSubscription, setInvoiceTarget]
  )

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function handleCompleted(message: string) {
    startTransition(() => {
      setNotice(message)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SubscriptionMetricCard
          title="Managed subscriptions"
          value={filteredRows.length.toLocaleString()}
          caption="Filtered subscription records currently visible in this workspace."
        />
        <SubscriptionMetricCard
          title="Auto renew on"
          value={filteredRows
            .filter((subscription) => subscription.auto_renews)
            .length.toLocaleString()}
          caption="Subscriptions set to renew automatically at the end of the term."
        />
        <SubscriptionMetricCard
          title="Needs attention"
          value={filteredRows
            .filter((subscription) =>
              ["overdue", "expired", "cancelled", "inactive"].includes(
                subscription.status
              )
            )
            .length.toLocaleString()}
          caption="Subscriptions with billing or lifecycle states that may need manual action."
        />
        <SubscriptionMetricCard
          title="Estimated MRR"
          value={formatCurrency(totalMrr)}
          caption="Approximate monthly revenue contribution from the filtered rows."
        />
      </div>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardDescription>Subscriptions</CardDescription>
            <CardTitle>Manage shop billing state</CardTitle>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shop, owner, plan..."
              className="h-9 w-full min-w-[220px] md:w-[260px]"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full md:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-9 w-full md:w-[200px]">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                <SelectGroup>
                  <SelectItem value="all">All plans</SelectItem>
                  {plans.map((planOption) => (
                    <SelectItem key={planOption.code} value={planOption.code}>
                      {planOption.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("")
                setStatus("all")
                setPlan("all")
              }}
            >
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {notice ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-[var(--fom-surface-variant)] hover:bg-[var(--fom-surface-variant)]"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 py-2.5",
                        header.id === "actions" ? "w-[80px] text-right" : ""
                      )}
                    >
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 align-top",
                          cell.column.id === "actions" ? "text-right" : ""
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="px-4 py-10">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CreditCardIcon />
                        </EmptyMedia>
                        <EmptyTitle>
                          No subscriptions match the current filters
                        </EmptyTitle>
                        <EmptyDescription>
                          Try widening the search or resetting the plan and
                          status filters.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PlatformSubscriptionFormSheet
        subscription={editingSubscription}
        plans={plans}
        open={editingSubscription !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSubscription(null)
          }
        }}
        onCompleted={handleCompleted}
      />

      <PlatformInvoiceFormSheet
        mode="create"
        subscription={invoiceTarget}
        open={invoiceTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInvoiceTarget(null)
          }
        }}
        onCompleted={handleCompleted}
      />
    </div>
  )
}
