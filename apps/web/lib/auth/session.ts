import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const AUTH_COOKIE_NAME = "fom_web_session"

export type AppRole = "platform_admin" | "shop_admin"
export type SubscriptionStatus = "trial" | "active" | "inactive"

export type AppSession = {
  role: AppRole
  email: string
  displayName: string
  shopName?: string
  subscriptionStatus?: SubscriptionStatus
}

function getPlatformAdminEmail() {
  return (
    process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ??
    "admin@fom-platform.local"
  )
}

function deriveDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? "owner"

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function deriveShopName(email: string) {
  const localPart = email.split("@")[0] ?? "shop"
  return `${deriveDisplayName(localPart)} Shop`
}

function encodeSession(session: AppSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url")
}

function decodeSession(value?: string) {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as AppSession

    if (!parsed?.email || !parsed?.role) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function getPlatformAdminHint() {
  return getPlatformAdminEmail()
}

export function defaultPathForSession(session: AppSession) {
  return session.role === "platform_admin" ? "/platform" : "/app"
}

export function createSessionFromEmail(input: {
  email: string
  displayName?: string
  shopName?: string
  mode: "sign-in" | "register"
}): AppSession {
  const email = input.email.trim().toLowerCase()
  const isPlatformAdmin = email === getPlatformAdminEmail()

  if (isPlatformAdmin) {
    return {
      role: "platform_admin",
      email,
      displayName: input.displayName?.trim() || "Platform Admin",
    }
  }

  return {
    role: "shop_admin",
    email,
    displayName: input.displayName?.trim() || deriveDisplayName(email),
    shopName: input.shopName?.trim() || deriveShopName(email),
    subscriptionStatus: input.mode === "register" ? "trial" : "active",
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  return decodeSession(cookieStore.get(AUTH_COOKIE_NAME)?.value)
}

export async function persistSession(session: AppSession) {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function redirectIfAuthenticated() {
  const session = await getSession()

  if (session) {
    redirect(defaultPathForSession(session))
  }
}

export async function requirePlatformAdmin() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  if (session.role !== "platform_admin") {
    redirect("/app")
  }

  return session
}

export async function requireShopAdmin() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  if (session.role !== "shop_admin") {
    redirect("/platform")
  }

  if (session.subscriptionStatus === "inactive") {
    redirect("/sign-in?reason=subscription")
  }

  return session
}
