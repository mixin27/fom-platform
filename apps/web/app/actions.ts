"use server"

import { redirect } from "next/navigation"

import {
  clearSession,
  createSessionFromEmail,
  defaultPathForSession,
  persistSession,
} from "@/lib/auth/session"

function getFieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function ensureEmail(value: string) {
  return value.includes("@") && value.includes(".")
}

export async function signInAction(formData: FormData) {
  const email = getFieldValue(formData, "email").toLowerCase()
  const password = getFieldValue(formData, "password")

  if (!ensureEmail(email) || password.length < 8) {
    redirect("/sign-in?error=invalid_credentials")
  }

  const session = createSessionFromEmail({
    email,
    mode: "sign-in",
  })

  await persistSession(session)
  redirect(defaultPathForSession(session))
}

export async function registerAction(formData: FormData) {
  const fullName = getFieldValue(formData, "fullName")
  const shopName = getFieldValue(formData, "shopName")
  const email = getFieldValue(formData, "email").toLowerCase()
  const password = getFieldValue(formData, "password")

  if (!fullName || !shopName || !ensureEmail(email) || password.length < 8) {
    redirect("/register?error=invalid_registration")
  }

  const session = createSessionFromEmail({
    email,
    displayName: fullName,
    shopName,
    mode: "register",
  })

  await persistSession(session)
  redirect(defaultPathForSession(session))
}

export async function signOutAction() {
  await clearSession()
  redirect("/")
}
