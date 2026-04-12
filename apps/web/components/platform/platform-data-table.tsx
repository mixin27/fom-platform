import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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

type PlatformDataTableColumn<T> = {
  key: string
  header: ReactNode
  className?: string
  cellClassName?: string
  render: (row: T) => ReactNode
}

type PlatformDataTableProps<T> = {
  title: string
  description: string
  rows: T[]
  columns: PlatformDataTableColumn<T>[]
  emptyMessage: string
  toolbar?: ReactNode
  footer?: ReactNode
  pagination?: {
    previousHref?: string | null
    nextHref?: string | null
  }
}

export function PlatformDataTable<T>({
  title,
  description,
  rows,
  columns,
  emptyMessage,
  toolbar,
  footer,
  pagination,
}: PlatformDataTableProps<T>) {
  return (
    <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
      <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardDescription>{description}</CardDescription>
          <CardTitle>{title}</CardTitle>
        </div>
        {toolbar}
      </CardHeader>
      <CardContent className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.className ?? "px-4 py-2.5"}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.cellClassName ?? "px-4 py-3"}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {footer || pagination ? (
          <div className="flex flex-col gap-3 border-t border-[var(--fom-border-subtle)] px-4 py-3 md:flex-row md:items-center md:justify-between">
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
        ) : null}
      </CardContent>
    </Card>
  )
}
