import { NextResponse } from "next/server"

import type { ShopMessengerOauthCompleteResult } from "@/lib/shop/api"
import {
  encodeShopMessengerOauthSelection,
  formatMessengerOauthErrorMessage,
  SHOP_MESSENGER_OAUTH_SELECTION_COOKIE,
} from "@/lib/messenger/oauth"
import { buildAppUrl } from "@/lib/app/base-url"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import { getActiveShop, getSession } from "@/lib/auth/session"

function buildInboxRedirect(
  requestUrl: string,
  input: {
    notice?: string
    error?: string
  }
) {
  const url = new URL("/dashboard/inbox", requestUrl)

  if (input.notice) {
    url.searchParams.set("notice", input.notice)
  }

  if (input.error) {
    url.searchParams.set("error", input.error)
  }

  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const session = await getSession()
  const shopId = session ? (getActiveShop(session)?.id ?? null) : null

  if (!shopId) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const url = new URL(request.url)
  const oauthError = url.searchParams.get("error")
  const oauthErrorDescription = url.searchParams.get("error_description")

  if (oauthError) {
    return buildInboxRedirect(request.url, {
      error:
        oauthErrorDescription?.trim() ||
        "Messenger connect was cancelled or rejected by Meta.",
    })
  }

  const code = url.searchParams.get("code")?.trim() ?? ""
  const state = url.searchParams.get("state")?.trim() ?? ""

  if (!code || !state) {
    return buildInboxRedirect(request.url, {
      error: "Messenger connect did not return a valid authorization code.",
    })
  }

  const redirectUri = buildAppUrl(
    "/dashboard/inbox/connect-meta/callback",
    request.url
  ).toString()

  try {
    const response =
      await requestAuthenticatedActionApiEnvelope<ShopMessengerOauthCompleteResult>(
        {
          path: `/api/v1/shops/${shopId}/messenger/oauth/complete`,
          requiredAccess: "shop",
          preferFreshSession: true,
          init: {
            method: "POST",
            json: {
              code,
              state,
              redirect_uri: redirectUri,
            },
          },
        }
      )

    if (response.data.status === "connected") {
      const redirectResponse = buildInboxRedirect(request.url, {
        notice: "Messenger page connected.",
      })
      redirectResponse.cookies.delete(SHOP_MESSENGER_OAUTH_SELECTION_COOKIE)
      return redirectResponse
    }

    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard/inbox/connect-meta/select", request.url)
    )

    redirectResponse.cookies.set({
      name: SHOP_MESSENGER_OAUTH_SELECTION_COOKIE,
      value: encodeShopMessengerOauthSelection({
        shop_id: shopId,
        selection_token: response.data.selection_token,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    })

    return redirectResponse
  } catch (error) {
    return buildInboxRedirect(request.url, {
      error: formatMessengerOauthErrorMessage(
        error,
        "Unable to finish Messenger connect right now."
      ),
    })
  }
}
