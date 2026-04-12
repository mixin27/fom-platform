import Image from "next/image"
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
      <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-2xl">
        <Image
          src="/brand/png/logo-mark.png"
          alt="FOM logo mark"
          width={40}
          height={40}
          className="size-10 rounded-2xl"
        />
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
