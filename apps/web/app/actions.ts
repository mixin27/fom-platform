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
import { ensureWebClientHeaders } from "@/lib/auth/device"
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

type SignInActionState = {
  errorMessage: string | null
  sessionConflict: {
    platform: string
    activeSessionCount: number
    activeSession: {
      deviceName: string
      lastSeenAt: string
      ipAddress: string | null
    } | null
  } | null
}

function parseSignInSessionConflict(error: AuthApiError): SignInActionState["sessionConflict"] {
  const rawConflict = error.context?.session_conflict
  if (!rawConflict || typeof rawConflict !== "object") {
    return null
  }

  const conflict = rawConflict as Record<string, unknown>
  const rawActiveSession =
    conflict.active_session && typeof conflict.active_session === "object"
      ? (conflict.active_session as Record<string, unknown>)
      : null

  const activeSessionCount =
    typeof conflict.active_session_count === "number"
      ? conflict.active_session_count
      : 1

  const lastSeenAt =
    typeof rawActiveSession?.last_seen_at === "string"
      ? rawActiveSession.last_seen_at
      : ""

  return {
    platform:
      typeof conflict.platform === "string" ? conflict.platform : "unknown",
    activeSessionCount,
    activeSession:
      rawActiveSession && lastSeenAt
        ? {
            deviceName:
              typeof rawActiveSession.device_name === "string" &&
              rawActiveSession.device_name.trim().length > 0
                ? rawActiveSession.device_name
                : "Another device",
            lastSeenAt,
            ipAddress:
              typeof rawActiveSession.ip_address === "string" &&
              rawActiveSession.ip_address.trim().length > 0
                ? rawActiveSession.ip_address
                : null,
          }
        : null,
  }
}

export async function submitSignInAction(
  _previousState: SignInActionState,
  formData: FormData
) {
  const email = getFieldValue(formData, "email").toLowerCase()
  const password = getFieldValue(formData, "password")
  const logoutOtherDevice = getFieldValue(formData, "logoutOtherDevice") === "true"

  if (!ensureEmail(email) || password.length < 8) {
    return {
      errorMessage: "Email or password is incorrect.",
      sessionConflict: null,
    } satisfies SignInActionState
  }

  try {
    const clientHeaders = await ensureWebClientHeaders()
    const auth = await loginWithPassword({
      email,
      password,
      logout_other_device: logoutOtherDevice,
      headers: clientHeaders,
    })
    const session = buildSessionFromAuth(auth)

    await persistSession(session)
    redirect(defaultPathForSession(session))
  } catch (error) {
    if (error instanceof AuthApiError) {
      if (error.code === "SESSION_ACTIVE_ON_ANOTHER_DEVICE") {
        return {
          errorMessage: error.message,
          sessionConflict: parseSignInSessionConflict(error),
        } satisfies SignInActionState
      }

      if (error.code === "UNAUTHORIZED" || error.status === 401) {
        return {
          errorMessage: "Email or password is incorrect.",
          sessionConflict: null,
        } satisfies SignInActionState
      }
    }

    return {
      errorMessage:
        "Sign-in could not be completed right now. Check the API connection and try again.",
      sessionConflict: null,
    } satisfies SignInActionState
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
    const clientHeaders = await ensureWebClientHeaders()
    const auth = await registerWithPassword({
      name: fullName,
      email,
      password,
      locale: "my",
      headers: clientHeaders,
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

      if (error instanceof AuthApiError) {
        if (error.message.toLowerCase().includes("free trial")) {
          redirect("/register?error=trial_unavailable")
        }

        if (error.code === "CONFLICT") {
          redirect("/register?error=shop_name_unavailable")
        }
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
    if (error instanceof AuthApiError) {
      if (error.message.toLowerCase().includes("free trial")) {
        redirect("/setup/shop?error=trial_unavailable")
      }

      if (error.code === "CONFLICT") {
        redirect("/setup/shop?error=shop_name_unavailable")
      }
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

  let nextPath = withStatusQuery(returnTo, "notice", "notification_read")

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      init: {
        method: "PATCH",
      },
      requiredAccess,
    })
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      await clearSession()
      redirect("/sign-in?error=session_expired")
    }

    nextPath = withStatusQuery(returnTo, "error", "notification_action_failed")
  }

  redirect(nextPath)
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const returnTo = getFieldValue(formData, "returnTo") || "/dashboard/notifications"
  const requiredAccess =
    getFieldValue(formData, "requiredAccess") === "platform" ? "platform" : "shop"
  const shopId = getFieldValue(formData, "shopId") || undefined

  let nextPath = withStatusQuery(returnTo, "notice", "notifications_read")

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
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      await clearSession()
      redirect("/sign-in?error=session_expired")
    }

    nextPath = withStatusQuery(returnTo, "error", "notification_action_failed")
  }

  redirect(nextPath)
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

  let nextPath = withStatusQuery(returnTo, "notice", "preferences_saved")

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
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.code === "UNAUTHORIZED" || error.status === 401)
    ) {
      await clearSession()
      redirect("/sign-in?error=session_expired")
    }

    nextPath = withStatusQuery(returnTo, "error", "notification_action_failed")
  }

  redirect(nextPath)
}
