import type { ReactNode } from "react"

import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"

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
  description: _description,
  rows,
  columns,
  emptyMessage,
  toolbar,
  footer,
  pagination,
}: PlatformDataTableProps<T>) {
  return (
    <AdminDataTable
      title={title}
      toolbar={toolbar}
      data={rows}
      columns={columns}
      emptyMessage={emptyMessage}
      footer={footer}
      pagination={pagination}
    />
  )
}
