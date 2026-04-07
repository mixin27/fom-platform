import "server-only"

import { redirect } from "next/navigation"

import {
  AuthApiError,
  requestAuthorizedApiEnvelope,
  type ApiSuccess,
} from "@/lib/auth/api"
import {
  buildSessionRefreshPath,
  clearSessionIfPossible,
  defaultPathForSession,
  getSession,
  hasPlatformAccess,
  hasShopAccess,
  refreshSessionForRequest,
  type AppSession,
} from "@/lib/auth/session"

type RequiredAccess = "platform" | "shop" | "any"

type AuthenticatedRequestOptions = {
  path: string
  retryPath?: string
  init?: RequestInit & {
    json?: unknown
  }
  requiredAccess?: RequiredAccess
}

function redirectForMissingAccess(session: AppSession, requiredAccess: RequiredAccess) {
  if (requiredAccess === "platform") {
    redirect(hasShopAccess(session) ? "/dashboard" : "/sign-in?error=no_access")
  }

  if (requiredAccess === "shop") {
    redirect(hasPlatformAccess(session) ? "/platform" : "/sign-in?error=no_access")
  }
}

function assertSessionAccess(session: AppSession, requiredAccess: RequiredAccess) {
  if (requiredAccess === "platform" && !hasPlatformAccess(session)) {
    redirectForMissingAccess(session, requiredAccess)
  }

  if (requiredAccess === "shop" && !hasShopAccess(session)) {
    redirectForMissingAccess(session, requiredAccess)
  }
}

export async function requestAuthenticatedApiEnvelope<T>({
  path,
  retryPath,
  init,
  requiredAccess = "any",
}: AuthenticatedRequestOptions): Promise<ApiSuccess<T>> {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  assertSessionAccess(session, requiredAccess)

  const expiresInMs = Date.parse(session.accessExpiresAt) - Date.now()
  if (retryPath && expiresInMs <= 30_000) {
    redirect(buildSessionRefreshPath(retryPath))
  }

  try {
    return await requestAuthorizedApiEnvelope<T>(session.accessToken, path, init)
  } catch (error) {
    if (
      !(error instanceof AuthApiError) ||
      (error.status !== 401 && error.status !== 403)
    ) {
      throw error
    }

    if (retryPath) {
      redirect(buildSessionRefreshPath(retryPath))
    }

    const refreshedSession = await refreshSessionForRequest(session)

    if (!refreshedSession) {
      await clearSessionIfPossible()
      redirect("/sign-in?error=session_expired")
    }

    assertSessionAccess(refreshedSession, requiredAccess)

    try {
      return await requestAuthorizedApiEnvelope<T>(
        refreshedSession.accessToken,
        path,
        init
      )
    } catch (retryError) {
      if (retryError instanceof AuthApiError && retryError.status === 401) {
        await clearSessionIfPossible()
        redirect("/sign-in?error=session_expired")
      }

      if (retryError instanceof AuthApiError && retryError.status === 403) {
        if (requiredAccess !== "any") {
          redirectForMissingAccess(refreshedSession, requiredAccess)
        }

        redirect(defaultPathForSession(refreshedSession))
      }

      throw retryError
    }
  }
}
