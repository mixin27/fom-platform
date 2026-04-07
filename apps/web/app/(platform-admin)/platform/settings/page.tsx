import { Shield, UserRound, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getSession } from "@/lib/auth/session"
import { getPlatformSettings } from "@/lib/platform/api"
import {
  formatCurrency,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

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

export default async function PlatformSettingsPage() {
  const [response, session] = await Promise.all([getPlatformSettings(), getSession()])
  const data = response.data
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
        description="Review platform owner identity, active access, and the currently configured plan catalog."
      />

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
        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Account</CardDescription>
            <CardTitle>Platform owner identity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-medium text-[var(--fom-ink)]">Name:</span>{" "}
                {data.profile.name}
              </div>
              <div>
                <span className="font-medium text-[var(--fom-ink)]">Email:</span>{" "}
                {data.profile.email ?? "—"}
              </div>
              <div>
                <span className="font-medium text-[var(--fom-ink)]">Locale:</span>{" "}
                {data.profile.locale}
              </div>
              <div>
                <span className="font-medium text-[var(--fom-ink)]">
                  Last seen:
                </span>{" "}
                {formatRelativeDate(data.profile.last_seen_at)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-black/6 bg-white shadow-none">
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
        <Card className="border border-black/6 bg-white shadow-none">
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
        <Card className="border border-black/6 bg-white shadow-none">
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

        <Card className="border border-black/6 bg-white shadow-none">
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

      <PlatformDataTable
        title="Configured plans"
        description="Plan catalog"
        rows={data.plans}
        emptyMessage="No plans configured yet."
        footer={`Showing ${data.plans.length} plans`}
        columns={[
          {
            key: "plan",
            header: "Plan",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--fom-ink)]">
                  {plan.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.code}
                </span>
              </div>
            ),
          },
          {
            key: "period",
            header: "Billing period",
            render: (plan) => plan.billing_period,
          },
          {
            key: "price",
            header: "Price",
            render: (plan) => formatCurrency(plan.price, plan.currency),
          },
          {
            key: "shops",
            header: "Shops",
            render: (plan) => plan.shop_count.toLocaleString(),
          },
          {
            key: "revenue",
            header: "Revenue",
            render: (plan) => formatCurrency(plan.collected_revenue, plan.currency),
          },
          {
            key: "status",
            header: "Status",
            render: (plan) => (
              <PlatformStatusBadge
                status={plan.is_active ? "active" : "inactive"}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
