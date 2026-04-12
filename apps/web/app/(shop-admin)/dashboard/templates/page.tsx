import { MessageSquareText } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getShopPortalContext,
  getShopTemplates,
  type ShopCursorPagination,
} from "@/lib/shop/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import { formatRelativeDate } from "@/lib/platform/format"
import { updateShopTemplateStateFromFormAction } from "../actions"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ShopTemplateSheet } from "./_components/shop-template-sheet"

type TemplatesPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function TemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/templates", params, {})
  const [{ activeShop }, templatesResponse] = await Promise.all([
    getShopPortalContext(),
    getShopTemplates(params, currentHref),
  ])
  const rows = templatesResponse.data
  const pagination = templatesResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const search = getSingleSearchParam(params.search) ?? ""
  const state = getSingleSearchParam(params.state) ?? "all"
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canManageTemplates = permissions.has("templates.write")
  const activeCount = rows.filter((template) => template.is_active).length

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Templates"
        title="Message templates"
        description="Keep the high-repeat customer replies in one place so the team can move faster across confirmations, dispatch, and payment follow-up."
        actions={
          canManageTemplates ? (
            <ShopTemplateSheet
              shopId={activeShop.id}
              triggerLabel="Create template"
              triggerVariant="default"
            />
          ) : undefined
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Visible templates"
          value={String(rows.length)}
          detail="Templates matching the current filters."
          delta={`${activeCount} active`}
          icon={MessageSquareText}
          accent="sunset"
        />
        <DashboardStatCard
          title="Average size"
          value={
            rows.length > 0
              ? `${Math.round(
                  rows.reduce((sum, template) => sum + template.character_count, 0) /
                    rows.length
                )} chars`
              : "0 chars"
          }
          detail="Average template message length in the current view."
          delta={state === "all" ? "All states" : state}
          icon={MessageSquareText}
          accent="teal"
        />
        <DashboardStatCard
          title="Shortcuts"
          value={String(rows.filter((template) => template.shortcut).length)}
          detail="Templates that can be referenced quickly by shortcut."
          delta="Ready for reuse"
          icon={MessageSquareText}
          accent="ink"
        />
      </section>

      <PlatformDataTable
        title="Template library"
        description="Quick-reply and customer message templates"
        rows={rows}
        emptyMessage="No templates matched the current filters."
        footer={`Showing ${rows.length} template${rows.length === 1 ? "" : "s"}`}
        pagination={
          pagination
            ? {
                previousHref: previousCursor
                  ? buildQueryHref("/dashboard/templates", params, {
                      cursor: previousCursor,
                    })
                  : currentCursor
                    ? buildQueryHref("/dashboard/templates", params, {
                        cursor: null,
                      })
                    : null,
                nextHref: pagination.next_cursor
                  ? buildQueryHref("/dashboard/templates", params, {
                      cursor: pagination.next_cursor,
                    })
                  : null,
              }
            : undefined
        }
        toolbar={
          <form method="GET" className="flex flex-wrap gap-2">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search templates"
              className="h-9 w-[220px]"
            />
            <select
              name="state"
              defaultValue={state}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input type="hidden" name="limit" value={String(limit)} />
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </form>
        }
        columns={[
          {
            key: "title",
            header: "Template",
            render: (template) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{template.title}</span>
                <span className="text-xs text-muted-foreground">
                  {template.shortcut ?? "No shortcut"}
                </span>
              </div>
            ),
          },
          {
            key: "body",
            header: "Preview",
            render: (template) => (
              <span className="text-sm leading-6 text-muted-foreground">
                {template.preview}
              </span>
            ),
          },
          {
            key: "length",
            header: "Length",
            render: (template) => `${template.character_count} chars`,
          },
          {
            key: "status",
            header: "Status",
            render: (template) => (
              <PlatformStatusBadge
                status={template.is_active ? "active" : "inactive"}
                label={template.is_active ? "Active" : "Inactive"}
              />
            ),
          },
          {
            key: "updated",
            header: "Updated",
            render: (template) => formatRelativeDate(template.updated_at),
          },
          {
            key: "actions",
            header: "Actions",
            render: (template) => {
              if (!canManageTemplates) {
                return <span className="text-xs text-muted-foreground">No actions</span>
              }

              return (
                <div className="flex flex-wrap justify-end gap-2">
                  <ShopTemplateSheet shopId={activeShop.id} template={template} />
                  <form action={updateShopTemplateStateFromFormAction}>
                    <input type="hidden" name="return_to" value={currentHref} />
                    <input type="hidden" name="shop_id" value={activeShop.id} />
                    <input type="hidden" name="template_id" value={template.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={template.is_active ? "false" : "true"}
                    />
                    <Button type="submit" size="sm" variant="outline">
                      {template.is_active ? "Archive" : "Activate"}
                    </Button>
                  </form>
                </div>
              )
            },
            className: "w-[220px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
          },
        ]}
      />
    </div>
  )
}
