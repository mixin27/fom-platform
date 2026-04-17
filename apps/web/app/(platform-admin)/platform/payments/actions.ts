"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidatePlatformPaymentsWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/payments")
  revalidatePath("/platform/subscriptions")
  revalidatePath("/platform/support")
}

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

function normalizeDateField(value: FormDataEntryValue | null) {
  const normalized = normalizeTextField(value)

  if (!normalized) {
    return null
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? Number.NaN : parsed.toISOString()
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

export async function updatePlatformPaymentFromFormAction(formData: FormData) {
  const returnTo =
    normalizeTextField(formData.get("return_to")) || "/platform/payments"
  const invoiceId = normalizeTextField(formData.get("invoice_id"))
  const amount = normalizeIntegerField(formData.get("amount"))
  const currency = normalizeTextField(formData.get("currency"))
  const status = normalizeTextField(formData.get("status"))
  const dueAt = normalizeDateField(formData.get("due_at"))
  const paidAt = normalizeDateField(formData.get("paid_at"))

  if (!invoiceId) {
    redirectTo(returnTo, { error: "Invoice context is missing." })
  }

  if (amount !== undefined && !Number.isFinite(amount)) {
    redirectTo(returnTo, { error: "Amount must be a whole number." })
  }

  if (typeof dueAt === "number" || typeof paidAt === "number") {
    redirectTo(returnTo, { error: "Due date and paid date must be valid." })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/invoices/${invoiceId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: {
          ...(amount !== undefined ? { amount } : {}),
          ...(currency ? { currency } : {}),
          ...(status ? { status } : {}),
          due_at: dueAt,
          paid_at: paidAt,
        },
      },
    })

    revalidatePlatformPaymentsWorkspace()
    redirectTo(returnTo, { notice: "Invoice updated." })
  } catch (error) {
    redirectTo(returnTo, {
      error: toActionMessage(error, "Unable to update this invoice right now."),
    })
  }
}
