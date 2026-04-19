import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
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

interface AdminDataTableColumn<T> {
  key: string
  header: ReactNode
  render: (item: T) => ReactNode
  className?: string
  cellClassName?: string
}

interface AdminDataTableProps<T> {
  title?: string
  toolbar?: ReactNode
  columns: AdminDataTableColumn<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
  tableClassName?: string
  footer?: ReactNode
  pagination?: {
    previousHref?: string | null
    nextHref?: string | null
  }
}

export function AdminDataTable<T>({
  title,
  toolbar,
  columns,
  data,
  emptyMessage = "No data available.",
  className,
  tableClassName,
  footer,
  pagination,
}: AdminDataTableProps<T>) {
  return (
    <Card
      className={cn(
        "rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden",
        className
      )}
    >
      {(title || toolbar) && (
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-4 py-3 border-b border-[var(--fom-border-subtle)]">
          {title && (
            <CardTitle className="text-[13.5px] font-bold tracking-tight">
              {title}
            </CardTitle>
          )}
          {toolbar && (
            <div className="flex items-center gap-2 empty:hidden">{toolbar}</div>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table className={cn("w-full border-collapse", tableClassName)}>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[var(--fom-border-subtle)]/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-auto px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted-foreground",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, flatIndex) => (
                <TableRow
                  key={flatIndex}
                  className="border-b border-[var(--fom-border-subtle)] last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn("px-4 py-3 text-[13px]", column.cellClassName)}
                    >
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {(footer || pagination) && (
        <div className="flex flex-col gap-3 border-t border-[var(--fom-border-subtle)] bg-muted/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">{footer}</div>
          {pagination ? (
            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {pagination.previousHref ? (
                    <PaginationPrevious href={pagination.previousHref} />
                  ) : (
                    <PaginationPrevious
                      aria-disabled
                      className="pointer-events-none opacity-45"
                      href="#"
                    />
                  )}
                </PaginationItem>
                <PaginationItem>
                  {pagination.nextHref ? (
                    <PaginationNext href={pagination.nextHref} />
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
        </div>
      )}
    </Card>
  )
}
