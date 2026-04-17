import Link from "next/link"
import { ArrowLeft, Mail, MessageSquareText, ShieldCheck } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { getPlatformPublicContactSubmission } from "@/lib/platform/api"
import { formatDate, formatRelativeDate } from "@/lib/platform/format"
import { getSingleSearchParam, type PlatformSearchParams } from "@/lib/platform/query"
import { updatePlatformContactSubmissionFromFormAction } from "../actions"
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

type PlatformContactSubmissionPageProps = {
  params: Promise<{
    submissionId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformContactSubmissionPage({
  params,
  searchParams,
}: PlatformContactSubmissionPageProps) {
  const { submissionId } = await params
  const query = (await searchParams) ?? {}
  const returnTo = `/platform/contact-form/${submissionId}`
  const response = await getPlatformPublicContactSubmission(submissionId, returnTo)
  const submission = response.data
  const notice = getSingleSearchParam(query.notice)
  const error = getSingleSearchParam(query.error)

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Contact Form"
        title={submission.subject ?? submission.email}
        description="Review the full message, sender details, and internal note on this public contact submission."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/contact-form">
              <ArrowLeft data-icon="inline-start" />
              Back to inbox
            </Link>
          </Button>
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

      <section className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="Sender"
          value={submission.name ?? "Anonymous"}
          detail={submission.email}
          delta={submission.subject ?? "No subject"}
          icon={Mail}
          accent="sunset"
        />
        <DashboardStatCard
          title="Message state"
          value={submission.archived ? "Archived" : "Open"}
          detail={`Received ${formatDate(submission.created_at)}`}
          delta={formatRelativeDate(submission.created_at)}
          icon={MessageSquareText}
          accent="teal"
        />
        <DashboardStatCard
          title="Email delivery"
          value={submission.email_status}
          detail={submission.ip_fingerprint ?? "No IP fingerprint"}
          delta={submission.user_agent ?? "No user agent"}
          icon={ShieldCheck}
          accent="ink"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Submitted message</CardDescription>
            <CardTitle>Full text</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-4 text-sm leading-7 text-[var(--fom-ink)]">
              <p className="whitespace-pre-wrap">{submission.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Admin handling</CardDescription>
            <CardTitle>Archive and internal note</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form
              action={updatePlatformContactSubmissionFromFormAction}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="submission_id" value={submission.id} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Sender email
                </label>
                <Input value={submission.email} readOnly />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  State
                </label>
                <select
                  name="state"
                  defaultValue={submission.archived ? "archived" : "open"}
                  className="h-9 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Admin note
                </label>
                <Textarea
                  name="admin_note"
                  defaultValue={submission.admin_note ?? ""}
                  className="min-h-[140px]"
                  placeholder="Internal note for follow-up"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm">
                  Save
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${submission.email}`}>Reply by email</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
