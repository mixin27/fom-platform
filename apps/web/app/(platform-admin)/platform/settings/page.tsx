import Link from "next/link"
import {
  CreditCard,
  KeyRound,
  Megaphone,
  Shield,
  UserRound,
  WalletCards,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformSettings } from "@/lib/platform/api"
import { formatRelativeDate } from "@/lib/platform/format"
import {
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { updatePlatformSettingsProfileFromFormAction } from "./actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

type PlatformSettingsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformSettingsPage({
  searchParams,
}: PlatformSettingsPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformSettings()
  const data = response.data
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)

  return (
    <div className="flex flex-col gap-4">
      <AdminHeader
        title="Settings"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/plans">Manage plans</Link>
          </Button>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Role Count"
          value={String(data.access.role_count)}
          detail={data.access.role ?? "No primary role"}
          icon={Shield}
          accent="ink"
        />
        <AdminStatCard
          label="Active Sessions"
          value={String(data.profile.active_sessions)}
          detail={formatRelativeDate(data.profile.last_seen_at)}
          icon={UserRound}
          accent="teal"
        />
        <AdminStatCard
          label="Plans"
          value={String(data.plans.length)}
          detail="Billing catalog"
          icon={WalletCards}
          accent="sunset"
        />
        <AdminStatCard
          label="Permissions"
          value={String(data.access.permission_count)}
          detail="Effective access"
          icon={KeyRound}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Account</CardDescription>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updatePlatformSettingsProfileFromFormAction}
              className="flex flex-col gap-2.5"
            >
              <Input name="name" defaultValue={data.profile.name} placeholder="Name" />
              <Input
                name="email"
                defaultValue={data.profile.email ?? ""}
                placeholder="Email"
              />
              <Input
                name="phone"
                defaultValue={data.profile.phone ?? ""}
                placeholder="Phone"
              />
              <select
                name="locale"
                defaultValue={data.profile.locale}
                className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
              >
                <option value="en">en</option>
                <option value="my">my</option>
              </select>
              <Input
                type="password"
                name="password"
                placeholder="New password (optional)"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Last Seen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatRelativeDate(data.profile.last_seen_at)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Active Sessions
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {data.profile.active_sessions}
                  </p>
                </div>
              </div>
              <Button type="submit" size="sm" className="w-fit">
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access</CardDescription>
            <CardTitle>Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Roles
              </p>
              <div className="flex flex-wrap gap-2">
                {data.access.roles.length > 0 ? (
                  data.access.roles.map((role) => (
                    <PlatformStatusBadge key={role} status="active" label={role} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No platform roles assigned.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Permissions
              </p>
              <div className="flex flex-wrap gap-2">
                {data.access.permissions.length > 0 ? (
                  data.access.permissions.map((permission) => (
                    <PlatformStatusBadge
                      key={permission}
                      status="active"
                      label={permission}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No platform permissions assigned.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Catalog</CardDescription>
            <CardTitle>Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
            {data.plans.slice(0, 6).map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </p>
                  <PlatformStatusBadge
                    status={plan.is_active ? "active" : "inactive"}
                    label={plan.billing_period}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.shop_count} shops
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Shortcuts</CardDescription>
            <CardTitle>Related Pages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5 pt-0">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/platform/plans">
                <WalletCards data-icon="inline-start" />
                Open Plans
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/platform/payments">
                <CreditCard data-icon="inline-start" />
                Open Payments
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/platform/announcements">
                <Megaphone data-icon="inline-start" />
                Open Announcements
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/platform/support">
                <Shield data-icon="inline-start" />
                Open Support
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
