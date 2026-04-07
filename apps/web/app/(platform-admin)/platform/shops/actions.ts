"use server"

import { revalidatePath } from "next/cache"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"

export type PlatformShopFormInput = {
  name: string
  timezone: string
  owner_name: string
  owner_email: string
  owner_phone?: string
  owner_password?: string
}

export type PlatformShopActionResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
    }

function revalidatePlatformWorkspace() {
  revalidatePath("/platform")
  revalidatePath("/platform/shops")
  revalidatePath("/platform/subscriptions")
  revalidatePath("/platform/support")
}

function toFieldErrors(details?: Array<{ field: string; errors: string[] }>) {
  return Object.fromEntries((details ?? []).map((detail) => [detail.field, detail.errors]))
}

function toActionError(error: unknown, fallbackMessage: string): PlatformShopActionResult {
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

export async function createPlatformShopAction(
  input: PlatformShopFormInput
): Promise<PlatformShopActionResult> {
  try {
    await requestAuthenticatedApiEnvelope({
      path: "/api/v1/platform/shops",
      retryPath: "/platform/shops",
      requiredAccess: "platform",
      init: {
        method: "POST",
        json: input,
      },
    })

    revalidatePlatformWorkspace()

    return {
      ok: true,
      message: "Shop created successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to create the shop right now.")
  }
}

export async function updatePlatformShopAction(
  shopId: string,
  input: Partial<PlatformShopFormInput>
): Promise<PlatformShopActionResult> {
  try {
    await requestAuthenticatedApiEnvelope({
      path: `/api/v1/platform/shops/${shopId}`,
      retryPath: "/platform/shops",
      requiredAccess: "platform",
      init: {
        method: "PATCH",
        json: input,
      },
    })

    revalidatePlatformWorkspace()

    return {
      ok: true,
      message: "Shop updated successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to update the shop right now.")
  }
}

export async function deletePlatformShopAction(
  shopId: string
): Promise<PlatformShopActionResult> {
  try {
    await requestAuthenticatedApiEnvelope({
      path: `/api/v1/platform/shops/${shopId}`,
      retryPath: "/platform/shops",
      requiredAccess: "platform",
      init: {
        method: "DELETE",
      },
    })

    revalidatePlatformWorkspace()

    return {
      ok: true,
      message: "Shop deleted successfully.",
    }
  } catch (error) {
    return toActionError(error, "Unable to delete the shop right now.")
  }
}
