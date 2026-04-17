import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { Buffer } from "node:buffer"
import { brotliCompressSync, brotliDecompressSync } from "node:zlib"
import { cache } from "react"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { refreshAuthSession, type AuthResponse } from "@/lib/auth/api"

export const AUTH_COOKIE_NAME = "fom_web_session"

export type AppRole = "platform_owner" | "shop_admin"

export type AppSession = {
  role: AppRole
  accessToken: string
  refreshToken: string
  accessExpiresAt: string
  refreshExpiresAt: string
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    locale: string
    emailVerifiedAt: string | null
  }
  platformAccess: {
    role: string | null
    roles: string[]
    permissions: string[]
  } | null
  shops: Array<{
    id: string
    name: string
    timezone: string
    membership: {
      role: string | null
      roles: string[]
      permissions: string[]
    }
  }>
  activeShopId: string | null
}

type SharedRefreshRecord = {
  session: AppSession
  expiresAt: number
}

function getPlatformOwnerEmailHint() {
  return (
    process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ??
    process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ??
    "owner@fom-platform.local"
  )
}

function getSessionSecret() {
  return (
    process.env.WEB_SESSION_SECRET ??
    process.env.FOM_WEB_SESSION_SECRET ??
    "dev_fom_web_session_secret_change_me"
  )
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

function encodeSession(session: AppSession) {
  const compressedPayload = brotliCompressSync(
    Buffer.from(JSON.stringify(session), "utf8"),
  )
  const payload = compressedPayload.toString("base64url")
  const signature = signValue(payload)
  return `${payload}.${signature}`
}

function decodeSession(value?: string) {
  if (!value) {
    return null
  }

  const separatorIndex = value.lastIndexOf(".")
  if (separatorIndex <= 0) {
    return null
  }

  const payload = value.slice(0, separatorIndex)
  const signature = value.slice(separatorIndex + 1)
  const expectedSignature = signValue(payload)

  try {
    if (
      signature.length === 0 ||
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8")
      )
    ) {
      return null
    }

    const encodedBytes = Buffer.from(payload, "base64url")
    const parsed = JSON.parse(
      decodeSerializedSessionPayload(encodedBytes)
    ) as AppSession

    if (
      !parsed?.user?.id ||
      !parsed.user.name ||
      !parsed.accessToken ||
      !parsed.refreshToken ||
      !parsed.role
    ) {
      return null
    }

    if (!parsed.accessExpiresAt || !parsed.refreshExpiresAt) {
      return null
    }

    if (Number.isNaN(Date.parse(parsed.refreshExpiresAt))) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function decodeSerializedSessionPayload(payload: Buffer) {
  try {
    return brotliDecompressSync(payload).toString("utf8")
  } catch {
    return payload.toString("utf8")
  }
}

function getCookieMaxAgeSeconds(session: AppSession) {
  const refreshExpiryMs = Date.parse(session.refreshExpiresAt)

  if (Number.isNaN(refreshExpiryMs)) {
    return 60 * 60 * 24
  }

  const maxAgeSeconds = Math.floor((refreshExpiryMs - Date.now()) / 1000)
  return Math.max(0, maxAgeSeconds)
}

export function getPlatformAdminHint() {
  return getPlatformOwnerEmailHint()
}

function resolveActiveShopId(
  shops: AppSession["shops"],
  preferredActiveShopId?: string | null
) {
  if (
    preferredActiveShopId &&
    shops.some((shop) => shop.id === preferredActiveShopId)
  ) {
    return preferredActiveShopId
  }

  return shops[0]?.id ?? null
}

export function buildSessionFromAuth(
  auth: AuthResponse,
  preferredActiveShopId?: string | null
): AppSession {
  const shops = auth.shops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    timezone: shop.timezone,
    membership: {
      role: shop.membership.role,
      roles: shop.membership.roles.map((role) => role.code),
      permissions: [...shop.membership.permissions],
    },
  }))

  const platformAccess = auth.platform_access
    ? {
        role: auth.platform_access.role,
        roles: auth.platform_access.roles.map((role) => role.code),
        permissions: [...auth.platform_access.permissions],
      }
    : null

  const hasPlatformAccess =
    platformAccess !== null && platformAccess.permissions.length > 0
  const activeShopId = resolveActiveShopId(shops, preferredActiveShopId)

  return {
    role: hasPlatformAccess ? "platform_owner" : "shop_admin",
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
    accessExpiresAt: auth.expires_at,
    refreshExpiresAt: auth.refresh_expires_at,
    user: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      phone: auth.user.phone,
      locale: auth.user.locale,
      emailVerifiedAt: auth.user.email_verified_at,
    },
    platformAccess,
    shops,
    activeShopId,
  }
}

