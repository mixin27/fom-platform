import "server-only"

import type { ShopMessengerOauthPageChoice } from "@/lib/shop/api"

export const SHOP_MESSENGER_OAUTH_SELECTION_COOKIE =
  "fom_messenger_page_selection"

export type ShopMessengerOauthSelectionState = {
  shop_id: string
  redirect_uri: string
  selection_token: string
  pages: ShopMessengerOauthPageChoice[]
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

    if (
      !parsed.shop_id ||
      !parsed.redirect_uri ||
      !parsed.selection_token ||
      !Array.isArray(parsed.pages)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
