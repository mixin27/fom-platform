import Link from "next/link"
import { ArrowRight, Clock3, Store } from "lucide-react"
import { redirect } from "next/navigation"

import { signInAction } from "@/app/actions"
import { defaultPathForSession, getSession } from "@/lib/auth/session"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
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
  const hasError = params?.error === "invalid_credentials"
  const noAccess = params?.error === "no_access"
  const authFailed = params?.error === "auth_failed"
  const sessionExpired = params?.error === "session_expired"
  const passwordReset = params?.notice === "password_reset"

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="border border-black/6 bg-[var(--fom-ink)] text-white">
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
          {hasError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              Email or password is incorrect.
            </div>
          ) : null}
          {noAccess ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This account exists, but it does not have platform or shop access yet.
            </div>
          ) : null}
          {authFailed ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              Sign-in could not be completed right now. Check the API connection and try again.
            </div>
          ) : null}
          {sessionExpired ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Your session expired. Sign in again to continue.
            </div>
          ) : null}
          {passwordReset ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Password updated. Sign in with the new password.
            </div>
          ) : null}
          <form action={signInAction} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="owner@shop.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required />
                <FieldDescription>
                  Your credentials are verified by the backend API and a signed web session cookie is created on success.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
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
