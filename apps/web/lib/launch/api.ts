import "server-only"

import { cache } from "react"

import { requestApi } from "@/lib/auth/api"

export type LaunchNoticeSeverity = "info" | "warning" | "critical" | string
export type LaunchNoticeAudience = "all" | "public" | "tenant" | string

export type PublicLaunchConfig = {
  legal: {
    consent_version: string
    terms_url: string
    privacy_url: string
    account_deletion_url?: string
  }
  notice: {
    enabled: boolean
    severity: LaunchNoticeSeverity
    audience: LaunchNoticeAudience
    title: string
    body: string
    cta_label: string | null
    cta_url: string | null
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
  notice: {
    enabled: false,
    severity: "info",
    audience: "all",
    title: "",
    body: "",
    cta_label: null,
    cta_url: null,
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
