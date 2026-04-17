import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
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
  createPlatformSupportIssueFromFormAction,
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
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Support"
        title="Operational support queue"
        description="Track renewal risk, onboarding follow-up, and manual platform issues here. Payments and website contact messages now live on dedicated routes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/payments">Payments</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/contact-form">Contact Form</Link>
            </Button>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          detail="Invoices or renewals that may need follow-up."
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
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformDataTable
          title="Operator issues"
          description="Current support queue"
          rows={data.issues}
          emptyMessage="No open operator tasks right now."
          footer={`Showing ${data.issues.length} current issue${
            data.issues.length === 1 ? "" : "s"
          }`}
          columns={[
            {
              key: "shop",
              header: "Shop",
              render: (issue) => (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[var(--fom-ink)]">
                    {issue.shop_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {issue.kind}
                  </span>
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
              className: "w-[220px] px-4 py-2.5 text-right",
              cellClassName: "px-4 py-3 text-right",
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
                {
                  label: "Public contact inbox",
                  value: String(data.overview.public_contact_inbox),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-[var(--fom-surface-variant)] px-3.5 py-3"
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
                <Input name="shop_id" placeholder="Optional shop ID" className="h-9" />
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
    </div>
  )
}
