import { Shield, Store, UserRound } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPublicLaunchConfig } from "@/lib/launch/api"
import {
  getCurrentUserProfile,
  getShopBilling,
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
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  createInvoiceMmqrSessionFromFormAction,
  addShopMemberFromFormAction,
  submitShopPaymentProofFromFormAction,
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
  const { activeShop } = await getShopPortalContext()
  const permissions = new Set(activeShop.membership.permissions)
  const canManageShop = permissions.has("shops.write")
  const [
    shopResponse,
    membersResponse,
    profileResponse,
    billingResponse,
    launchConfig,
  ] = await Promise.all([
    getShopDetails(currentHref),
    getShopMembers(params, currentHref),
    getCurrentUserProfile(currentHref),
    canManageShop ? getShopBilling(currentHref) : Promise.resolve(null),
    getPublicLaunchConfig(),
  ])
  const shop = shopResponse.data
  const members = membersResponse.data
  const profile = profileResponse.data
  const billing = billingResponse?.data ?? null
  const pagination = membersResponse.meta?.pagination as
    | ShopCursorPagination
    | undefined
  const currentCursor = getSingleSearchParam(params.cursor)
  const limit = Number(
    getSingleSearchParam(params.limit) ?? pagination?.limit ?? 20
  )
  const previousCursor = getPreviousCursor(currentCursor, limit)
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const canManageMembers = permissions.has("members.manage")
  const currentMembership =
    profile.shops.find((shopRecord) => shopRecord.id === activeShop.id)
      ?.membership ?? null

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
                <input type="hidden" name="return_to" value={currentHref} />
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
                  Your account cannot edit shop identity fields.
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
              <input type="hidden" name="return_to" value={currentHref} />
              <Input
                name="name"
                defaultValue={profile.name}
                placeholder="Name"
              />
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
                  <span className="font-semibold text-foreground">
                    {member.user.name}
                  </span>
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
              render: (member) => (
                <PlatformStatusBadge status={member.status} />
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
                const isOwner = member.roles.some(
                  (role) => role.code === "owner"
                )

                if (!canManageMembers || isCurrentUser || isOwner) {
                  return (
                    <span className="text-xs text-muted-foreground">
                      No actions
                    </span>
                  )
                }

                const nextStatus =
                  member.status === "disabled" ? "active" : "disabled"

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

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access control</CardDescription>
            <CardTitle>Add member</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {canManageMembers ? (
              <form
                action={addShopMemberFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input name="name" placeholder="Member name" />
                <Input name="email" placeholder="Email" />
                <Input name="phone" placeholder="Phone" />
                <select
                  name="role_code"
                  defaultValue="staff"
                  className="h-9 rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-3 text-sm"
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

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Current plan"
          value={billing?.overview.plan_name ?? "No plan"}
          detail={
            billing?.overview.plan_price != null &&
            billing?.overview.plan_currency
              ? `${formatCurrency(
                  billing.overview.plan_price,
                  billing.overview.plan_currency
                )} · ${billing.overview.billing_period ?? "custom"}`
              : "No billing plan is attached to this shop yet."
          }
          delta={billing?.overview.plan_code ?? "billing"}
          icon={Shield}
          accent="sunset"
        />
        <DashboardStatCard
          title="Subscription state"
          value={formatCodeLabel(billing?.overview.status ?? "inactive")}
          detail={
            billing?.overview.current_period_end
              ? `Current period ends ${formatDate(billing.overview.current_period_end)}.`
              : "No renewal date is currently scheduled."
          }
          delta={
            billing?.overview.auto_renews
              ? "Auto renew enabled"
              : "Manual renewal"
          }
          icon={Store}
          accent="teal"
        />
        <DashboardStatCard
          title="Outstanding balance"
          value={formatCurrency(billing?.overview.outstanding_balance ?? 0)}
          detail="Pending and overdue invoices still open for this shop."
          delta={`${billing?.overview.overdue_invoice_count ?? 0} overdue`}
          icon={UserRound}
          accent="ink"
        />
      </section>

      {canManageShop ? (
        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Billing visibility</CardDescription>
              <CardTitle>Subscription health</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="flex flex-wrap gap-2">
                <PlatformStatusBadge
                  status={billing?.overview.status ?? "inactive"}
                  label={formatCodeLabel(
                    billing?.overview.status ?? "inactive"
                  )}
                />
                {billing?.overview.latest_invoice_status ? (
                  <PlatformStatusBadge
                    status={billing.overview.latest_invoice_status}
                    label={`Latest invoice ${formatCodeLabel(
                      billing.overview.latest_invoice_status
                    )}`}
                  />
                ) : null}
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
                  <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
                    Next due
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {billing?.overview.next_due_at
                      ? formatDate(billing.overview.next_due_at)
                      : "No unpaid invoice"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4">
                  <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
                    Last paid
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {billing?.overview.latest_paid_at
                      ? formatDate(billing.overview.latest_paid_at)
                      : "No paid invoice yet"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm leading-7 text-muted-foreground">
                <p>
                  Subscription created{" "}
                  {billing?.subscription?.created_at
                    ? formatRelativeDate(billing.subscription.created_at)
                    : "not yet"}
                  .
                </p>
                <p>
                  Renewal mode:{" "}
                  {billing?.overview.auto_renews
                    ? "automatic on the current billing cadence"
                    : "manual renewal from the platform side"}
                  .
                </p>
                <p>
                  This section is read-only in the shop portal so billing
                  control stays on the platform workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--fom-orange)]/20 bg-[rgba(249,122,31,0.06)] p-4 text-sm leading-7 text-[var(--fom-ink)]">
                <p className="font-semibold">{launchConfig.billing.title}</p>
                <p className="mt-2 text-muted-foreground">
                  {launchConfig.billing.body}
                </p>
                {launchConfig.billing.channels.length > 0 ? (
                  <p className="mt-2 text-muted-foreground">
                    Accepted channels:{" "}
                    {launchConfig.billing.channels.join(", ")}.
                  </p>
                ) : null}
                <Button
                  asChild
                  size="sm"
                  className="mt-4 bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                >
                  <a href={launchConfig.billing.contact_url}>
                    {launchConfig.billing.contact_label}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <PlatformDataTable
            title="Recent invoices"
            description="Latest billing records for this shop"
            rows={billing?.invoices.slice(0, 8) ?? []}
            emptyMessage="No invoices have been created for this shop yet."
            footer={`${Math.min(billing?.invoices.length ?? 0, 8)} invoice record${
              (billing?.invoices.length ?? 0) === 1 ? "" : "s"
            } visible`}
            columns={[
              {
                key: "invoice",
                header: "Invoice",
                render: (invoice) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">
                      {invoice.invoice_no}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Created {formatRelativeDate(invoice.created_at)}
                    </span>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (invoice) => (
                  <PlatformStatusBadge status={invoice.status} />
                ),
              },
              {
                key: "mmqr",
                header: "MMQR",
                render: (invoice) =>
                  invoice.latest_transaction ? (
                    <PlatformStatusBadge
                      status={invoice.latest_transaction.status}
                      label={`MMQR ${formatCodeLabel(
                        invoice.latest_transaction.status
                      )}`}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Not generated</span>
                  ),
              },
              {
                key: "amount",
                header: "Amount",
                render: (invoice) =>
                  formatCurrency(invoice.amount, invoice.currency),
              },
              {
                key: "due",
                header: "Due",
                render: (invoice) =>
                  invoice.due_at ? formatDate(invoice.due_at) : "—",
              },
              {
                key: "paid",
                header: "Paid",
                render: (invoice) =>
                  invoice.paid_at ? formatDate(invoice.paid_at) : "—",
              },
              {
                key: "actions",
                header: "Actions",
                render: (invoice) =>
                  invoice.status === "paid" ? (
                    <span className="text-xs text-muted-foreground">Paid</span>
                  ) : (
                    <form action={createInvoiceMmqrSessionFromFormAction}>
                      <input type="hidden" name="return_to" value={currentHref} />
                      <input type="hidden" name="shop_id" value={activeShop.id} />
                      <input type="hidden" name="invoice_id" value={invoice.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Generate MMQR
                      </Button>
                    </form>
                  ),
                className: "w-[170px] px-4 py-2.5 text-right",
                cellClassName: "px-4 py-3 text-right",
              },
            ]}
          />
        </div>
      ) : (
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Billing visibility</CardDescription>
            <CardTitle>
              Subscription details stay with shop management access
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-muted-foreground">
            The billing plan, invoice state, and renewal window are only shown
            to members who can manage shop settings.
          </CardContent>
        </Card>
      )}

      {canManageShop ? (
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Manual payment flow</CardDescription>
              <CardTitle>Submit payment proof</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                action={submitShopPaymentProofFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <input type="hidden" name="return_to" value={currentHref} />
                <input type="hidden" name="shop_id" value={activeShop.id} />
                <Input name="invoice_no" placeholder="Invoice number (INV-...)" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    name="amount_claimed"
                    type="number"
                    min={0}
                    placeholder="Amount paid"
                  />
                  <Input
                    name="currency_claimed"
                    defaultValue={billing?.overview.plan_currency ?? "MMK"}
                    placeholder="Currency"
                  />
                </div>
                <Input
                  name="payment_channel"
                  placeholder="Channel (KBZPay, WavePay, bank transfer)"
                />
                <Input name="paid_at" type="datetime-local" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input name="sender_name" placeholder="Sender name (optional)" />
                  <Input name="sender_phone" placeholder="Sender phone (optional)" />
                </div>
                <Input
                  name="transaction_ref"
                  placeholder="Transaction ref (optional)"
                />
                <Input name="note" placeholder="Optional note" />
                <Button type="submit" size="sm">
                  Submit proof
                </Button>
              </form>
            </CardContent>
          </Card>

          <PlatformDataTable
            title="Submitted payment proofs"
            description="Review status from platform operations"
            rows={billing?.payment_proofs.slice(0, 10) ?? []}
            emptyMessage="No payment proofs submitted yet."
            footer={`${Math.min(billing?.payment_proofs.length ?? 0, 10)} proof record${
              (billing?.payment_proofs.length ?? 0) === 1 ? "" : "s"
            } visible`}
            columns={[
              {
                key: "invoice",
                header: "Invoice",
                render: (proof) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">
                      {proof.invoice_no}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(proof.amount_claimed, proof.currency_claimed)} ·{" "}
                      {proof.payment_channel}
                    </span>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (proof) => <PlatformStatusBadge status={proof.status} />,
              },
              {
                key: "submitted",
                header: "Submitted",
                render: (proof) => formatRelativeDate(proof.created_at),
              },
              {
                key: "reviewed",
                header: "Reviewed",
                render: (proof) =>
                  proof.reviewed_at
                    ? `${formatRelativeDate(proof.reviewed_at)}${proof.reviewed_by ? ` by ${proof.reviewed_by.name}` : ""}`
                    : "Pending",
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  )
}
