import Link from "next/link"
import { Shield, UserRound, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getSession } from "@/lib/auth/session"
import { getPlatformSettings } from "@/lib/platform/api"
import {
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import {
  updatePlatformSettingsProfileFromFormAction,
} from "./actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

type PlatformSettingsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformSettingsPage({
  searchParams,
}: PlatformSettingsPageProps) {
  const params = (await searchParams) ?? {}
  const [response, session] = await Promise.all([getPlatformSettings(), getSession()])
  const data = response.data
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const sessionPermissions = session?.platformAccess?.permissions ?? []
  const effectivePermissions = data.access.permissions
  const missingSessionPermissions = effectivePermissions.filter(
    (permission) => !sessionPermissions.includes(permission)
  )
  const extraSessionPermissions = sessionPermissions.filter(
    (permission) => !effectivePermissions.includes(permission)
  )

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Settings"
        title="Platform settings"
        description="Review platform owner identity, active access, and workspace diagnostics. Commercial plan management now lives on its own route."
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

      <div className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Platform roles"
          value={String(data.access.role_count)}
          detail={`${data.access.permission_count} effective permissions on this account.`}
          delta={data.access.role ?? "No role"}
          icon={Shield}
          accent="ink"
        />
        <DashboardStatCard
          title="Active sessions"
          value={String(data.profile.active_sessions)}
          detail="Current non-revoked browser or API sessions."
          delta={formatRelativeDate(data.profile.last_seen_at)}
          icon={UserRound}
          accent="teal"
        />
        <DashboardStatCard
          title="Plan catalog"
          value={String(data.plans.length)}
          detail="Configured shop plans available in the platform."
          delta="Commercial setup"
          icon={WalletCards}
          accent="sunset"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Account</CardDescription>
            <CardTitle>Platform owner identity</CardTitle>
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
              <div className="text-xs text-muted-foreground">
                Last seen {formatRelativeDate(data.profile.last_seen_at)}
              </div>
              <Button type="submit" size="sm">
                Update profile
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access policy</CardDescription>
            <CardTitle>Granted platform access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
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
          </CardContent>
        </Card>
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Roles</CardDescription>
            <CardTitle>Current assignments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {data.access.roles.length > 0 ? (
              data.access.roles.map((role) => (
                <PlatformStatusBadge key={role} status="active" label={role} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No platform roles assigned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Diagnostics</CardDescription>
            <CardTitle>Current web session</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            {session ? (
              <div className="flex flex-col gap-2">
                <div>
                  <span className="font-medium text-[var(--fom-ink)]">App role:</span>{" "}
                  {session.role}
                </div>
                <div>
                  <span className="font-medium text-[var(--fom-ink)]">
                    Platform role:
                  </span>{" "}
                  {session.platformAccess?.role ?? "—"}
                </div>
                <div>
                  <span className="font-medium text-[var(--fom-ink)]">
                    Shop access count:
                  </span>{" "}
                  {session.shops.length}
                </div>
                <div>
                  <span className="font-medium text-[var(--fom-ink)]">
                    Access token expires:
                  </span>{" "}
                  {formatDateTime(session.accessExpiresAt)}
                </div>
                <div>
                  <span className="font-medium text-[var(--fom-ink)]">
                    Refresh token expires:
                  </span>{" "}
                  {formatDateTime(session.refreshExpiresAt)}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No web session cookie is currently available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Diagnostics</CardDescription>
            <CardTitle>Cookie vs effective permissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Cookie session
              </p>
              <div className="flex flex-wrap gap-2">
                {sessionPermissions.length > 0 ? (
                  sessionPermissions.map((permission) => (
                    <PlatformStatusBadge
                      key={`session-${permission}`}
                      status="active"
                      label={permission}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No platform permissions stored in the current cookie session.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Backend effective access
              </p>
              <div className="flex flex-wrap gap-2">
                {effectivePermissions.length > 0 ? (
                  effectivePermissions.map((permission) => (
                    <PlatformStatusBadge
                      key={`effective-${permission}`}
                      status="active"
                      label={permission}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No effective platform permissions returned by the API.
                  </p>
                )}
              </div>
            </div>

            {missingSessionPermissions.length > 0 || extraSessionPermissions.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-medium">Session mismatch detected.</p>
                {missingSessionPermissions.length > 0 ? (
                  <p>
                    Missing in cookie session: {missingSessionPermissions.join(", ")}
                  </p>
                ) : null}
                {extraSessionPermissions.length > 0 ? (
                  <p>
                    Extra in cookie session: {extraSessionPermissions.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Cookie session permissions match the current backend access.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Commercial catalog</CardDescription>
          <CardTitle>Plan management moved to a dedicated workspace</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Pricing, availability, and feature-item management now live on a
            separate page so the settings workspace stays focused on account and
            access configuration.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.plans.map((plan) => (
              <PlatformStatusBadge
                key={plan.id}
                status={plan.is_active ? "active" : "inactive"}
                label={`${plan.name} · ${plan.billing_period}`}
              />
            ))}
          </div>
          <div>
            <Button asChild size="sm">
              <Link href="/platform/plans">Open plan manager</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
