import Link from "next/link"
import { Clock3, Store } from "lucide-react"
import { redirect } from "next/navigation"

import { defaultPathForSession, getSession } from "@/lib/auth/session"
import { SignInForm } from "./_components/sign-in-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string
    notice?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getSession()

  if (session) {
    redirect(defaultPathForSession(session))
  }

  const params = await searchParams
  const noAccess = params?.error === "no_access"
  const sessionExpired = params?.error === "session_expired"
  const passwordReset = params?.notice === "password_reset"
  const initialErrorMessage = sessionExpired
    ? "Your session expired. Sign in again to continue."
    : noAccess
    ? "This account exists, but it does not have platform or shop access yet."
    : null

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] transition-all duration-300">
      <Card className="border border-white/5 bg-[var(--fom-marketing-featured-bg)] text-white">
        <CardHeader>
          <CardDescription className="text-white/60">
            Shop access
          </CardDescription>
          <CardTitle className="text-4xl leading-tight">
            Sign in to your shop workspace.
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="rounded-2xl bg-white/8 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-2xl bg-[rgba(249,122,31,0.16)] text-[var(--fom-orange)]">
                <Store className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Orders and customers</p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  Signed-in shop owners go directly into the workspace for orders,
                  customers, deliveries, templates, and reporting.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/8 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-2xl bg-[rgba(24,183,165,0.16)] text-[var(--fom-teal)]">
                <Clock3 className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Fast daily workflow</p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  Built for quick order capture, status updates, customer follow-up,
                  and day-end visibility.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)]">
        <CardHeader>
          <CardDescription>Authentication</CardDescription>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {passwordReset ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-400">
              Password updated. Sign in with the new password.
            </div>
          ) : null}
          <SignInForm initialErrorMessage={initialErrorMessage} />
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-foreground">
              Forgot password?
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Need a shop account?{" "}
            <Link href="/register" className="font-medium text-foreground">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
