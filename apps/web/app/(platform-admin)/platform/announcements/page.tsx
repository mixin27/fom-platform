import Link from "next/link"
import { Megaphone, Plus, Send, TimerReset, FileText } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { requirePlatformAdmin } from "@/lib/auth/session"
import {
  getPlatformAnnouncements,
  type PlatformAnnouncement,
} from "@/lib/platform/api"
import {
  formatDate,
  formatRelativeDate,
} from "@/lib/platform/format"
import {
  getSingleSearchParam,
  type PlatformSearchParams,
} from "@/lib/platform/query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type PlatformAnnouncementsPageProps = {
  searchParams?: Promise<PlatformSearchParams>
}

function formatAudienceLabel(audiences: PlatformAnnouncement["audiences"]) {
  if (audiences.length === 0) {
    return "No audiences"
  }

  return audiences.join(", ")
}

export default async function PlatformAnnouncementsPage({
  searchParams,
}: PlatformAnnouncementsPageProps) {
  const params = (await searchParams) ?? {}
  const session = await requirePlatformAdmin()
  const response = await getPlatformAnnouncements(params)
  const data = response.data
  const search = getSingleSearchParam(params.search) ?? ""
  const state = getSingleSearchParam(params.state) ?? "all"
  const audience = getSingleSearchParam(params.audience) ?? "all"
  const canManageAnnouncements =
    session.platformAccess?.permissions.includes("platform.settings.write") ?? false

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Announcements"
        title="Announcements"
        description="Publish operational notices, planned maintenance, and customer-facing updates across marketing, auth, shop, and platform surfaces."
        actions={
          canManageAnnouncements ? (
            <Button asChild size="sm">
              <Link href="/platform/announcements/new">
                <Plus data-icon="inline-start" />
                New announcement
              </Link>
            </Button>
          ) : null
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="All announcements"
          value={String(data.overview.total)}
          detail="Draft, scheduled, active, ended, and archived."
          delta="Workspace total"
          icon={Megaphone}
          accent="sunset"
        />
        <DashboardStatCard
          title="Active"
          value={String(data.overview.active)}
          detail="Currently visible on one or more surfaces."
          delta="Live now"
          icon={Send}
          accent="teal"
        />
        <DashboardStatCard
          title="Scheduled"
          value={String(data.overview.scheduled)}
          detail="Published announcements that start in the future."
          delta="Upcoming"
          icon={TimerReset}
          accent="ink"
        />
        <DashboardStatCard
          title="Draft / archived"
          value={String(data.overview.draft + data.overview.archived)}
          detail={`${data.overview.draft} drafts and ${data.overview.archived} archived.`}
          delta="Not live"
          icon={FileText}
          accent="default"
        />
      </section>

      <PlatformDataTable
        title="Announcement register"
        description="Create once and target the right product surfaces."
        rows={data.announcements}
        emptyMessage="No announcements match the current filters."
        footer={`Showing ${data.announcements.length} announcement${
          data.announcements.length === 1 ? "" : "s"
        }`}
        toolbar={
          <form
            className="flex flex-col gap-2 sm:flex-row"
            action="/platform/announcements"
          >
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search title or body..."
              className="h-9 w-full min-w-[220px] sm:w-[240px]"
            />
            <select
              name="state"
              defaultValue={state}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
              <option value="archived">Archived</option>
            </select>
            <select
              name="audience"
              defaultValue={audience}
              className="h-9 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="all">All audiences</option>
              <option value="public">Marketing</option>
              <option value="auth">Auth</option>
              <option value="tenant">Shop portal</option>
              <option value="platform">Platform admin</option>
            </select>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
        columns={[
          {
            key: "title",
            header: "Announcement",
            render: (announcement) => (
              <div className="flex max-w-[360px] flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {announcement.title}
                  </span>
                  {announcement.pinned ? (
                    <PlatformStatusBadge status="active" label="Pinned" />
                  ) : null}
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {announcement.body}
                </span>
              </div>
            ),
          },
          {
            key: "audience",
            header: "Audiences",
            render: (announcement) => (
              <span className="text-sm text-foreground">
                {formatAudienceLabel(announcement.audiences)}
              </span>
            ),
          },
          {
            key: "severity",
            header: "Severity",
            render: (announcement) => (
              <PlatformStatusBadge status={announcement.severity} />
            ),
          },
          {
            key: "state",
            header: "State",
            render: (announcement) => <PlatformStatusBadge status={announcement.state} />,
          },
          {
            key: "schedule",
            header: "Schedule",
            render: (announcement) => (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>
                  Starts {announcement.starts_at ? formatDate(announcement.starts_at) : "Immediately"}
                </span>
                <span>
                  Ends {announcement.ends_at ? formatDate(announcement.ends_at) : "Open-ended"}
                </span>
                <span>Updated {formatRelativeDate(announcement.updated_at)}</span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (announcement) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/platform/announcements/${announcement.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}
