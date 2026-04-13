import { NextResponse } from "next/server"

import { AuthApiError, getApiBaseUrl } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function toWebsocketUrl(path: string) {
  const normalizedBase = getApiBaseUrl().replace(/\/+$/, "")
  const httpUrl = `${normalizedBase}${path}`
  return httpUrl.replace(/^http/i, (value) => (value.toLowerCase() === "https" ? "wss" : "ws"))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const scope = url.searchParams.get("scope") === "platform" ? "platform" : "shop"
  const shopId = url.searchParams.get("shop_id")?.trim() ?? ""

  if (scope === "shop" && !shopId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "shop_id is required for shop realtime scope.",
        },
      },
      { status: 400 }
    )
  }

  try {
    const response = await requestAuthenticatedActionApiEnvelope<{
      ticket: string
      expires_at: string
      websocket_path: string
    }>({
      path:
        scope === "platform"
          ? "/api/v1/realtime/tickets?scope=platform"
          : `/api/v1/realtime/tickets?scope=shop&shop_id=${encodeURIComponent(shopId)}`,
      requiredAccess: scope,
      preferFreshSession: true,
    })

    return NextResponse.json({
      success: true,
      data: {
        ticket: response.data.ticket,
        expires_at: response.data.expires_at,
        websocket_url: toWebsocketUrl(response.data.websocket_path),
      },
    })
  } catch (error) {
    if (error instanceof AuthApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to issue a realtime ticket right now.",
        },
      },
      { status: 500 }
    )
  }
}
