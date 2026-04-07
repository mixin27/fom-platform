import { NextResponse } from "next/server"

import {
  clearSession,
  getSession,
  refreshSessionForRequest,
} from "@/lib/auth/session"

function getSafeRedirectTarget(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/platform"
  }

  return value
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextPath = getSafeRedirectTarget(url.searchParams.get("next"))
  const session = await getSession()

  if (!session) {
    await clearSession()
    return NextResponse.redirect(
      new URL("/sign-in?error=session_expired", request.url)
    )
  }

  const refreshedSession = await refreshSessionForRequest(session)

  if (!refreshedSession) {
    await clearSession()
    return NextResponse.redirect(
      new URL("/sign-in?error=session_expired", request.url)
    )
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}
