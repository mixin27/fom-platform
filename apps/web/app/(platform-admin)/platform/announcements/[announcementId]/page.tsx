import Link from "next/link"
import { ArrowLeft, PencilLine, Trash2 } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { requirePlatformAdmin } from "@/lib/auth/session"
import {
  getPlatformAnnouncement,
  type PlatformAnnouncement,
} from "@/lib/platform/api"
import { formatDate, formatRelativeDate } from "@/lib/platform/format"
import { getSingleSearchParam, type PlatformSearchParams } from "@/lib/platform/query"
import { deletePlatformAnnouncementFromFormAction } from "../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type PlatformAnnouncementPageProps = {
  params: Promise<{
    announcementId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

function formatAudienceLabel(audiences: PlatformAnnouncement["audiences"]) {
  return audiences.join(", ")
}

export default async function PlatformAnnouncementPage({
  params,
  searchParams,
}: PlatformAnnouncementPageProps) {
  const { announcementId } = await params
  const query = (await searchParams) ?? {}
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)
  const session = await requirePlatformAdmin()
  const canManageAnnouncements =
    session.platformAccess?.permissions.includes("platform.settings.write") ?? false
  const response = await getPlatformAnnouncement(
    announcementId,
    `/platform/announcements/${announcementId}`
  )
  const announcement = response.data

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Announcements"
        title={announcement.title}
        description="Review the full message, audience targeting, schedule, and publish state."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/announcements">
                <ArrowLeft data-icon="inline-start" />
                Back
              </Link>
            </Button>
            {canManageAnnouncements ? (
              <Button asChild size="sm">
                <Link href={`/platform/announcements/${announcement.id}/edit`}>
                  <PencilLine data-icon="inline-start" />
                  Edit
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="State"
          value={announcement.state}
          detail={`Severity ${announcement.severity}`}
          delta={announcement.status}
          icon={PencilLine}
          accent="sunset"
        />
        <DashboardStatCard
          title="Audiences"
          value={String(announcement.audiences.length)}
          detail={formatAudienceLabel(announcement.audiences)}
          delta={announcement.pinned ? "Pinned" : "Standard"}
          icon={ArrowLeft}
          accent="teal"
        />
        <DashboardStatCard
          title="Starts"
          value={announcement.starts_at ? formatDate(announcement.starts_at) : "Now"}
          detail={`Updated ${formatRelativeDate(announcement.updated_at)}`}
          delta="Schedule"
          icon={PencilLine}
          accent="ink"
        />
        <DashboardStatCard
          title="Ends"
          value={announcement.ends_at ? formatDate(announcement.ends_at) : "Open"}
          detail={announcement.cta_label ?? "No CTA"}
          delta={announcement.cta_url ?? "No action link"}
          icon={PencilLine}
          accent="default"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Message</CardDescription>
            <CardTitle>Announcement copy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex flex-wrap gap-2">
              <PlatformStatusBadge status={announcement.severity} />
              <PlatformStatusBadge status={announcement.state} />
              <PlatformStatusBadge
                status={announcement.pinned ? "active" : "inactive"}
                label={announcement.pinned ? "Pinned" : "Standard"}
              />
            </div>
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm leading-7 text-[var(--fom-ink)]">
              <p className="whitespace-pre-wrap">{announcement.body}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Delivery</CardDescription>
            <CardTitle>Targeting and metadata</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-[var(--fom-ink)]">Audiences</p>
              <p>{formatAudienceLabel(announcement.audiences)}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--fom-ink)]">CTA</p>
              <p>{announcement.cta_label ?? "No CTA label"}</p>
              <p>{announcement.cta_url ?? "No CTA URL"}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--fom-ink)]">Created by</p>
              <p>{announcement.created_by?.name ?? "Unknown"}</p>
              <p>{announcement.created_by?.email ?? "No email"}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--fom-ink)]">Last updated</p>
              <p>{announcement.updated_by?.name ?? "Unknown"}</p>
              <p>{formatDate(announcement.updated_at)}</p>
            </div>
            {canManageAnnouncements ? (
              <form action={deletePlatformAnnouncementFromFormAction}>
                <input type="hidden" name="announcement_id" value={announcement.id} />
                <Button type="submit" variant="outline" size="sm">
                  <Trash2 data-icon="inline-start" />
                  Delete announcement
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
