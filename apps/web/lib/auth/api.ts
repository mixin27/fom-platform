import "server-only"

import { headers } from "next/headers"

export type ApiErrorDetail = {
  field: string
  errors: string[]
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[]
  ) {
    super(message)
    this.name = "AuthApiError"
  }
}

export type AuthPlatformAccess = {
  role: string | null
  roles: Array<{
    id: string
    code: string
    name: string
    description: string | null
  }>
  permissions: string[]
}

export type AuthShopAccess = {
  shop_id: string
  role: string | null
  roles: string[]
  permissions: string[]
}

export type AuthResponse = {
  token: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: string
  refresh_expires_at: string
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    locale: string
    platform: {
      role: string | null
      roles: string[]
      permissions: string[]
    } | null
    shops: AuthShopAccess[]
  }
  platform_access: AuthPlatformAccess | null
  shops: Array<{
    id: string
    owner_user_id: string
    name: string
    timezone: string
    member_count: number
    created_at: string
    membership: {
      id: string
      role: string | null
      roles: Array<{
        id: string
        code: string
        name: string
        description: string | null
      }>
      status: string
      permissions: string[]
    }
  }>
}

type ApiEnvelope<T> =
  | {
      success: true
      data: T
      meta?: Record<string, unknown>
    }
  | {
      success: false
      error: {
        code: string
        message: string
        details?: ApiErrorDetail[]
      }
      meta?: Record<string, unknown>
    }

function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    "http://localhost:4000"

  return baseUrl.replace(/\/+$/, "")
}

async function buildForwardHeaders(extraHeaders?: HeadersInit) {
  const incomingHeaders = await headers()
  const outgoingHeaders = new Headers(extraHeaders)

  const userAgent = incomingHeaders.get("user-agent")
  if (userAgent) {
    outgoingHeaders.set("user-agent", userAgent)
  }

  const forwardedFor =
    incomingHeaders.get("x-forwarded-for") ?? incomingHeaders.get("x-real-ip")
  if (forwardedFor) {
    outgoingHeaders.set("x-forwarded-for", forwardedFor)
  }

  const requestId = incomingHeaders.get("x-request-id")
  if (requestId) {
    outgoingHeaders.set("x-request-id", requestId)
  }

  return outgoingHeaders
}

async function requestApi<T>(
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
) {
  const requestHeaders = await buildForwardHeaders(init?.headers)

  if (init?.json !== undefined) {
    requestHeaders.set("content-type", "application/json")
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: requestHeaders,
    body:
      init?.json !== undefined ? JSON.stringify(init.json) : (init?.body ?? null),
    cache: "no-store",
  })

  if (response.status === 204) {
    return null as T
  }

  const payload = (await response.json()) as ApiEnvelope<T>

  if (!response.ok || !payload.success) {
    const error =
      "error" in payload
        ? payload.error
        : {
            code: "SERVER_ERROR",
            message: "Unexpected error",
          }

    throw new AuthApiError(
      error.message,
      error.code,
      response.status,
      error.details
    )
  }

  return payload.data
}

export async function loginWithPassword(input: {
  email: string
  password: string
}) {
  return requestApi<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    json: input,
  })
}

export async function registerWithPassword(input: {
  name: string
  email: string
  password: string
  phone?: string
  locale?: string
}) {
  return requestApi<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    json: input,
  })
}

export async function refreshAuthSession(refreshToken: string) {
  return requestApi<AuthResponse>("/api/v1/auth/refresh", {
    method: "POST",
    json: {
      refresh_token: refreshToken,
    },
  })
}

export async function logoutAuthSession(accessToken: string) {
  return requestApi<null>("/api/v1/auth/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function createShop(input: {
  accessToken: string
  name: string
  timezone?: string
}) {
  return requestApi<{
    id: string
    owner_user_id: string
    name: string
    timezone: string
    member_count: number
    created_at: string
  }>("/api/v1/shops", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
    },
    json: {
      name: input.name,
      timezone: input.timezone,
    },
  })
}
