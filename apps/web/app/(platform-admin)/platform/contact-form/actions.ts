"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidatePlatformContactWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/contact-form")
  revalidatePath("/platform/support")
}

function normalizeTextField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function appendRedirectParams(
  path: string,
  input: { notice?: string; error?: string }
) {
  const query = new URLSearchParams()

  if (input.notice) {
    query.set("notice", input.notice)
  }

  if (input.error) {
    query.set("error", input.error)
  }

  const serialized = query.toString()
  return serialized.length > 0 ? `${path}?${serialized}` : path
}

function redirectTo(path: string, input: { notice?: string; error?: string }) {
  redirect(appendRedirectParams(path, input))
}

function toActionMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.message
  }

  return fallbackMessage
}

export async function updatePlatformContactSubmissionFromFormAction(
  formData: FormData
) {
  const returnTo =
    normalizeTextField(formData.get("return_to")) || "/platform/contact-form"
  const submissionId = normalizeTextField(formData.get("submission_id"))
  const adminNote = normalizeTextField(formData.get("admin_note"))
  const state = normalizeTextField(formData.get("state"))

  if (!submissionId) {
    redirectTo(returnTo, { error: "Submission context is missing." })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/public-contact-submissions/${submissionId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: {
          archived: state === "archived",
          admin_note: adminNote,
        },
      },
    })

    revalidatePlatformContactWorkspace()
    redirectTo(returnTo, { notice: "Contact submission updated." })
  } catch (error) {
    redirectTo(returnTo, {
      error: toActionMessage(
        error,
        "Unable to update this contact submission right now."
      ),
    })
  }
}
