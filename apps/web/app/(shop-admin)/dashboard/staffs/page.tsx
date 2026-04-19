import Link from "next/link"
import { ClockIcon, ShieldIcon, StoreIcon, UserIcon, PlusIcon, ShieldPlusIcon } from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { AdminDataTable } from "@/features/portal-shell/components/admin/admin-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getCurrentUserProfile,
  getShopAuditLogs,
  getShopMembers,
  getShopPortalContext,
  getShopRoles,
  type ShopCursorPagination,
} from "@/lib/shop/api"
import {
  buildQueryHref,
  getPreviousCursor,
  getSingleSearchParam,
  type ShopSearchParams,
} from "@/lib/shop/query"
import { formatCodeLabel, formatList } from "@/lib/shop/format"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
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

type ShopStaffsPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopStaffsPage({
  searchParams,
}: ShopStaffsPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/staffs", params, {})
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canReadMembers = permissions.has("members.read")
  const canManageMembers = permissions.has("members.manage")

  if (!canReadMembers) {
    return (
      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
        <CardHeader>
          <CardDescription>Access required</CardDescription>
          <CardTitle>Staff management is not available to this member</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            This account does not currently have permission to read shop members.
          </p>
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const [membersResponse, profileResponse, rolesResponse] = await Promise.all([
    getShopMembers(params, currentHref),
    getCurrentUserProfile(currentHref),
    getShopRoles(currentHref),
  ])
  const auditLogsResponse = canManageMembers
    ? await getShopAuditLogs({ limit: "8" }, currentHref)
    : { data: [] }

  const members = membersResponse.data
  const profile = profileResponse.data
  const roleCatalog = rolesResponse.data
  const auditLogs = auditLogsResponse.data
  const isMembersForbidden = membersResponse.meta?.forbidden === true

  if (!members || isMembersForbidden) {
    return (
      <div className="flex flex-col gap-5">
        <AdminHeader
          title="Staffs"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
          }
        />

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader>
            <CardDescription>Feature unavailable</CardDescription>
            <CardTitle>Team management is not enabled</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {String(membersResponse.meta?.message ?? "").trim() ||
              "This subscription plan does not include team member management."}
          </CardContent>
        </Card>
      </div>
    )
  }

  const pagination = membersResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const activeMembers = members.filter((member) => member.status === "active")
  const ownerCount = members.filter((member) =>
    member.roles.some((role) => role.code === "owner")
  ).length
  const customRoles = roleCatalog.roles.filter((role) => !role.is_system)
  const currentMembership =
    profile.shops.find((shopRecord) => shopRecord.id === activeShop.id)?.membership ?? null

  return (
    <div className="flex flex-col gap-5">
      <AdminHeader
        title="Staffs"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Shop Settings</Link>
            </Button>
            {canManageMembers && (
              <>
                <Button asChild size="sm">
                  <Link href="/dashboard/staffs/members/new">
                    <PlusIcon data-icon="inline-start" />
                    New Staff
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard/staffs/roles/new">
                    <ShieldPlusIcon data-icon="inline-start" />
                    Custom Role
                  </Link>
                </Button>
              </>
            )}
          </div>
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

      <section className="grid gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Active Staffs"
          value={String(activeMembers.length)}
          detail={`${members.length} total members`}
          icon={StoreIcon}
          accent="sunset"
        />
        <AdminStatCard
          label="Role Catalog"
          value={String(roleCatalog.roles.length)}
          detail={`${customRoles.length} custom definitions`}
          icon={ShieldIcon}
          accent="teal"
        />
        <AdminStatCard
          label="Recent Audits"
          value={String(auditLogs.length)}
          detail={auditLogs[0] ? formatRelativeDate(auditLogs[0].created_at) : "No activity"}
          icon={ClockIcon}
          accent="ink"
        />
        <AdminStatCard
          label="Your Access"
          value={profile.name}
          detail={formatList(currentMembership?.roles.map((role) => role.name) ?? []) || "No roles"}
          icon={UserIcon}
          accent="ink"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <AdminDataTable
          title="Team Members"
          data={members}
          emptyMessage="No members found for this shop."
          columns={[
            {
              key: "user",
              header: "Member Profile",
              render: (member) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">{member.user.name}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {member.user.email ?? member.user.phone ?? "No contact"}
                  </span>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Capabilities",
              render: (member) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1">
                    {member.roles.map((role) => (
                      <PlatformStatusBadge
                        key={role.id}
                        status={role.is_system ? "active" : "pending"}
                        label={role.name}
                        className="h-4 px-1.5 text-[9px]"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {member.permissions.length} active flags
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (member) => (
                <PlatformStatusBadge
                  status={member.status}
                  label={formatCodeLabel(member.status)}
                />
              ),
            },
            {
              key: "actions",
              header: "",
              render: (member) => {
                const isCurrentUser = member.user_id === profile.id
                const isOwner = member.roles.some((role) => role.code === "owner")

                if (!canManageMembers || isCurrentUser || isOwner) {
                  return null
                }

                return (
                  <div className="flex justify-end">
                    <Button asChild size="xs" variant="ghost" className="h-7 px-2 font-bold text-muted-foreground hover:text-foreground">
                      <Link href={`/dashboard/staffs/members/${member.id}/edit`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                )
              },
            },
          ]}
          footer={
            pagination && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                  Showing {members.length} members
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      {previousCursor ? (
                        <PaginationPrevious href={buildQueryHref("/dashboard/staffs", params, { cursor: previousCursor })} />
                      ) : (
                        <PaginationPrevious className="pointer-events-none opacity-40" />
                      )}
                    </PaginationItem>
                    <PaginationItem>
                      {pagination.next_cursor ? (
                        <PaginationNext href={buildQueryHref("/dashboard/staffs", params, { cursor: pagination.next_cursor })} />
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

        <AdminDataTable
          title="Role Matrix"
          data={roleCatalog.roles}
          emptyMessage="No roles found for this shop."
          columns={[
            {
              key: "name",
              header: "Role Definition",
              render: (role) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">{role.name}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {role.is_system ? "System locked" : "Custom ruleset"}
                  </span>
                </div>
              ),
            },
            {
              key: "stats",
              header: "Usage",
              render: (role) => (
                <div className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">
                  <span>{role.member_count} members</span>
                  <span>{role.permissions.length} assignments</span>
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (role) => {
                if (!canManageMembers || !role.editable) {
                  return null
                }

                return (
                  <div className="flex justify-end">
                    <Button asChild size="xs" variant="ghost" className="h-7 px-2 font-bold text-muted-foreground hover:text-foreground">
                      <Link href={`/dashboard/staffs/roles/${role.id}/edit`}>
                        Modify
                      </Link>
                    </Button>
                  </div>
                )
              },
            },
          ]}
        />
      </div>

      <AdminDataTable
        title="Audit Matrix"
        data={auditLogs}
        emptyMessage="No governance activity recorded."
        columns={[
          {
            key: "event",
            header: "Activity",
            render: (log) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">{log.summary}</span>
                <span className="text-[11px] text-muted-foreground uppercase font-medium">
                  {formatCodeLabel(log.action)} · {formatCodeLabel(log.entity_type)}
                </span>
              </div>
            ),
          },
          {
            key: "actor",
            header: "Initiator",
            render: (log) => (
              <span className="text-[13px] font-medium">
                {log.actor?.name ?? "System Automation"}
              </span>
            ),
          },
          {
            key: "time",
            header: "Timestamp",
            render: (log) => (
              <span className="text-[12px] font-medium text-muted-foreground">
                {formatRelativeDate(log.created_at)}
              </span>
            ),
          },
        ]}
      />
    </div>
  )
}
