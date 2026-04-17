"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function normalizeTextField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeIntegerField(value: FormDataEntryValue | null) {
  const normalized = normalizeTextField(value)

  if (!normalized) {
    return undefined
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeCheckboxField(value: FormDataEntryValue | null) {
  return value === "on"
}

function normalizeDateTimeField(value: FormDataEntryValue | null) {
  const normalized = normalizeTextField(value)

  if (!normalized) {
    return null
  }

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? Number.NaN : parsed.toISOString()
}

function normalizeAudienceFields(values: FormDataEntryValue[]) {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function toActionMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.message
  }

  return fallbackMessage
}

function buildRedirectPath(path: string, input: { notice?: string; error?: string }) {
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

function revalidateAnnouncementSurfaces() {
  revalidatePath("/", "layout")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/platform", "layout")
  revalidatePath("/platform/announcements")
}

function getAnnouncementPayload(formData: FormData) {
  const sortOrder = normalizeIntegerField(formData.get("sort_order"))
  const startsAt = normalizeDateTimeField(formData.get("starts_at"))
  const endsAt = normalizeDateTimeField(formData.get("ends_at"))

  if (sortOrder !== undefined && !Number.isFinite(sortOrder)) {
    throw new AuthApiError(
      "Sort order must be a whole number.",
      "INVALID_FORM",
      400
    )
  }

  if (typeof startsAt === "number" || typeof endsAt === "number") {
    throw new AuthApiError(
      "Start and end time must be valid.",
      "INVALID_FORM",
      400
    )
  }

  return {
    title: normalizeTextField(formData.get("title")),
    body: normalizeTextField(formData.get("body")),
    severity: normalizeTextField(formData.get("severity")) || "info",
    status: normalizeTextField(formData.get("status")) || "draft",
    audiences: normalizeAudienceFields(formData.getAll("audiences")),
    cta_label: normalizeTextField(formData.get("cta_label")) || null,
    cta_url: normalizeTextField(formData.get("cta_url")) || null,
    starts_at: startsAt,
    ends_at: endsAt,
    pinned: normalizeCheckboxField(formData.get("pinned")),
    sort_order: sortOrder ?? 0,
  }
}

export async function createPlatformAnnouncementFromFormAction(formData: FormData) {
  const payload = getAnnouncementPayload(formData)
  const returnTo = normalizeTextField(formData.get("return_to"))

  try {
    const response = await requestAuthenticatedActionApiEnvelope<{
      id: string
    }>({
      path: "/api/v1/platform/announcements",
      requiredAccess: "platform",
      preferFreshSession: true,
      init: {
        method: "POST",
        json: payload,
      },
    })

    revalidateAnnouncementSurfaces()
    redirect(
      buildRedirectPath(
        returnTo || `/platform/announcements/${response.data.id}`,
        {
          notice: "Announcement created.",
        }
      )
    )
  } catch (error) {
    redirect(
      buildRedirectPath("/platform/announcements/new", {
        error: toActionMessage(error, "Unable to create the announcement right now."),
      })
    )
  }
}

export async function updatePlatformAnnouncementFromFormAction(formData: FormData) {
  const announcementId = normalizeTextField(formData.get("announcement_id"))
  const returnTo =
    normalizeTextField(formData.get("return_to")) ||
    `/platform/announcements/${announcementId}`

  if (!announcementId) {
    redirect(buildRedirectPath("/platform/announcements", { error: "Announcement context is missing." }))
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/announcements/${announcementId}`,
      requiredAccess: "platform",
      preferFreshSession: true,
      init: {
        method: "PATCH",
        json: getAnnouncementPayload(formData),
      },
    })

    revalidateAnnouncementSurfaces()
    redirect(buildRedirectPath(returnTo, { notice: "Announcement updated." }))
  } catch (error) {
    redirect(
      buildRedirectPath(`/platform/announcements/${announcementId}/edit`, {
        error: toActionMessage(error, "Unable to update the announcement right now."),
      })
    )
  }
}

export async function deletePlatformAnnouncementFromFormAction(formData: FormData) {
  const announcementId = normalizeTextField(formData.get("announcement_id"))

  if (!announcementId) {
    redirect(buildRedirectPath("/platform/announcements", { error: "Announcement context is missing." }))
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/announcements/${announcementId}`,
      requiredAccess: "platform",
      preferFreshSession: true,
      init: {
        method: "DELETE",
      },
    })

    revalidateAnnouncementSurfaces()
    redirect(buildRedirectPath("/platform/announcements", { notice: "Announcement deleted." }))
  } catch (error) {
    redirect(
      buildRedirectPath(`/platform/announcements/${announcementId}`, {
        error: toActionMessage(error, "Unable to delete the announcement right now."),
      })
    )
  }
}
