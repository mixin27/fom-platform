import type { ReactNode } from "react"
import Link from "next/link"
import { LayoutDashboard, LogIn } from "lucide-react"
import { AnnouncementBannerStack } from "@/components/announcement-banner-stack"
import { BrandMark } from "@/components/brand-mark"
import { getPublicAnnouncements } from "@/lib/announcements/api"
import { defaultPathForSession, getSession } from "@/lib/auth/session"
import { getPublicLaunchConfig } from "@/lib/launch/api"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@/components/theme-toggle"

const marketingLinks = [
  { href: "#problem", label: "Why FOM" },
  { href: "#how", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
]

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  const [session, launchConfig] = await Promise.all([
    getSession(),
    getPublicLaunchConfig(),
  ])
  const announcements = await getPublicAnnouncements("public")
  const dashboardHref = session ? defaultPathForSession(session) : null

  return (
    <div className="fom-marketing-canvas min-h-screen">
      <AnnouncementBannerStack announcements={announcements} />
      <header className="sticky top-0 z-20 border-b border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-bg)]/80 backdrop-blur">
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
            <ThemeToggle />
            {dashboardHref ? (
              <Button
                asChild
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href={dashboardHref}>
                  <LayoutDashboard data-icon="inline-start" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-[var(--fom-slate)] hover:bg-[var(--fom-marketing-border)] hover:text-[var(--fom-ink)]"
                >
                  <Link href="/sign-in">
                    <LogIn data-icon="inline-start" />
                    Sign in
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                >
                  <Link href="/register">Create shop account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-[#121212] text-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <BrandMark compact tone="light" />
          <div className="flex flex-wrap gap-5 text-xs text-white/38">
            {dashboardHref ? (
              <Link href={dashboardHref}>Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in">Sign in</Link>
                <Link href="/register">Register</Link>
              </>
            )}
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
            <Link href={launchConfig.legal.terms_url}>Terms</Link>
            <Link href={launchConfig.legal.privacy_url}>Privacy</Link>
            <Link
              href={launchConfig.legal.account_deletion_url ?? "/account-deletion"}
            >
              Delete account
            </Link>
            <Link href={launchConfig.support.url}>
              {launchConfig.support.label}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
