"use server"

import { redirect } from "next/navigation"

import {
  AuthApiError,
  createShop,
  loginWithPassword,
  logoutAuthSession,
  refreshAuthSession,
  registerWithPassword,
} from "@/lib/auth/api"
import {
  buildSessionFromAuth,
  clearSession,
  defaultPathForSession,
  getSession,
  hasPlatformAccess,
  hasShopAccess,
  persistSession,
  type AppSession,
} from "@/lib/auth/session"

function getFieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function ensureEmail(value: string) {
  return value.includes("@") && value.includes(".")
}

function requireAccessibleSession(session: AppSession) {
  if (hasPlatformAccess(session) || hasShopAccess(session)) {
    return session
  }

  throw new AuthApiError(
    "This account does not have portal access yet.",
    "NO_ACCESS",
    403
  )
}

export async function signInAction(formData: FormData) {
  const email = getFieldValue(formData, "email").toLowerCase()
  const password = getFieldValue(formData, "password")

  if (!ensureEmail(email) || password.length < 8) {
    redirect("/sign-in?error=invalid_credentials")
  }

  try {
    const auth = await loginWithPassword({
      email,
      password,
    })
    const session = requireAccessibleSession(buildSessionFromAuth(auth))

    await persistSession(session)
    redirect(defaultPathForSession(session))
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      redirect("/sign-in?error=invalid_credentials")
    }

    if (error instanceof AuthApiError && error.code === "NO_ACCESS") {
      redirect("/sign-in?error=no_access")
    }

    redirect("/sign-in?error=auth_failed")
  }
}

export async function registerAction(formData: FormData) {
  const fullName = getFieldValue(formData, "fullName")
  const shopName = getFieldValue(formData, "shopName")
  const email = getFieldValue(formData, "email").toLowerCase()
  const password = getFieldValue(formData, "password")

  if (!fullName || !shopName || !ensureEmail(email) || password.length < 8) {
    redirect("/register?error=invalid_registration")
  }

  try {
    const auth = await registerWithPassword({
      name: fullName,
      email,
      password,
      locale: "my",
    })

    try {
      await createShop({
        accessToken: auth.access_token,
        name: shopName,
        timezone: "Asia/Yangon",
      })
    } catch (error) {
      try {
        await logoutAuthSession(auth.access_token)
      } catch {
        // Best-effort session cleanup after partial signup.
      }

      if (error instanceof AuthApiError && error.code === "CONFLICT") {
        redirect("/register?error=shop_name_unavailable")
      }

      redirect("/register?error=shop_setup_failed")
    }

    const refreshedAuth = await refreshAuthSession(auth.refresh_token)
    const session = requireAccessibleSession(buildSessionFromAuth(refreshedAuth))

    await persistSession(session)
    redirect(defaultPathForSession(session))
  } catch (error) {
    if (error instanceof AuthApiError && error.code === "CONFLICT") {
      redirect("/register?error=email_in_use")
    }

    redirect("/register?error=registration_failed")
  }
}

export async function signOutAction() {
  try {
    const { getSession } = await import("@/lib/auth/session")
    const session = await getSession()

    if (session?.accessToken) {
      await logoutAuthSession(session.accessToken)
    }
  } catch {
    // Clear the local session even if the backend revoke call fails.
  }

  await clearSession()
  redirect("/")
}

export async function switchActiveShopAction(shopId: string) {
  const normalizedShopId = shopId.trim()
  const session = await getSession()

  if (!session) {
    return {
      ok: false as const,
      message: "Session expired. Please sign in again.",
    }
  }

  if (!normalizedShopId) {
    return {
      ok: false as const,
      message: "Select a shop to continue.",
    }
  }

  const shopExists = session.shops.some((shop) => shop.id === normalizedShopId)
  if (!shopExists) {
    return {
      ok: false as const,
      message: "That shop is not available in the current account.",
    }
  }

  if (session.activeShopId === normalizedShopId) {
    return {
      ok: true as const,
    }
  }

  await persistSession({
    ...session,
    activeShopId: normalizedShopId,
  })

  return {
    ok: true as const,
  }
}
