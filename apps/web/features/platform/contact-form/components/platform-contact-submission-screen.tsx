"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Mail, MessageSquareText, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { ClientApiError } from "@/features/shared/client/api-client"
import {
  fetchPlatformContactSubmission,
  getPlatformContactSubmissionQueryKey,
  updatePlatformContactSubmission,
} from "@/features/platform/contact-form/client"
import type { PlatformPublicContactSubmission } from "@/lib/platform/api"
import { formatDate, formatRelativeDate } from "@/lib/platform/format"
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

type PlatformContactSubmissionScreenProps = {
  submissionId: string
  initialData: PlatformPublicContactSubmission
}

export function PlatformContactSubmissionScreen({
  submissionId,
  initialData,
}: PlatformContactSubmissionScreenProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: submission } = useQuery({
    queryKey: getPlatformContactSubmissionQueryKey(submissionId),
    queryFn: () => fetchPlatformContactSubmission(submissionId),
    initialData,
  })

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      updatePlatformContactSubmission(submissionId, {
        archived: String(formData.get("state") ?? "open") === "archived",
        adminNote: String(formData.get("admin_note") ?? "").trim(),
      }),
    onSuccess: (nextSubmission) => {
      queryClient.setQueryData(
        getPlatformContactSubmissionQueryKey(submissionId),
        nextSubmission
      )
      toast.success("Contact submission updated")
      router.refresh()
    },
    onError: (error) => {
      toast.error("Unable to update this message", {
        description:
          error instanceof ClientApiError
            ? error.message
            : "Please try again in a moment.",
      })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(new FormData(event.currentTarget))
  }

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
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
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
