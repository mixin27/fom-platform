import Link from "next/link"
import { ArrowRight, Shield, UserRound, Users } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
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
      <PageIntro
        eyebrow="Settings"
        title="Shop and account settings"
        description="Keep identity, profile, and access simple. Team management and billing now live on their own pages."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/staffs">
                Staffs
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            {canManageShop ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/billing">
                  Billing & Subscription
                  <ArrowRight data-icon="inline-end" />
                </Link>
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

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Shop members"
          value={String(shop.member_count)}
          detail="Member access is managed from the dedicated Staffs workspace."
          delta="Staffs workspace"
          icon={Users}
          accent="sunset"
        />
        <DashboardStatCard
          title="Your role"
          value={formatCodeLabel(currentMembership?.role ?? "member")}
          detail={`${currentMembership?.permissions.length ?? 0} effective shop permissions.`}
          delta={formatList(
            currentMembership?.roles.map((role) => role.code) ?? []
          )}
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
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shop profile</CardDescription>
            <CardTitle>Identity and timezone</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
                <Button type="submit" size="sm">
                  Update shop
                </Button>
              </form>
            ) : (
              <div className="text-sm leading-7 text-muted-foreground">
                <p>{shop.name}</p>
                <p>{shop.timezone}</p>
                <p className="mt-2">
                  Your account can view these fields but cannot edit them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Your profile</CardDescription>
            <CardTitle>Sign-in identity</CardTitle>
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
              <Button type="submit" size="sm">
                Update profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Effective access</CardDescription>
            <CardTitle>Current permissions</CardTitle>
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

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Dedicated workspaces</CardDescription>
            <CardTitle>Settings is intentionally smaller now</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm leading-7 text-muted-foreground">
              <p>
                Team access, billing, and invoice follow-up have been moved out
                of settings so this page stays focused on identity and access.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
                <p className="text-sm font-semibold text-foreground">
                  Staffs workspace
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Invite, disable, and review member access from the dedicated
                  team page.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/dashboard/staffs">Open Staffs</Link>
                </Button>
              </div>
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
                <p className="text-sm font-semibold text-foreground">
                  Billing & Subscription
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review invoices, payment status, and MyanMyanPay payment
                  sessions from the dedicated billing page.
                </p>
                {canManageShop ? (
                  <Button asChild size="sm" variant="outline" className="mt-4">
                    <Link href="/dashboard/billing">Open Billing</Link>
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Billing access stays with shop managers.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shop summary</CardDescription>
            <CardTitle>Current context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 text-sm">
            {[
              { label: "Shop", value: shop.name },
              { label: "Timezone", value: shop.timezone },
              {
                label: "Member status",
                value: formatCodeLabel(currentMembership?.status ?? "active"),
              },
              {
                label: "Joined",
                value: formatRelativeDate(shop.created_at),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
            <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
              <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Assigned roles
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(currentMembership?.roles ?? []).map((role) => (
                  <PlatformStatusBadge
                    key={role.id}
                    status="active"
                    label={role.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
