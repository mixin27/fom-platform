import "server-only"

import { AuthApiError } from "@/lib/auth/api"

export const SHOP_MESSENGER_OAUTH_SELECTION_COOKIE =
  "fom_messenger_page_selection"

export type ShopMessengerOauthSelectionState = {
  shop_id: string
  selection_token: string
}

export function encodeShopMessengerOauthSelection(
  value: ShopMessengerOauthSelectionState
) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

export function decodeShopMessengerOauthSelection(value?: string | null) {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as ShopMessengerOauthSelectionState

    if (!parsed.shop_id || !parsed.selection_token) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function readMetaGraphMessage(error: AuthApiError) {
  const body = error.context?.body

  if (!body || typeof body !== "object") {
    return null
  }

  const graphError =
    "error" in body && body.error && typeof body.error === "object"
      ? body.error
      : null

  if (!graphError) {
    return null
  }

  const graphMessage =
    "message" in graphError && typeof graphError.message === "string"
      ? graphError.message.trim()
      : ""
  const fbTraceId =
    "fbtrace_id" in graphError && typeof graphError.fbtrace_id === "string"
      ? graphError.fbtrace_id.trim()
      : ""

  if (!graphMessage) {
    return null
  }

  return fbTraceId ? `${graphMessage} (fbtrace_id: ${fbTraceId})` : graphMessage
}

export function formatMessengerOauthErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (!(error instanceof AuthApiError)) {
    return fallbackMessage
  }

  const graphMessage = readMetaGraphMessage(error)

  if (!graphMessage || graphMessage === error.message) {
    return error.message
  }

  return `${error.message} Meta says: ${graphMessage}`
}
