import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"
import { LaunchNoticeBanner } from "@/components/launch-notice-banner"
import { getPublicLaunchConfig } from "@/lib/launch/api"

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  const launchConfig = await getPublicLaunchConfig()
  const showNotice =
    launchConfig.notice.enabled &&
    ["all", "public"].includes(launchConfig.notice.audience)

  return (
    <div className="min-h-screen bg-[var(--fom-portal-bg)] transition-colors duration-300">
      {showNotice ? <LaunchNoticeBanner notice={launchConfig.notice} /> : null}
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <BrandMark href="/" />
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