export function defaultPathForSession(session: AppSession) {
  if (hasPlatformAccess(session)) {
    return "/platform"
  }

  if (hasShopAccess(session)) {
    return "/dashboard"
  }

  return "/setup/shop"
}

export function buildSessionRefreshPath(nextPath: string) {
  return `/auth/refresh-session?next=${encodeURIComponent(nextPath)}`
}

export function getActiveShop(session: AppSession) {
  if (!session.activeShopId) {
    return session.shops[0] ?? null
  }

  return session.shops.find((shop) => shop.id === session.activeShopId) ?? session.shops[0] ?? null
}

export function hasPlatformAccess(session: AppSession) {
  return (
    session.platformAccess !== null &&
    session.platformAccess.permissions.length > 0
  )
}

export function hasShopAccess(session: AppSession) {
  return session.shops.length > 0
}

const SESSION_REFRESH_GRACE_MS = 15_000
const inFlightRefreshes = new Map<string, Promise<AppSession | null>>()
const recentRefreshes = new Map<string, SharedRefreshRecord>()

const readSession = cache(async () => {
  const cookieStore = await cookies()
  const session = decodeSession(cookieStore.get(AUTH_COOKIE_NAME)?.value)

  if (!session) {
    return null
  }

  if (Date.parse(session.refreshExpiresAt) <= Date.now()) {
    return null
  }

  return session
})

export async function getSession() {
  return readSession()
}

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return session
}

function isCookieMutationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes(
      "Cookies can only be modified in a Server Action or Route Handler"
    )
  )
}

export async function persistSessionIfPossible(session: AppSession) {
  try {
    await persistSession(session)
    return true
  } catch (error) {
    if (isCookieMutationError(error)) {
      return false
    }

    throw error
  }
}

export async function clearSessionIfPossible() {
  try {
    await clearSession()
    return true
  } catch (error) {
    if (isCookieMutationError(error)) {
      return false
    }

    throw error
  }
}

function getRecentRefresh(refreshToken: string) {
  const record = recentRefreshes.get(refreshToken)

  if (!record) {
    return null
  }

  if (record.expiresAt <= Date.now()) {
    recentRefreshes.delete(refreshToken)
    return null
  }

  return record.session
}

function rememberRecentRefresh(previousRefreshToken: string, session: AppSession) {
  const expiresAt = Date.now() + SESSION_REFRESH_GRACE_MS
  const record = {
    session,
    expiresAt,
  }

  recentRefreshes.set(previousRefreshToken, record)
  recentRefreshes.set(session.refreshToken, record)
}

async function refreshSessionByToken(
  refreshToken: string,
  activeShopId: string | null
) {
  const recentSession = getRecentRefresh(refreshToken)
  if (recentSession) {
    return recentSession
  }

  const existingRefresh = inFlightRefreshes.get(refreshToken)
  if (existingRefresh) {
    return existingRefresh
  }

  const refreshPromise = (async () => {
    try {
      const refreshedAuth = await refreshAuthSession(refreshToken)
      const refreshedSession = buildSessionFromAuth(refreshedAuth, activeShopId)

      rememberRecentRefresh(refreshToken, refreshedSession)
      return refreshedSession
    } catch {
      return getRecentRefresh(refreshToken)
    } finally {
      inFlightRefreshes.delete(refreshToken)
    }
  })()

  inFlightRefreshes.set(refreshToken, refreshPromise)
  return refreshPromise
}

export async function refreshSessionForRequest(session: AppSession) {
  if (Date.parse(session.refreshExpiresAt) <= Date.now()) {
    return null
  }

  const refreshedSession = await refreshSessionByToken(
    session.refreshToken,
    session.activeShopId
  )

  if (!refreshedSession) {
    return null
  }

  await persistSessionIfPossible(refreshedSession)
  return refreshedSession
}

export async function persistSession(session: AppSession) {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getCookieMaxAgeSeconds(session),
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
  const session = await requireSession()

  if (!hasPlatformAccess(session)) {
    redirect(defaultPathForSession(session))
  }

  return session
}

export async function requireShopAdmin() {
  const session = await requireSession()

  if (!hasShopAccess(session)) {
    redirect(defaultPathForSession(session))
  }

  return session
}
