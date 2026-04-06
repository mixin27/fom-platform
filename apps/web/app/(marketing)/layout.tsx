import type { ReactNode } from "react"
import Link from "next/link"
import { LogIn } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@workspace/ui/components/button"

const marketingLinks = [
  { href: "#product", label: "Product" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
]

export default function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="fom-marketing-canvas min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--fom-marketing-border)] bg-[rgba(250,250,248,0.92)] backdrop-blur">
        <div className="mx-auto flex h-[66px] w-full max-w-[1120px] items-center gap-10 px-6">
          <BrandMark />
          <nav className="hidden items-center gap-7 md:flex">
            {marketingLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[var(--fom-slate)] transition-colors hover:text-[var(--fom-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className="text-[var(--fom-slate)] hover:bg-[var(--fom-marketing-border)]"
            >
              <Link href="/sign-in">
                <LogIn data-icon="inline-start" />
                Sign in
              </Link>
            </Button>
            <Button asChild className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
              <Link href="/register">Start free trial</Link>
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-[#121212] text-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <BrandMark compact tone="light" />
          <div className="flex flex-wrap gap-5 text-xs text-white/38">
            <Link href="/sign-in">Sign in</Link>
            <Link href="/register">Register</Link>
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
