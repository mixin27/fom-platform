"use client"

import type { ApiErrorContext, ApiErrorDetail } from "@/lib/auth/api"

type ClientApiEnvelope<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: {
        code: string
        message: string
        details?: ApiErrorDetail[]
        context?: ApiErrorContext
      }
    }

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
    readonly context?: ApiErrorContext
  ) {
    super(message)
    this.name = "ClientApiError"
  }
}

export async function clientApiRequest<T>(
  path: string,
  init?: RequestInit & {
    json?: unknown
  }
) {
  const headers = new Headers(init?.headers)

  if (init?.json !== undefined) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(path, {
    ...init,
    headers,
    body:
      init?.json !== undefined
        ? JSON.stringify(init.json)
        : (init?.body ?? null),
    cache: "no-store",
  })

  if (response.status === 204) {
    return null as T
  }

  let payload: ClientApiEnvelope<T> | null = null

  try {
    payload = (await response.json()) as ClientApiEnvelope<T>
  } catch {
    throw new ClientApiError(
      "The server returned an invalid response.",
      "INVALID_RESPONSE",
      response.status
    )
  }

  if (!response.ok || !payload.success) {
    const error =
      payload && !payload.success
        ? payload.error
        : {
            code: "SERVER_ERROR",
            message: response.statusText || "Unexpected error",
          }

    throw new ClientApiError(
      error.message,
      error.code,
      response.status,
      error.details,
      error.context
    )
  }

  return payload.data
}
