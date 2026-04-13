"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidatePlatformSettingsWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/plans")
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

  let redirectInput: { notice?: string; error?: string }

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
    redirectInput = { notice: "Profile settings updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update profile settings right now."),
    }
  }

  redirectSettings(redirectInput)
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

  let redirectInput: { notice?: string; error?: string }

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
    redirectInput = { notice: "Plan updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update plan settings right now."),
    }
  }

  redirectSettings(redirectInput)
}

export type PlatformPlanItemInput = {
  code: string
  label: string
  description?: string | null
  availability_status: "available" | "unavailable"
  sort_order?: number
}

export type PlatformPlanEditorInput = {
  code: string
  name: string
  description?: string | null
  price: number
  currency: string
  billing_period: string
  is_active: boolean
  sort_order: number
  items: PlatformPlanItemInput[]
}

export type PlatformPlanActionResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
    }

function toFieldErrors(details?: Array<{ field: string; errors: string[] }>) {
  return Object.fromEntries((details ?? []).map((detail) => [detail.field, detail.errors]))
}

function toPlanActionError(
  error: unknown,
  fallbackMessage: string
): PlatformPlanActionResult {
  if (error instanceof AuthApiError) {
    return {
      ok: false,
      message: error.message,
      fieldErrors: toFieldErrors(error.details),
    }
  }

  return {
    ok: false,
    message: fallbackMessage,
  }
}

export async function createPlatformPlanAction(
  input: PlatformPlanEditorInput
): Promise<PlatformPlanActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/platform/settings/plans",
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "POST",
        json: input,
      },
    })

    revalidatePlatformSettingsWorkspace()

    return {
      ok: true,
      message: "Plan created successfully.",
    }
  } catch (error) {
    return toPlanActionError(error, "Unable to create the plan right now.")
  }
}

export async function updatePlatformPlanAction(
  planId: string,
  input: Partial<PlatformPlanEditorInput>
): Promise<PlatformPlanActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/settings/plans/${planId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: input,
      },
    })

    revalidatePlatformSettingsWorkspace()

    return {
      ok: true,
      message: "Plan updated successfully.",
    }
  } catch (error) {
    return toPlanActionError(error, "Unable to update the plan right now.")
  }
}

export async function deletePlatformPlanAction(
  planId: string
): Promise<PlatformPlanActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/settings/plans/${planId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "DELETE",
      },
    })

    revalidatePlatformSettingsWorkspace()

    return {
      ok: true,
      message: "Plan deleted successfully.",
    }
  } catch (error) {
    return toPlanActionError(error, "Unable to delete the plan right now.")
  }
}
