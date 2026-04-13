import "server-only"

import { buildForwardHeaders, getApiBaseUrl } from "@/lib/auth/api"
import {
  clearSessionIfPossible,
  getSession,
  hasPlatformAccess,
  hasShopAccess,
  refreshSessionForRequest,
} from "@/lib/auth/session"

type RequiredAccess = "platform" | "shop" | "any"

function hasRequiredAccess(requiredAccess: RequiredAccess, session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) {
    return false
  }

  if (requiredAccess === "platform") {
    return hasPlatformAccess(session)
  }

  if (requiredAccess === "shop") {
    return hasShopAccess(session)
  }

  return true
}

async function requestDownloadWithToken(accessToken: string, path: string) {
  const headers = await buildForwardHeaders()
  headers.set("authorization", `Bearer ${accessToken}`)

  return fetch(`${getApiBaseUrl()}${path}`, {
    headers,
    cache: "no-store",
  })
}

async function toErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as {
        error?: {
          message?: string
        }
      }

      return new Response(
        payload.error?.message ?? "Unable to download this export right now.",
        {
          status: response.status,
        }
      )
    } catch {
      return new Response("Unable to download this export right now.", {
        status: response.status,
      })
    }
  }

  const text = (await response.text()).trim()
  return new Response(text || "Unable to download this export right now.", {
    status: response.status,
  })
}

export async function requestAuthenticatedDownload(path: string, requiredAccess: RequiredAccess) {
  const session = await getSession()

  if (!session || !hasRequiredAccess(requiredAccess, session)) {
    return new Response("Unauthorized", { status: 401 })
  }

  let activeSession = session
  if (Date.parse(activeSession.accessExpiresAt) - Date.now() <= 30_000) {
    const refreshedSession = await refreshSessionForRequest(activeSession)
    if (refreshedSession) {
      activeSession = refreshedSession
    }
  }

  let response = await requestDownloadWithToken(activeSession.accessToken, path)

  if (response.status === 401 || response.status === 403) {
    const refreshedSession = await refreshSessionForRequest(activeSession)
    if (!refreshedSession) {
      await clearSessionIfPossible()
      return new Response("Unauthorized", { status: 401 })
    }

    activeSession = refreshedSession
    response = await requestDownloadWithToken(activeSession.accessToken, path)
  }

  if (!response.ok) {
    return toErrorResponse(response)
  }

  const headers = new Headers()
  const contentType = response.headers.get("content-type")
  const disposition = response.headers.get("content-disposition")

  if (contentType) {
    headers.set("content-type", contentType)
  }
  if (disposition) {
    headers.set("content-disposition", disposition)
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
