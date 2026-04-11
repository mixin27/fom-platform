import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

type BrandMarkProps = {
  href?: string
  tone?: "light" | "dark"
  compact?: boolean
}

export function BrandMark({
  href = "/",
  tone = "dark",
  compact = false,
}: BrandMarkProps) {
  const content = (
    <span className="inline-flex items-center gap-3">
      <span
        className={cn(
          "relative flex size-10 items-center justify-center overflow-hidden rounded-2xl",
          tone === "dark" ? "bg-white/12" : "bg-[rgba(19,26,34,0.06)]"
        )}
      >
        <span className="absolute inset-x-1.5 inset-y-1.5 rounded-[1.1rem] bg-[var(--fom-orange)]/80" />
        <span className="absolute right-1.5 bottom-1.5 size-4 rounded-full bg-[var(--fom-teal)]" />
        <span className="relative z-10 text-sm font-semibold tracking-[0.24em] text-white">
          F
        </span>
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "fom-display text-sm font-semibold tracking-[0.28em] uppercase",
            tone === "dark" ? "text-foreground" : "text-white"
          )}
        >
          FOM Order Manager
        </span>
        {!compact ? (
          <span
            className={cn(
              "text-xs",
              tone === "dark" ? "text-muted-foreground" : "text-white/68"
            )}
          >
            For Facebook-first shops
          </span>
        ) : null}
      </span>
    </span>
  )

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  )
}
