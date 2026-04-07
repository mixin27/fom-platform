"use client"

import { useMemo, useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDownIcon, CreditCardIcon } from "lucide-react"

import type {
  PlatformCursorPagination,
  PlatformInvoice,
  PlatformSubscription,
} from "@/lib/platform/api"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { PlatformInvoiceActionCell } from "./platform-invoice-action-cell"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import {
  formatCurrency,
  formatDate,
} from "@/lib/platform/format"

type PlatformInvoiceHistoryTableProps = {
  rows: PlatformInvoice[]
  subscriptions: PlatformSubscription[]
  pagination?: PlatformCursorPagination
  paginationLinks?: {
    previousHref?: string | null
    nextHref?: string | null
  }
  initialFilters: {
    search: string
    status: string
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

export function PlatformInvoiceHistoryTable({
  rows,
  subscriptions,
  pagination,
  paginationLinks,
  initialFilters,
}: PlatformInvoiceHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ])

  const columns = useMemo<ColumnDef<PlatformInvoice>[]>(() => [
    {
      accessorKey: "invoice_no",
      id: "invoice_no",
      header: ({ column }) => <SortableHeader label="Invoice" column={column} />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[var(--fom-ink)]">
            {row.original.invoice_no}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.provider_ref ?? row.original.shop_name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "shop_name",
      id: "shop_name",
      header: ({ column }) => <SortableHeader label="Shop" column={column} />,
      cell: ({ row }) => row.original.shop_name,
    },
    {
      accessorKey: "plan_name",
      id: "plan_name",
      header: ({ column }) => <SortableHeader label="Plan" column={column} />,
      cell: ({ row }) => row.original.plan_name,
    },
    {
      accessorKey: "amount",
      id: "amount",
      header: ({ column }) => <SortableHeader label="Amount" column={column} />,
      cell: ({ row }) =>
        formatCurrency(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "payment_method",
      id: "payment_method",
      header: ({ column }) => <SortableHeader label="Method" column={column} />,
      cell: ({ row }) => row.original.payment_method ?? "—",
    },
    {
      accessorKey: "created_at",
      id: "created_at",
      header: ({ column }) => <SortableHeader label="Date" column={column} />,
      cell: ({ row }) => formatDate(row.original.paid_at ?? row.original.due_at ?? row.original.created_at),
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => <PlatformStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PlatformInvoiceActionCell
            invoice={row.original}
            subscriptions={subscriptions}
          />
        </div>
      ),
    },
  ], [subscriptions])

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Card className="border border-black/6 bg-white shadow-none">
      <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardDescription>Invoice history</CardDescription>
          <CardTitle>All payment records</CardTitle>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          action="/platform/subscriptions"
        >
          <Input
            name="search"
            defaultValue={initialFilters.search}
            placeholder="Search invoice or shop..."
            className="h-9 w-full min-w-[220px] sm:w-[240px]"
          />
          <select
            name="status"
            defaultValue={initialFilters.status}
            className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
          </select>
          <input type="hidden" name="limit" value={String(initialFilters.limit)} />
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      </CardHeader>
      <CardContent className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#fdfeff] hover:bg-[#fdfeff]">
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4 py-10 text-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CreditCardIcon />
                      </EmptyMedia>
                      <EmptyTitle>No invoices match the current filters</EmptyTitle>
                      <EmptyDescription>
                        Try widening the search or resetting the filters.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {pagination || paginationLinks ? (
          <div className="flex flex-col gap-3 border-t border-black/6 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground">
              {pagination
                ? `Showing ${rows.length} of ${pagination.total} invoices`
                : `${rows.length} invoices`}
            </div>
            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {paginationLinks?.previousHref ? (
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
                  {paginationLinks?.nextHref ? (
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
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
