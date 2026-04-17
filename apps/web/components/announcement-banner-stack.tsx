import Link from "next/link"

import type { PortalAnnouncement } from "@/lib/announcements/types"

function getAnnouncementClasses(severity: PortalAnnouncement["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-300 bg-red-50 text-red-900"
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-900"
    case "success":
      return "border-emerald-300 bg-emerald-50 text-emerald-900"
    default:
      return "border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] text-[var(--fom-ink)]"
  }
}

export function AnnouncementBannerStack({
  announcements,
  className = "",
}: {
  announcements: PortalAnnouncement[]
  className?: string
}) {
  if (announcements.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {announcements.map((announcement, index) => (
        <div
          key={announcement.id}
          className={`border-b px-4 py-3 text-sm ${getAnnouncementClasses(announcement.severity)} ${
            index > 0 ? "border-t-0" : ""
          }`}
        >
          <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{announcement.title}</p>
              <p className="mt-0.5 text-current/80">{announcement.body}</p>
            </div>
            {announcement.cta_label && announcement.cta_url ? (
              <Link
                href={announcement.cta_url}
                className="font-semibold underline underline-offset-4"
              >
                {announcement.cta_label}
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
