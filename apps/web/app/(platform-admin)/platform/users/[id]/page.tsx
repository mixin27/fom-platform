import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserIcon,
} from "lucide-react"

import { AdminHeader } from "@/features/portal-shell/components/admin/admin-header"
import { AdminStatCard } from "@/features/portal-shell/components/admin/admin-stat-card"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { AuthApiError } from "@/lib/auth/api"
import { getPlatformUser } from "@/lib/platform/api"
import { formatCodeLabel } from "@/lib/shop/format"
import {
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

interface PlatformUserDetailPageProps {
  params: Promise<{ id: string }>
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function PlatformUserDetailPage({
  params,
}: PlatformUserDetailPageProps) {
  const { id } = await params
  let user

  try {
    const response = await getPlatformUser(id)
    user = response.data
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title={user.name}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/users">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Users
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-[var(--fom-border-subtle)]/50 pb-4">
              <Avatar size="lg">
                <AvatarFallback className="bg-[var(--fom-accent)]/10 text-[var(--fom-accent)] text-lg font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold tracking-tight">
                    {user.name}
                  </CardTitle>
                  <PlatformStatusBadge status="active" label={formatCodeLabel(user.access_type)} />
                </div>
                <CardDescription className="text-sm font-medium">
                  {user.email ?? user.phone ?? "No contact info record"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Identity & Contact
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Email</span>
                        <span className="font-bold">{user.email ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Phone</span>
                        <span className="font-bold font-mono">{user.phone ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Locale</span>
                        <span className="font-bold uppercase">{user.locale}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Platform Roles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.platform_roles.length > 0 ? (
                        user.platform_roles.map((role) => (
                          <Badge key={role.id} variant="outline" className="h-7 px-3 text-[11px] font-bold uppercase tracking-wider">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No platform roles assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Access Context
                    </h3>
                    <div className="rounded-xl border border-[var(--fom-border-subtle)] bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Active Sessions</span>
                        <span className="font-bold">{user.active_session_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Last Active</span>
                        <span className="font-bold">
                          {user.last_active_at ? formatRelativeDate(user.last_active_at) : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Created At</span>
                        <span className="font-bold">{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Auth Methods
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.auth_methods.map((method) => (
                        <Badge key={method} variant="secondary" className="h-7 px-3 text-[11px] font-bold">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold">Linked Shop Access</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--fom-border-subtle)]/50">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shop</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fom-border-subtle)]/50">
                  {user.shops.length > 0 ? (
                    user.shops.map((membership) => (
                      <tr key={membership.shop_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/platform/shops/${membership.shop_id}`} className="font-bold text-foreground hover:text-[var(--fom-accent)] transition-colors">
                            {membership.shop_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <PlatformStatusBadge status="active" label={formatCodeLabel(membership.role ?? "member")} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="ghost" size="xs" className="h-7 px-2 font-bold text-[var(--fom-accent)]">
                            <Link href={`/platform/shops/${membership.shop_id}`}>
                              Manage
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                        No linked shop memberships found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[14px] border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 border-b border-[var(--fom-border-subtle)]/50">
              <CardTitle className="text-[13.5px] font-bold">Membership Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <AdminStatCard
                label="Owned Shops"
                value={user.owned_shop_count}
                className="shadow-none border-none bg-muted/20"
                icon={StoreIcon}
              />
              <AdminStatCard
                label="Active Roles"
                value={user.active_shop_count}
                className="shadow-none border-none bg-muted/20"
                icon={ShieldCheckIcon}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="h-11 rounded-xl font-bold justify-start px-4">
              <UserIcon data-icon="inline-start" className="size-4" />
              Reset Password
            </Button>
            <Button variant="outline" className="h-11 rounded-xl font-bold justify-start px-4 text-destructive hover:text-destructive">
              Revoke Platform Access
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
