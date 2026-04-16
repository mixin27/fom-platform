import "server-only"

import { headers } from "next/headers"

export type ApiErrorDetail = {
  field: string
  errors: string[]
}

export type ApiErrorContext = Record<string, unknown>

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
    readonly context?: ApiErrorContext
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
    email_verified_at: string | null
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

export type ApiEnvelope<T> =
  | ApiSuccess<T>
  | {
      success: false
      error: {
        code: string
        message: string
        details?: ApiErrorDetail[]
        context?: ApiErrorContext
      }
      meta?: Record<string, unknown>
    }

export function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
    "http://localhost:4000"

  return baseUrl.replace(/\/+$/, "")
}

export async function buildForwardHeaders(extraHeaders?: HeadersInit) {
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

export async function requestApiEnvelope<T>(
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
): Promise<ApiSuccess<T>> {
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
    return {
      success: true,
      data: null as T,
    }
  }

  const contentType = response.headers.get("content-type") ?? ""
  const expectsJson = contentType.includes("application/json")
  let payload: ApiEnvelope<T> | null = null
  let responseText: string | null = null

  if (expectsJson) {
    try {
      payload = (await response.json()) as ApiEnvelope<T>
    } catch {
      throw new AuthApiError(
        "The API returned an invalid JSON response.",
        "INVALID_API_RESPONSE",
        response.status
      )
    }
  } else {
    responseText = (await response.text()).trim() || null
  }

  if (!payload) {
    throw new AuthApiError(
      responseText ?? response.statusText ?? "Unexpected API response.",
      response.ok ? "INVALID_API_RESPONSE" : "SERVER_ERROR",
      response.status
    )
  }

  if (!response.ok || !payload.success) {
    const error =
      "error" in payload
        ? payload.error
        : {
            code: "SERVER_ERROR",
            message: response.statusText || "Unexpected error",
          }

    throw new AuthApiError(
      error.message,
      error.code,
      response.status,
      error.details,
      error.context
    )
  }

  return payload
}

export async function requestApi<T>(
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
) {
  const payload = await requestApiEnvelope<T>(path, init)
  return payload.data
}

export async function requestAuthorizedApiEnvelope<T>(
  accessToken: string,
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
) {
  const headers = new Headers(init?.headers)
  headers.set("authorization", `Bearer ${accessToken}`)

  return requestApiEnvelope<T>(path, {
    ...init,
    headers,
  })
}

export async function requestAuthorizedApi<T>(
  accessToken: string,
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
) {
  const payload = await requestAuthorizedApiEnvelope<T>(accessToken, path, init)
  return payload.data
}

export async function loginWithPassword(input: {
  email: string
  password: string
  logout_other_device?: boolean
  headers?: HeadersInit
}) {
  const { headers, ...json } = input
  return requestApi<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    headers,
    json,
  })
}

export async function registerWithPassword(input: {
  name: string
  email: string
  password: string
  phone?: string
  locale?: string
  headers?: HeadersInit
}) {
  const { headers, ...json } = input
  return requestApi<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    headers,
    json,
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

export async function sendEmailVerification(accessToken: string) {
  return requestAuthorizedApi<{
    email: string
    email_verified_at: string | null
    sent: boolean
    already_verified: boolean
  }>(accessToken, "/api/v1/auth/email/verification/send", {
    method: "POST",
  })
}

export async function confirmEmailVerification(token: string) {
  return requestApi<{
    email: string
    email_verified_at: string
    verified: boolean
  }>("/api/v1/auth/email/verification/confirm", {
    method: "POST",
    json: {
      token,
    },
  })
}

export async function requestPasswordReset(email: string) {
  return requestApi<{
    accepted: boolean
    message: string
  }>("/api/v1/auth/password/forgot", {
    method: "POST",
    json: {
      email,
    },
  })
}

export async function resetPasswordWithToken(input: {
  token: string
  password: string
}) {
  return requestApi<{
    reset: boolean
    email: string
    reset_at: string
  }>("/api/v1/auth/password/reset", {
    method: "POST",
    json: input,
  })
}

export async function acceptInvitationWithToken(input: {
  token: string
  password: string
  headers?: HeadersInit
}) {
  const { headers, ...json } = input
  return requestApi<AuthResponse>("/api/v1/auth/invitations/accept", {
    method: "POST",
    headers,
    json,
  })
}
