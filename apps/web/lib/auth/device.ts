import "server-only"

import { cookies, headers } from "next/headers"

export const WEB_DEVICE_COOKIE_NAME = "fom_web_device_id"

export async function ensureWebClientHeaders() {
  const cookieStore = await cookies()
  let deviceId = cookieStore.get(WEB_DEVICE_COOKIE_NAME)?.value?.trim() ?? ""

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    cookieStore.set(WEB_DEVICE_COOKIE_NAME, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })
  }

  const requestHeaders = await headers()

  return {
    "x-client-platform": "web",
    "x-device-id": deviceId,
    "x-device-name": describeWebDevice(requestHeaders.get("user-agent")),
  } satisfies Record<string, string>
}

function describeWebDevice(userAgent: string | null) {
  const raw = userAgent?.trim() ?? ""
  if (!raw) {
    return "Web browser"
  }

  const browser = resolveBrowser(raw)
  const operatingSystem = resolveOperatingSystem(raw)

  if (browser && operatingSystem) {
    return `${browser} on ${operatingSystem}`
  }

  if (browser) {
    return browser
  }

  if (operatingSystem) {
    return `Browser on ${operatingSystem}`
  }

  return "Web browser"
}

function resolveBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) {
    return "Edge"
  }

  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return "Chrome"
  }

  if (/firefox\//i.test(userAgent)) {
    return "Firefox"
  }

  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari"
  }

  return null
}

function resolveOperatingSystem(userAgent: string) {
  if (/iphone|ipad|ios/i.test(userAgent)) {
    return "iOS"
  }

  if (/android/i.test(userAgent)) {
    return "Android"
  }

  if (/mac os x|macintosh/i.test(userAgent)) {
    return "macOS"
  }

  if (/windows/i.test(userAgent)) {
    return "Windows"
  }

  if (/linux/i.test(userAgent)) {
    return "Linux"
  }

  return null
}
