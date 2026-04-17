import "server-only"

import { cache } from "react"

import { requestApi } from "@/lib/auth/api"
import type { PortalAnnouncement } from "@/lib/announcements/types"

export const getPublicAnnouncements = cache(
  async (audience: "public" | "auth") => {
    try {
      const response = await requestApi<{ announcements: PortalAnnouncement[] }>(
        `/api/v1/public/announcements?audience=${audience}`
      )

      return response.announcements
    } catch {
      return []
    }
  }
)
