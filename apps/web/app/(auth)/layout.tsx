import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--fom-portal-bg)] transition-colors duration-300">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <BrandMark href="/" />
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
