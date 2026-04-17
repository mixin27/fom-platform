import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  LifeBuoy,
  MessagesSquare,
} from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformSupport } from "@/lib/platform/api"
import { formatRelativeDate } from "@/lib/platform/format"
import {
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import {
  archivePublicContactSubmissionAction,
  createPlatformSupportIssueFromFormAction,
  reviewPaymentProofAction,
  updatePlatformSupportIssueFromFormAction,
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
import { Textarea } from "@workspace/ui/components/textarea"

type PlatformSupportPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformSupportPage({
  searchParams,
}: PlatformSupportPageProps) {
  const params = (await searchParams) ?? {}
  const response = await getPlatformSupport()
  const data = response.data
  const publicSubmissions = data.public_contact?.submissions ?? []
  const publicInboxCount = data.overview.public_contact_inbox ?? 0
  const paymentProofs = data.payment_proofs ?? []
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Support"
        title="Support queue and operational follow-up"
        description="This workspace tracks billing risk, renewals, onboarding gaps, and low-adoption tenants."
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardStatCard
          title="Open items"
          value={String(data.overview.open_items)}
          detail="Current support and operator tasks."
          delta={`${data.overview.high_priority_items} high priority`}
          icon={LifeBuoy}
          accent="sunset"
        />
        <DashboardStatCard
          title="Billing items"
          value={String(data.overview.billing_items)}
          detail="Invoices or payment follow-up issues."
          delta="Billing"
          icon={AlertTriangle}
          accent="ink"
        />
        <DashboardStatCard
          title="Onboarding items"
          value={String(data.overview.onboarding_items)}
          detail="New shops that may still need setup help."
          delta="Onboarding"
          icon={MessagesSquare}
          accent="teal"
        />
        <DashboardStatCard
          title="Active shops"
          value={String(data.health.active_shops)}
          detail={`${data.health.inactive_shops} inactive shops currently detected.`}
          delta={`${data.health.total_shops} total`}
          icon={CheckCircle2}
          accent="default"
        />
        <DashboardStatCard
          title="Public contact inbox"
          value={String(publicInboxCount)}
          detail="Unarchived website form messages."
          delta="Contact form"
          icon={Inbox}
          accent="teal"
        />
        <DashboardStatCard
          title="Payment proof queue"
          value={String(data.overview.payment_proof_queue ?? 0)}
          detail="Submitted manual payment confirmations."
          delta="Billing proof"
          icon={AlertTriangle}
          accent="sunset"
        />
      </div>

      <PlatformDataTable
        title="Payment proof queue"
        description="Manual transfers awaiting finance review"
        rows={paymentProofs}
        emptyMessage="No payment proofs waiting for review."
        footer={`Showing ${paymentProofs.length} payment proof record(s)`}
        columns={[
          {
            key: "shop",
            header: "Shop / Invoice",
            render: (proof) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--fom-ink)]">
                  {proof.shop_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {proof.invoice_no}
                </span>
              </div>
            ),
          },
          {
            key: "claim",
            header: "Claim",
            render: (proof) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--fom-ink)]">
                  {proof.amount_claimed.toLocaleString()} {proof.currency_claimed}
                </span>
                <span className="text-xs text-muted-foreground">
                  {proof.payment_channel}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (proof) => (
              <PlatformStatusBadge status={proof.status} label={proof.status} />
            ),
          },
          {
            key: "submitted",
            header: "Submitted",
            render: (proof) => formatRelativeDate(proof.created_at),
          },
          {
            key: "actions",
            header: "Actions",
            render: (proof) => (
              <div className="flex flex-wrap justify-end gap-2">
                <form action={reviewPaymentProofAction}>
                  <input type="hidden" name="proof_id" value={proof.id} />
                  <input type="hidden" name="status" value="approved" />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={reviewPaymentProofAction}>
                  <input type="hidden" name="proof_id" value={proof.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <input
                    type="hidden"
                    name="admin_note"
                    value="Rejected from support workspace."
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            ),
            className: "w-[220px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
          },
        ]}
      />

      <PlatformDataTable
        title="Public contact queue"
        description="Website contact form (persisted + email outbox)"
        rows={publicSubmissions}
        emptyMessage="No messages in the public contact inbox."
        footer={`Showing ${publicSubmissions.length} inbox message(s)`}
        columns={[
          {
            key: "from",
            header: "From",
            render: (row) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[var(--fom-ink)]">{row.email}</span>
                {row.name ? (
                  <span className="text-xs text-muted-foreground">{row.name}</span>
                ) : null}
              </div>
            ),
          },
          {
            key: "preview",
            header: "Message",
            render: (row) => (
              <div className="flex max-w-[min(100%,320px)] flex-col gap-1">
                {row.subject ? (
                  <span className="text-sm font-medium text-[var(--fom-ink)]">
                    {row.subject}
                  </span>
                ) : null}
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {row.message}
                </span>
              </div>
            ),
          },
          {
            key: "email_status",
            header: "Email",
            render: (row) => (
              <PlatformStatusBadge status={row.email_status} label={row.email_status} />
            ),
          },
          {
            key: "when",
            header: "Received",
            render: (row) => formatRelativeDate(row.created_at),
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <form action={archivePublicContactSubmissionAction} className="inline">
                <input type="hidden" name="submission_id" value={row.id} />
                <Button type="submit" size="sm" variant="outline">
                  Archive
                </Button>
              </form>
            ),
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
          },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformDataTable
          title="Current operator tasks"
          description="Open queue"
          rows={data.issues}
          emptyMessage="No open operator tasks right now."
          footer={`Showing ${data.issues.length} current issues`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (issue) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[var(--fom-ink)]">
                    {issue.shop_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{issue.kind}</span>
                </div>
              ),
            },
            {
              key: "title",
              header: "Issue",
              render: (issue) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[var(--fom-ink)]">
                    {issue.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {issue.detail}
                  </span>
                </div>
              ),
            },
            {
              key: "severity",
              header: "Severity",
              render: (issue) => (
                <PlatformStatusBadge status={issue.severity} label={issue.severity} />
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (issue) => (
                <PlatformStatusBadge status={issue.status} label={issue.status} />
              ),
            },
            {
              key: "when",
              header: "When",
              render: (issue) => formatRelativeDate(issue.occurred_at),
            },
            {
              key: "actions",
              header: "Actions",
              render: (issue) => (
                <div className="flex flex-wrap justify-end gap-2">
                  {issue.status === "open" ? (
                    <form action={updatePlatformSupportIssueFromFormAction}>
                      <input type="hidden" name="issue_id" value={issue.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <Button type="submit" size="sm" variant="outline">
                        Start
                      </Button>
                    </form>
                  ) : null}
                  <form action={updatePlatformSupportIssueFromFormAction}>
                    <input type="hidden" name="issue_id" value={issue.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <input
                      type="hidden"
                      name="resolution_note"
                      value="Resolved from support workspace."
                    />
                    <Button type="submit" size="sm">
                      Resolve
                    </Button>
                  </form>
                  <form action={updatePlatformSupportIssueFromFormAction}>
                    <input type="hidden" name="issue_id" value={issue.id} />
                    <input type="hidden" name="status" value="dismissed" />
                    <input
                      type="hidden"
                      name="resolution_note"
                      value="Dismissed from support workspace."
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Dismiss
                    </Button>
                  </form>
                </div>
              ),
              className: "w-[220px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
            },
          ]}
        />

        <div className="flex flex-col gap-3">
          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Platform health</CardDescription>
              <CardTitle>Current posture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 pt-0">
              {[
                {
                  label: "Active shops",
                  value: `${data.health.active_shops} / ${data.health.total_shops}`,
                },
                {
                  label: "Inactive shops",
                  value: String(data.health.inactive_shops),
                },
                {
                  label: "Overdue invoices",
                  value: String(data.health.overdue_invoices),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-[var(--fom-admin-surface)] px-3.5 py-3"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--fom-ink)]">
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Manual triage</CardDescription>
              <CardTitle>Create support issue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                action={createPlatformSupportIssueFromFormAction}
                className="flex flex-col gap-2.5"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    name="kind"
                    defaultValue="operations"
                    className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
                  >
                    <option value="operations">Operations</option>
                    <option value="billing">Billing</option>
                    <option value="renewal">Renewal</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="adoption">Adoption</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    name="severity"
                    defaultValue="medium"
                    className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <Input
                  name="shop_id"
                  placeholder="Optional shop ID"
                  className="h-9"
                />
                <Input name="title" placeholder="Issue title" className="h-9" />
                <Textarea
                  name="detail"
                  placeholder="Issue details"
                  className="min-h-[92px]"
                />
                <Button type="submit" size="sm">
                  Create issue
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <PlatformDataTable
        title="Recent tenant activity"
        description="Activity snapshot"
        rows={data.recent_activity}
        emptyMessage="No recent tenant activity."
        footer={`Showing ${data.recent_activity.length} tenant activity rows`}
        columns={[
          {
            key: "shop",
            header: "Shop",
            render: (row) => row.shop_name,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <PlatformStatusBadge status={row.status} />,
          },
          {
            key: "orders",
            header: "Orders",
            render: (row) => row.total_orders.toLocaleString(),
          },
          {
            key: "last_active",
            header: "Last active",
            render: (row) => formatRelativeDate(row.last_active_at),
          },
        ]}
      />
    </div>
  )
}
