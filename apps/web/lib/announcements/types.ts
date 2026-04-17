export type PortalAnnouncementSeverity =
  | "info"
  | "success"
  | "warning"
  | "critical"
  | string

export type PortalAnnouncementState =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "archived"
  | string

export type PortalAnnouncementAudience =
  | "public"
  | "auth"
  | "tenant"
  | "platform"
  | string

export type PortalAnnouncement = {
  id: string
  source: "manual" | "system" | string
  title: string
  body: string
  severity: PortalAnnouncementSeverity
  status: string
  state: PortalAnnouncementState
  audiences: PortalAnnouncementAudience[]
  cta_label: string | null
  cta_url: string | null
  starts_at: string | null
  ends_at: string | null
  pinned: boolean
  sort_order: number
}
