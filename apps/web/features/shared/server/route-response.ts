import { NextResponse } from "next/server"

import { AuthApiError } from "@/lib/auth/api"

export function routeData<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status: init?.status ?? 200,
    }
  )
}

export function routeError(
  error: unknown,
  fallbackMessage = "Unexpected server error."
) {
  if (error instanceof AuthApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          context: error.context,
        },
      },
      {
        status: error.status,
      }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: fallbackMessage,
      },
    },
    {
      status: 500,
    }
  )
}
