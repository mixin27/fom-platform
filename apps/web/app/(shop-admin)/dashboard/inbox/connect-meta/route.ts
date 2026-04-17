import { NextResponse } from "next/server"

import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import { getActiveShop, getSession } from "@/lib/auth/session"

function redirectWithError(requestUrl: string, message: string) {
  const url = new URL("/dashboard/inbox", requestUrl)
  url.searchParams.set("error", message)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const session = await getSession()
  const shopId = session ? getActiveShop(session)?.id ?? null : null

  if (!shopId) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const redirectUri = new URL(
    "/dashboard/inbox/connect-meta/callback",
    request.url
  ).toString()

  try {
    const response = await requestAuthenticatedActionApiEnvelope<{
      authorization_url: string
    }>({
      path: `/api/v1/shops/${shopId}/messenger/oauth/start`,
      requiredAccess: "shop",
      preferFreshSession: true,
      init: {
        method: "POST",
        json: {
          redirect_uri: redirectUri,
        },
      },
    })

    return NextResponse.redirect(response.data.authorization_url)
  } catch {
    return redirectWithError(
      request.url,
      "Unable to start Messenger connect right now."
    )
  }
}
