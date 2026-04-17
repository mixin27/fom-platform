import Link from "next/link"

import type { PublicLaunchConfig } from "@/lib/launch/api"

function getNoticeClasses(severity: PublicLaunchConfig["notice"]["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-300 bg-red-50 text-red-900"
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-900"
    default:
      return "border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] text-[var(--fom-ink)]"
  }
}

export function LaunchNoticeBanner({
  notice,
  className = "",
}: {
  notice: PublicLaunchConfig["notice"]
  className?: string
}) {
  if (!notice.enabled) {
    return null
  }

  return (
    <div
      className={`border-b px-4 py-3 text-sm ${getNoticeClasses(notice.severity)} ${className}`.trim()}
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{notice.title}</p>
          <p className="mt-0.5 text-current/80">{notice.body}</p>
        </div>
        {notice.cta_label && notice.cta_url ? (
          <Link
            href={notice.cta_url}
            className="font-semibold underline underline-offset-4"
          >
            {notice.cta_label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
