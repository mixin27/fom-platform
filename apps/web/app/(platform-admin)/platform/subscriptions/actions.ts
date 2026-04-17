"use server"

import { revalidatePath } from "next/cache"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

export type PlatformSubscriptionFormInput = {
  plan_code?: string
  status?: string
  start_at?: string
  end_at?: string | null
  auto_renews?: boolean
}

export type PlatformInvoiceFormInput = {
  amount?: number
  currency?: string
  status?: string
  payment_method?: string | null
  provider_ref?: string | null
  due_at?: string | null
  paid_at?: string | null
}

export type PlatformBillingActionResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
    }

function revalidatePlatformBillingWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/payments")
  revalidatePath("/platform/shops")
  revalidatePath("/platform/subscriptions")
  revalidatePath("/platform/support")
  revalidatePath("/platform/settings")
}

function toFieldErrors(details?: Array<{ field: string; errors: string[] }>) {
  return Object.fromEntries((details ?? []).map((detail) => [detail.field, detail.errors]))
}

function toActionError(
  error: unknown,
  fallbackMessage: string
): PlatformBillingActionResult {
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

export async function updatePlatformSubscriptionAction(
  subscriptionId: string,
  input: PlatformSubscriptionFormInput
): Promise<PlatformBillingActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/subscriptions/${subscriptionId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: input,
      },
    })

    revalidatePlatformBillingWorkspace()

    return {
      ok: true,
      message: "Subscription updated successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to update the subscription right now.")
  }
}

export async function createPlatformInvoiceAction(
  subscriptionId: string,
  input: PlatformInvoiceFormInput
): Promise<PlatformBillingActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/subscriptions/${subscriptionId}/invoices`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "POST",
        json: input,
      },
    })

    revalidatePlatformBillingWorkspace()

    return {
      ok: true,
      message: "Invoice created successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to create the invoice right now.")
  }
}

export async function updatePlatformInvoiceAction(
  invoiceId: string,
  input: PlatformInvoiceFormInput
): Promise<PlatformBillingActionResult> {
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/platform/invoices/${invoiceId}`,
      preferFreshSession: true,
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: input,
      },
    })

    revalidatePlatformBillingWorkspace()

    return {
      ok: true,
      message: "Invoice updated successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to update the invoice right now.")
  }
}
