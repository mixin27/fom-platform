"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidatePlatformSupportWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/support")
}

function normalizeTextField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function appendRedirectParams(input: {
  notice?: string
  error?: string
}) {
  const query = new URLSearchParams()
  if (input.notice) {
    query.set("notice", input.notice)
  }
  if (input.error) {
    query.set("error", input.error)
  }
  const serialized = query.toString()
  return serialized.length > 0 ? `/platform/support?${serialized}` : "/platform/support"
}

function redirectSupport(input: { notice?: string; error?: string }) {
  redirect(appendRedirectParams(input))
}

function toActionMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.message
  }

  return fallbackMessage
}

export async function createPlatformSupportIssueFromFormAction(formData: FormData) {
  const kind = normalizeTextField(formData.get("kind"))
  const severity = normalizeTextField(formData.get("severity"))
  const title = normalizeTextField(formData.get("title"))
  const detail = normalizeTextField(formData.get("detail"))
  const shopId = normalizeTextField(formData.get("shop_id"))

  if (!title || !detail || !kind || !severity) {
    redirectSupport({
      error: "Kind, severity, title, and detail are required.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/platform/support/issues",
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "POST",
        json: {
          kind,
          severity,
          title,
          detail,
          ...(shopId ? { shop_id: shopId } : {}),
        },
      },
    })

    revalidatePlatformSupportWorkspace()
  } catch (error) {
    redirectSupport({
      error: toActionMessage(error, "Unable to create support issue right now."),
    })
  }

  redirectSupport({ notice: "Support issue created." })
}

export async function updatePlatformSupportIssueFromFormAction(formData: FormData) {
  const issueId = normalizeTextField(formData.get("issue_id"))
  const status = normalizeTextField(formData.get("status"))
  const resolutionNote = normalizeTextField(formData.get("resolution_note"))

  if (!issueId || !status) {
    redirectSupport({
      error: "Issue ID and status are required.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/support/issues/${issueId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: {
          status,
          ...(resolutionNote ? { resolution_note: resolutionNote } : {}),
        },
      },
    })

    revalidatePlatformSupportWorkspace()
  } catch (error) {
    redirectSupport({
      error: toActionMessage(error, "Unable to update support issue right now."),
    })
  }

  redirectSupport({ notice: "Support issue updated." })
}

export async function archivePublicContactSubmissionAction(formData: FormData) {
  const submissionId = normalizeTextField(formData.get("submission_id"))

  if (!submissionId) {
    redirectSupport({ error: "Submission ID is required." })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/public-contact-submissions/${submissionId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: { archived: true },
      },
    })

    revalidatePlatformSupportWorkspace()
  } catch (error) {
    redirectSupport({
      error: toActionMessage(error, "Unable to archive that submission."),
    })
  }

  redirectSupport({ notice: "Contact message archived." })
}
