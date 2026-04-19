import Link from "next/link"
import {
  KeyRound,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import {
  getCurrentUserProfile,
  getShopDetails,
  getShopPortalContext,
} from "@/lib/shop/api"
import { formatCodeLabel, formatList } from "@/lib/shop/format"
import { formatRelativeDate } from "@/lib/platform/format"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import {
  updateCurrentUserProfileFromFormAction,
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
  const returnTo = "/dashboard/settings"
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const [shopResponse, profileResponse] = await Promise.all([
    getShopDetails(returnTo),
    getCurrentUserProfile(returnTo),
  ])
  const shop = shopResponse.data
  const profile = profileResponse.data
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const currentMembership =
    profile.shops.find((shopRecord) => shopRecord.id === activeShop.id)
      ?.membership ?? null

  return (
    <div className="flex flex-col gap-5">
      <AdminHeader
        title="Settings"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/staffs">Staffs</Link>
            </Button>
            {canManageShop ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/billing">Billing</Link>
              </Button>
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Shop"
          value={shop.name}
          detail={shop.timezone}
          icon={Store}
          accent="sunset"
        />
        <AdminStatCard
          label="Team Members"
          value={String(shop.member_count)}
          detail="Current shop access"
          icon={Users}
          accent="teal"
        />
        <AdminStatCard
          label="Your Role"
          value={formatCodeLabel(currentMembership?.role ?? "member")}
          detail={`${currentMembership?.permissions.length ?? 0} permissions`}
          icon={ShieldCheck}
          accent="ink"
        />
        <AdminStatCard
          label="Sign-in"
          value={String(profile.auth_methods.length)}
          detail={formatList(profile.auth_methods) || "No methods"}
          icon={KeyRound}
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shop</CardDescription>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Shop Name", value: shop.name },
                { label: "Timezone", value: shop.timezone },
                { label: "Members", value: String(shop.member_count) },
                { label: "Created", value: formatRelativeDate(shop.created_at) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {canManageShop ? (
              <form
                action={updateShopProfileFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <input type="hidden" name="return_to" value={returnTo} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input
                  name="name"
                  defaultValue={shop.name}
                  placeholder="Shop name"
                />
                <Input
                  name="timezone"
                  defaultValue={shop.timezone}
                  placeholder="Timezone"
                />
                <Button type="submit" size="sm" className="w-fit">
                  Save shop
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3 text-sm text-muted-foreground">
                You can view this shop profile, but only shop managers can edit it.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Account</CardDescription>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updateCurrentUserProfileFromFormAction}
              className="flex flex-col gap-2.5"
            >
              <input type="hidden" name="return_to" value={returnTo} />
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
                className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
              >
                <option value="en">en</option>
                <option value="my">my</option>
              </select>
              <Button type="submit" size="sm" className="w-fit">
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access</CardDescription>
            <CardTitle>Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Member Status
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatCodeLabel(currentMembership?.status ?? "active")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Permission Count
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {currentMembership?.permissions.length ?? 0}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Assigned Roles
              </p>
              <div className="flex flex-wrap gap-2">
                {(currentMembership?.roles ?? []).length > 0 ? (
                  currentMembership?.roles.map((role) => (
                    <PlatformStatusBadge
                      key={role.id}
                      status="active"
                      label={role.name}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No roles assigned.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Permissions
              </p>
              <div className="flex flex-wrap gap-2">
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
                    No permissions assigned.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shortcuts</CardDescription>
            <CardTitle>Related Pages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 pt-0">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/staffs">Open Staffs</Link>
            </Button>
            {canManageShop ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/billing">Open Billing</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/notifications">Open Notifications</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/orders">Open Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
