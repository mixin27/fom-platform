import { Shield, Store, UserRound } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getCurrentUserProfile,
  getShopDetails,
  getShopMembers,
  getShopPortalContext,
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
import {
  addShopMemberFromFormAction,
  updateCurrentUserProfileFromFormAction,
  updateShopMemberFromFormAction,
  updateShopProfileFromFormAction,
} from "../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type ShopSettingsPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopSettingsPage({
  searchParams,
}: ShopSettingsPageProps) {
  const params = (await searchParams) ?? {}
  const currentHref = buildQueryHref("/dashboard/settings", params, {})
  const [{ activeShop }, shopResponse, membersResponse, profileResponse] = await Promise.all([
    getShopPortalContext(),
    getShopDetails(currentHref),
    getShopMembers(params, currentHref),
    getCurrentUserProfile(currentHref),
  ])
  const shop = shopResponse.data
  const members = membersResponse.data
  const profile = profileResponse.data
  const pagination = membersResponse.meta?.pagination as ShopCursorPagination | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20)
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const canManageMembers = permissions.has("members.manage")
  const currentMembership =
    profile.shops.find((shopRecord) => shopRecord.id === activeShop.id)?.membership ?? null

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Settings"
        title="Shop settings and access"
        description="Keep shop identity, your operator profile, and member access aligned with the way the team works."
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
          title="Shop members"
          value={String(shop.member_count)}
          detail="Members with access to the current shop workspace."
          delta={`${members.filter((member) => member.status === "active").length} active`}
          icon={Store}
          accent="sunset"
        />
        <DashboardStatCard
          title="Your role"
          value={formatCodeLabel(currentMembership?.role ?? "member")}
          detail={`${currentMembership?.permissions.length ?? 0} effective shop permissions.`}
          delta={formatList(currentMembership?.roles.map((role) => role.code) ?? [])}
          icon={Shield}
          accent="teal"
        />
        <DashboardStatCard
          title="Account profile"
          value={profile.name}
          detail={profile.email ?? profile.phone ?? "No primary contact set."}
          delta={profile.locale}
          icon={UserRound}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shop profile</CardDescription>
            <CardTitle>Identity and timezone</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canManageShop ? (
              <form action={updateShopProfileFromFormAction} className="flex flex-col gap-2.5">
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input name="name" defaultValue={shop.name} placeholder="Shop name" />
                <Input
                  name="timezone"
                  defaultValue={shop.timezone}
                  placeholder="Timezone"
                />
                <Button type="submit" size="sm">
                  Update shop
                </Button>
              </form>
            ) : (
              <div className="text-sm leading-7 text-muted-foreground">
                <p>{shop.name}</p>
                <p>{shop.timezone}</p>
                <p className="mt-2">Your account cannot edit shop identity fields.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Your profile</CardDescription>
            <CardTitle>Sign-in identity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updateCurrentUserProfileFromFormAction}
              className="flex flex-col gap-2.5"
            >
              <input type="hidden" name="return_to" value={currentHref} />
              <Input name="name" defaultValue={profile.name} placeholder="Name" />
              <Input
                name="email"
                defaultValue={profile.email ?? ""}
                placeholder="Email"
              />
              <Input
                name="phone"
                defaultValue={profile.phone ?? ""}
                placeholder="Phone"
              />
              <select
                name="locale"
                defaultValue={profile.locale}
                className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="en">en</option>
                <option value="my">my</option>
              </select>
              <Button type="submit" size="sm">
                Update profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Current access</CardDescription>
            <CardTitle>Effective permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {(currentMembership?.permissions ?? []).length > 0 ? (
              currentMembership?.permissions.map((permission) => (
                <PlatformStatusBadge
                  key={permission}
                  status="active"
                  label={permission}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No shop permissions are currently assigned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
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
                    ? buildQueryHref("/dashboard/settings", params, {
                        cursor: previousCursor,
                      })
                    : currentCursor
                      ? buildQueryHref("/dashboard/settings", params, {
                          cursor: null,
                        })
                      : null,
                  nextHref: pagination.next_cursor
                    ? buildQueryHref("/dashboard/settings", params, {
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
                      status="active"
                      label={role.name}
                    />
                  ))}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (member) => <PlatformStatusBadge status={member.status} />,
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

                const nextStatus = member.status === "disabled" ? "active" : "disabled"

                return (
                  <form action={updateShopMemberFromFormAction}>
                    <input type="hidden" name="return_to" value={currentHref} />
                    <input type="hidden" name="shop_id" value={activeShop.id} />
                    <input type="hidden" name="member_id" value={member.id} />
                    <input type="hidden" name="status" value={nextStatus} />
                    <Button type="submit" size="sm" variant="outline">
                      {nextStatus === "active" ? "Restore" : "Disable"}
                    </Button>
                  </form>
                )
              },
              className: "w-[120px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />

        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access control</CardDescription>
            <CardTitle>Add member</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canManageMembers ? (
              <form action={addShopMemberFromFormAction} className="flex flex-col gap-2.5">
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input name="name" placeholder="Member name" />
                <Input name="email" placeholder="Email" />
                <Input name="phone" placeholder="Phone" />
                <select
                  name="role_code"
                  defaultValue="staff"
                  className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                >
                  <option value="staff">Staff</option>
                </select>
                <Button type="submit" size="sm">
                  Add member
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your account cannot invite or disable members in this shop.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
