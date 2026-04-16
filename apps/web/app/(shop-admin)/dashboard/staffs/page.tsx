import Link from "next/link"
import { Clock3, Shield, Store, UserRound } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
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
import { ShopMemberSheet } from "./_components/shop-member-sheet"
import { ShopRoleSheet } from "./_components/shop-role-sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

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
      <PageIntro
        eyebrow="Governance"
        title="Team access and audit"
        description="Manage member access, define custom roles, and review recent governance changes for this shop."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Shop settings</Link>
            </Button>
            {canManageMembers ? (
              <>
                <ShopMemberSheet
                  shopId={activeShop.id}
                  roles={roleCatalog.roles}
                  triggerLabel="Add member"
                />
                <ShopRoleSheet
                  shopId={activeShop.id}
                  availablePermissions={roleCatalog.available_permissions}
                  triggerLabel="Create role"
                />
              </>
            ) : null}
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
        <DashboardStatCard
          title="Active staffs"
          value={String(activeMembers.length)}
          detail="Members with active access to the current shop."
          delta={`${members.length} total members`}
          icon={Store}
          accent="sunset"
        />
        <DashboardStatCard
          title="Role catalog"
          value={String(roleCatalog.roles.length)}
          detail="System and custom roles available for assignment."
          delta={`${customRoles.length} custom`}
          icon={Shield}
          accent="teal"
        />
        <DashboardStatCard
          title="Recent audit events"
          value={String(auditLogs.length)}
          detail="Latest member and role changes recorded for this shop."
          delta={auditLogs[0] ? formatRelativeDate(auditLogs[0].created_at) : "No audit activity yet"}
          icon={Clock3}
          accent="ink"
        />
        <DashboardStatCard
          title="Your access"
          value={profile.name}
          detail={profile.email ?? profile.phone ?? "No primary contact set."}
          delta={formatList(currentMembership?.roles.map((role) => role.name) ?? [])}
          icon={UserRound}
          accent="ink"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <PlatformDataTable
          title="Team members"
          description="Current shop access"
          rows={members}
          emptyMessage="No members found for this shop."
          footer={`Showing ${members.length} member${members.length === 1 ? "" : "s"}`}
          pagination={
            pagination
              ? {
                  previousHref: previousCursor
                    ? buildQueryHref("/dashboard/staffs", params, {
                        cursor: previousCursor,
                      })
                    : currentCursor
                      ? buildQueryHref("/dashboard/staffs", params, {
                          cursor: null,
                        })
                      : null,
                  nextHref: pagination.next_cursor
                    ? buildQueryHref("/dashboard/staffs", params, {
                        cursor: pagination.next_cursor,
                      })
                    : null,
                }
              : undefined
          }
          columns={[
            {
              key: "user",
              header: "Member",
              render: (member) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{member.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {member.user.email ?? member.user.phone ?? "No contact"}
                  </span>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Roles",
              render: (member) => (
                <div className="flex flex-wrap gap-2">
                  {member.roles.map((role) => (
                    <PlatformStatusBadge
                      key={role.id}
                      status={role.is_system ? "active" : "pending"}
                      label={role.name}
                    />
                  ))}
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
              key: "permissions",
              header: "Permissions",
              render: (member) => `${member.permissions.length} granted`,
            },
            {
              key: "joined",
              header: "Joined",
              render: (member) => formatRelativeDate(member.created_at),
            },
            {
              key: "actions",
              header: "Actions",
              render: (member) => {
                const isCurrentUser = member.user_id === profile.id
                const isOwner = member.roles.some((role) => role.code === "owner")

                if (!canManageMembers || isCurrentUser || isOwner) {
                  return <span className="text-xs text-muted-foreground">No actions</span>
                }

                return (
                  <ShopMemberSheet
                    shopId={activeShop.id}
                    roles={roleCatalog.roles}
                    member={member}
                    triggerLabel="Manage"
                  />
                )
              },
              className: "w-[120px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />

        <PlatformDataTable
          title="Role catalog"
          description="Shop role definitions"
          rows={roleCatalog.roles}
          emptyMessage="No roles found for this shop."
          footer={`${ownerCount} owner account${ownerCount === 1 ? "" : "s"} currently attached`}
          columns={[
            {
              key: "name",
              header: "Role",
              render: (role) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{role.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {role.description ?? (role.is_system ? "System role" : "Custom role")}
                  </span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (role) => (
                <PlatformStatusBadge
                  status={role.is_system ? "active" : "pending"}
                  label={role.is_system ? "System" : "Custom"}
                />
              ),
            },
            {
              key: "members",
              header: "Members",
              render: (role) => String(role.member_count),
            },
            {
              key: "permissions",
              header: "Permissions",
              render: (role) => `${role.permissions.length} assigned`,
            },
            {
              key: "actions",
              header: "Actions",
              render: (role) => {
                if (!canManageMembers || !role.editable) {
                  return (
                    <span className="text-xs text-muted-foreground">
                      {role.is_system ? "System role" : "No actions"}
                    </span>
                  )
                }

                return (
                  <ShopRoleSheet
                    shopId={activeShop.id}
                    role={role}
                    availablePermissions={roleCatalog.available_permissions}
                    triggerLabel="Edit"
                  />
                )
              },
              className: "w-[110px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />
      </div>

      <PlatformDataTable
        title="Recent audit log"
        description="Latest governance activity"
        rows={auditLogs}
        emptyMessage="No audit events recorded for this shop yet."
        footer="Member invites, access changes, and custom-role edits are recorded here."
        columns={[
          {
            key: "event",
            header: "Event",
            render: (log) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{log.summary}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCodeLabel(log.action)}
                </span>
              </div>
            ),
          },
          {
            key: "actor",
            header: "Actor",
            render: (log) => log.actor?.name ?? "System",
          },
          {
            key: "entity",
            header: "Entity",
            render: (log) => formatCodeLabel(log.entity_type),
          },
          {
            key: "time",
            header: "When",
            render: (log) => formatRelativeDate(log.created_at),
          },
        ]}
      />
    </div>
  )
}
