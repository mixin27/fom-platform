"use server"

import { redirect } from "next/navigation"

import {
  AuthApiError,
  confirmEmailVerification,
  createShop,
  loginWithPassword,
  logoutAuthSession,
  requestPasswordReset,
  refreshAuthSession,
  registerWithPassword,
  resetPasswordWithToken,
  sendEmailVerification,
} from "@/lib/auth/api"
import {
  buildSessionFromAuth,
  clearSession,
  defaultPathForSession,
  getSession,
  hasPlatformAccess,
  hasShopAccess,
  persistSession,
} from "@/lib/auth/session"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function getFieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function ensureEmail(value: string) {
  return value.includes("@") && value.includes(".")
}

function withStatusQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
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
    const session = buildSessionFromAuth(auth)

    await persistSession(session)
    redirect(defaultPathForSession(session))
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      redirect("/sign-in?error=invalid_credentials")
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
    const session = buildSessionFromAuth(refreshedAuth)

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

export async function createInitialShopAction(formData: FormData) {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  if (hasPlatformAccess(session) || hasShopAccess(session)) {
    redirect(defaultPathForSession(session))
  }

  const shopName = getFieldValue(formData, "shopName")
  const timezone = getFieldValue(formData, "timezone") || "Asia/Yangon"

  if (!shopName) {
    redirect("/setup/shop?error=invalid_setup")
  }

  try {
    await createShop({
      accessToken: session.accessToken,
      name: shopName,
      timezone,
    })

    const refreshedAuth = await refreshAuthSession(session.refreshToken)
    const refreshedSession = buildSessionFromAuth(
      refreshedAuth,
      session.activeShopId
    )

    await persistSession(refreshedSession)
    redirect(defaultPathForSession(refreshedSession))
  } catch (error) {
    if (error instanceof AuthApiError && error.code === "CONFLICT") {
      redirect("/setup/shop?error=shop_name_unavailable")
    }

    redirect("/setup/shop?error=shop_setup_failed")
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = getFieldValue(formData, "email").toLowerCase()

  if (!ensureEmail(email)) {
    redirect("/forgot-password?error=invalid_email")
  }

  try {
    await requestPasswordReset(email)
    redirect("/forgot-password?notice=check_email")
  } catch {
    redirect("/forgot-password?error=request_failed")
  }
}

export async function resetPasswordAction(formData: FormData) {
  const token = getFieldValue(formData, "token")
  const password = getFieldValue(formData, "password")
  const confirmPassword = getFieldValue(formData, "confirmPassword")

  if (!token || password.length < 8 || password !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid_reset`)
  }

  try {
    await resetPasswordWithToken({
      token,
      password,
    })

    await clearSession()
    redirect("/sign-in?notice=password_reset")
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      redirect(`/reset-password?token=${encodeURIComponent(token)}&error=expired`)
    }

    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=reset_failed`)
  }
}

export async function confirmEmailVerificationAction(formData: FormData) {
  const token = getFieldValue(formData, "token")

  if (!token) {
    redirect("/verify-email?error=missing_token")
  }

  let nextPath = "/verify-email?status=verified"

  try {
    await confirmEmailVerification(token)

    const session = await getSession()
    if (session) {
      try {
        const refreshedAuth = await refreshAuthSession(session.refreshToken)
        const refreshedSession = buildSessionFromAuth(
          refreshedAuth,
          session.activeShopId
        )
        await persistSession(refreshedSession)
      } catch {
        // Keep the local session if refresh is unavailable. The next refresh will reconcile it.
      }
    }
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      nextPath = "/verify-email?error=expired"
    } else {
      nextPath = "/verify-email?error=verification_failed"
    }
  }

  redirect(nextPath)
}

export async function sendEmailVerificationAction(formData: FormData) {
  const returnTo = getFieldValue(formData, "returnTo") || "/verify-email"
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  let nextPath = `${returnTo}?status=sent`

  try {
    const result = await sendEmailVerification(session.accessToken)

    if (result.already_verified) {
      const refreshedAuth = await refreshAuthSession(session.refreshToken)
      const refreshedSession = buildSessionFromAuth(
        refreshedAuth,
        session.activeShopId
      )
      await persistSession(refreshedSession)

      nextPath = `${returnTo}?status=already_verified`
    }
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      await clearSession()
      redirect("/sign-in?error=session_expired")
    }

    nextPath = `${returnTo}?error=send_failed`
  }

  redirect(nextPath)
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = getFieldValue(formData, "notificationId")
  const returnTo = getFieldValue(formData, "returnTo") || "/dashboard/notifications"
  const requiredAccess =
    getFieldValue(formData, "requiredAccess") === "platform" ? "platform" : "shop"

  if (!notificationId) {
    redirect(withStatusQuery(returnTo, "error", "invalid_notification"))
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      init: {
        method: "PATCH",
      },
      requiredAccess,
    })
    redirect(withStatusQuery(returnTo, "notice", "notification_read"))
  } catch {
    redirect(withStatusQuery(returnTo, "error", "notification_action_failed"))
  }
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const returnTo = getFieldValue(formData, "returnTo") || "/dashboard/notifications"
  const requiredAccess =
    getFieldValue(formData, "requiredAccess") === "platform" ? "platform" : "shop"
  const shopId = getFieldValue(formData, "shopId") || undefined

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/notifications/read-all",
      init: {
        method: "POST",
        json: {
          ...(shopId ? { shop_id: shopId } : {}),
        },
      },
      requiredAccess,
    })
    redirect(withStatusQuery(returnTo, "notice", "notifications_read"))
  } catch {
    redirect(withStatusQuery(returnTo, "error", "notification_action_failed"))
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const returnTo = getFieldValue(formData, "returnTo") || "/dashboard/notifications"
  const requiredAccess =
    getFieldValue(formData, "requiredAccess") === "platform" ? "platform" : "shop"
  const categories = getFieldValue(formData, "categories")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (categories.length === 0) {
    redirect(withStatusQuery(returnTo, "error", "invalid_preferences"))
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/notification-preferences",
      init: {
        method: "PATCH",
        json: {
          preferences: categories.map((category) => ({
            category,
            in_app_enabled: formData.get(`inApp:${category}`) === "on",
            email_enabled: formData.get(`email:${category}`) === "on",
          })),
        },
      },
      requiredAccess,
    })
    redirect(withStatusQuery(returnTo, "notice", "preferences_saved"))
  } catch {
    redirect(withStatusQuery(returnTo, "error", "notification_action_failed"))
  }
}
