import "server-only"

import { cache } from "react"

import { requestApi } from "@/lib/auth/api"

export type PublicLaunchConfig = {
  legal: {
    consent_version: string
    terms_url: string
    privacy_url: string
    account_deletion_url?: string
  }
  support: {
    label: string
    url: string
  }
  billing: {
    title: string
    body: string
    channels: string[]
    contact_label: string
    contact_url: string
  }
}

const fallbackLaunchConfig: PublicLaunchConfig = {
  legal: {
    consent_version: "2026-04-16",
    terms_url: "/terms",
    privacy_url: "/privacy",
    account_deletion_url: "/account-deletion",
  },
  support: {
    label: "Contact support",
    url: "/contact",
  },
  billing: {
    title: "How to pay and activate your shop",
    body: "After your trial, contact the platform team to receive your invoice and payment instructions. Access is activated once payment is confirmed.",
    channels: [],
    contact_label: "Contact support",
    contact_url: "/contact",
  },
}

export const getPublicLaunchConfig = cache(async () => {
  try {
    return await requestApi<PublicLaunchConfig>("/api/v1/public/launch-config")
  } catch {
    return fallbackLaunchConfig
  }
})
