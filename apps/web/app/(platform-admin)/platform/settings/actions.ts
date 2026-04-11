"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidatePlatformSettingsWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/settings")
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
  return serialized.length > 0 ? `/platform/settings?${serialized}` : "/platform/settings"
}

function redirectSettings(input: { notice?: string; error?: string }) {
  redirect(appendRedirectParams(input))
}

function toActionMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.message
  }

  return fallbackMessage
}

export async function updatePlatformSettingsProfileFromFormAction(formData: FormData) {
  const name = normalizeTextField(formData.get("name"))
  const email = normalizeTextField(formData.get("email"))
  const phone = normalizeTextField(formData.get("phone"))
  const locale = normalizeTextField(formData.get("locale"))
  const password = normalizeTextField(formData.get("password"))

  const payload: Record<string, string> = {}

  if (name) {
    payload.name = name
  }
  if (email) {
    payload.email = email
  }
  if (phone) {
    payload.phone = phone
  }
  if (locale) {
    payload.locale = locale
  }
  if (password) {
    payload.password = password
  }

  if (Object.keys(payload).length === 0) {
    redirectSettings({ error: "Provide at least one profile field to update." })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/platform/settings/profile",
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: payload,
      },
    })

    revalidatePlatformSettingsWorkspace()
    redirectSettings({ notice: "Profile settings updated." })
  } catch (error) {
    redirectSettings({
      error: toActionMessage(error, "Unable to update profile settings right now."),
    })
  }
}

export async function updatePlatformPlanFromFormAction(formData: FormData) {
  const planId = normalizeTextField(formData.get("plan_id"))
  const priceText = normalizeTextField(formData.get("price"))
  const sortOrderText = normalizeTextField(formData.get("sort_order"))
  const status = normalizeTextField(formData.get("status"))

  if (!planId) {
    redirectSettings({ error: "Plan ID is required." })
  }

  const payload: Record<string, string | number | boolean> = {}

  if (priceText) {
    const price = Number.parseInt(priceText, 10)
    if (!Number.isFinite(price) || price < 0) {
      redirectSettings({ error: "Price must be a non-negative integer." })
    }
    payload.price = price
  }

  if (sortOrderText) {
    const sortOrder = Number.parseInt(sortOrderText, 10)
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      redirectSettings({ error: "Sort order must be a non-negative integer." })
    }
    payload.sort_order = sortOrder
  }

  if (status) {
    payload.is_active = status === "active"
  }

  if (Object.keys(payload).length === 0) {
    redirectSettings({ error: "Provide at least one plan field to update." })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/settings/plans/${planId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: payload,
      },
    })

    revalidatePlatformSettingsWorkspace()
    redirectSettings({ notice: "Plan updated." })
  } catch (error) {
    redirectSettings({
      error: toActionMessage(error, "Unable to update plan settings right now."),
    })
  }
}
