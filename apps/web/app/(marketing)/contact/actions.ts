"use server"

import { redirect } from "next/navigation"

import { AuthApiError, requestApi } from "@/lib/auth/api"

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

export async function submitContactFormAction(formData: FormData) {
  const email = normalizeField(formData.get("email"))
  const name = normalizeField(formData.get("name"))
  const subject = normalizeField(formData.get("subject"))
  const message = normalizeField(formData.get("message"))
  const website = normalizeField(formData.get("website"))

  if (!email || !message) {
    redirect("/contact?error=required")
  }

  try {
    await requestApi<{ received: boolean; reference_id: string | null }>(
      "/api/v1/public/contact",
      {
        method: "POST",
        json: {
          email,
          ...(name ? { name } : {}),
          ...(subject ? { subject } : {}),
          message,
          ...(website ? { website } : {}),
        },
      }
    )
  } catch (error) {
    if (error instanceof AuthApiError) {
      if (error.status === 429) {
        redirect("/contact?error=rate_limit")
      }
      if (error.code === "VALIDATION_ERROR") {
        redirect("/contact?error=validation")
      }
    }
    redirect("/contact?error=send_failed")
  }

  redirect("/contact?notice=sent")
}
