import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { createPlatformAnnouncementFromFormAction } from "../actions"
import { AnnouncementForm } from "../announcement-form"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function PlatformAnnouncementCreatePage() {
  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Announcements"
        title="New announcement"
        description="Create a draft or immediately publish a message to the selected surfaces."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/announcements">
              <ArrowLeft data-icon="inline-start" />
              Back to announcements
            </Link>
          </Button>
        }
      />

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Compose</CardDescription>
          <CardTitle>Announcement details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AnnouncementForm
            action={createPlatformAnnouncementFromFormAction}
            submitLabel="Create announcement"
          />
        </CardContent>
      </Card>
    </div>
  )
}
