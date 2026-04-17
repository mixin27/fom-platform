import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { getPlatformAnnouncement } from "@/lib/platform/api"
import { getSingleSearchParam, type PlatformSearchParams } from "@/lib/platform/query"
import { updatePlatformAnnouncementFromFormAction } from "../../actions"
import { AnnouncementForm } from "../../announcement-form"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type PlatformAnnouncementEditPageProps = {
  params: Promise<{
    announcementId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformAnnouncementEditPage({
  params,
  searchParams,
}: PlatformAnnouncementEditPageProps) {
  const { announcementId } = await params
  const query = (await searchParams) ?? {}
  const error = getSingleSearchParam(query.error)
  const returnTo = `/platform/announcements/${announcementId}`
  const response = await getPlatformAnnouncement(
    announcementId,
    `/platform/announcements/${announcementId}/edit`
  )
  const announcement = response.data

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Announcements"
        title={`Edit: ${announcement.title}`}
        description="Adjust timing, audiences, or message copy and publish the update immediately."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={returnTo}>
              <ArrowLeft data-icon="inline-start" />
              Back to detail
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Update</CardDescription>
          <CardTitle>Announcement details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AnnouncementForm
            action={updatePlatformAnnouncementFromFormAction}
            submitLabel="Save changes"
            announcement={announcement}
            returnTo={returnTo}
          />
        </CardContent>
      </Card>
    </div>
  )
}
