import Link from "next/link"
import { Inbox, MailCheck, MessageSquareText, ShieldAlert } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { getPlatformPublicContactSubmissions } from "@/lib/platform/api"
import { formatRelativeDate } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"

export default async function PlatformContactFormPage() {
  const response = await getPlatformPublicContactSubmissions()
  const data = response.data
  const archivedCount = data.submissions.filter((item) => item.archived).length
  const failedEmails = data.submissions.filter(
    (item) => item.email_status === "failed"
  ).length

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Contact Form"
        title="Public contact inbox"
        description="Review website contact submissions separately from operational support work."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/support">Support</Link>
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Open inbox"
          value={String(data.open_count)}
          detail="Unarchived website contact submissions."
          delta="Open"
          icon={Inbox}
          accent="sunset"
        />
        <DashboardStatCard
          title="Archived"
          value={String(archivedCount)}
          detail="Messages already triaged or closed."
          delta="Archived"
          icon={MailCheck}
          accent="teal"
        />
        <DashboardStatCard
          title="Total messages"
          value={String(data.submissions.length)}
          detail="Current records loaded into the admin inbox."
          delta="All submissions"
          icon={MessageSquareText}
          accent="ink"
        />
        <DashboardStatCard
          title="Email failures"
          value={String(failedEmails)}
          detail="Messages whose notification email did not send cleanly."
          delta="Needs review"
          icon={ShieldAlert}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Contact submissions"
        description="Public website contact data"
        rows={data.submissions}
        emptyMessage="No contact form submissions are available."
        footer={`Showing ${data.submissions.length} submission${
          data.submissions.length === 1 ? "" : "s"
        }`}
        columns={[
          {
            key: "from",
            header: "From",
            render: (row) => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{row.email}</span>
                <span className="text-xs text-muted-foreground">
                  {row.name ?? "No sender name"}
                </span>
              </div>
            ),
          },
          {
            key: "subject",
            header: "Subject",
            render: (row) => (
              <div className="flex max-w-[360px] flex-col gap-1">
                <span className="font-medium text-foreground">
                  {row.subject ?? "No subject"}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {row.message}
                </span>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email status",
            render: (row) => (
              <PlatformStatusBadge status={row.email_status} label={row.email_status} />
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => (
              <PlatformStatusBadge
                status={row.archived ? "inactive" : "active"}
                label={row.archived ? "Archived" : "Open"}
              />
            ),
          },
          {
            key: "received",
            header: "Received",
            render: (row) => formatRelativeDate(row.created_at),
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (row) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/contact-form/${row.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
