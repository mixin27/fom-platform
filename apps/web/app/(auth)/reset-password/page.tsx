import Link from "next/link"

import { resetPasswordAction } from "@/app/actions"
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

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string
    error?: string
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params?.token?.trim() ?? ""
  const missingToken = token.length === 0
  const invalidReset = params?.error === "invalid_reset"
  const expired = params?.error === "expired"
  const resetFailed = params?.error === "reset_failed"

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr] transition-all duration-300">
      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)]">
        <CardHeader>
          <CardDescription>Recovery</CardDescription>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {missingToken ? (
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              This reset link is incomplete. Request a new one.
            </div>
          ) : null}
          {invalidReset ? (
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              Enter matching passwords with at least 8 characters.
            </div>
          ) : null}
          {expired ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              This reset link is invalid or expired. Request a new one.
            </div>
          ) : null}
          {resetFailed ? (
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              Password reset could not be completed right now.
            </div>
          ) : null}
          <form action={resetPasswordAction} className="flex flex-col gap-5">
            <input type="hidden" name="token" value={token} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="NewPassword123!"
                  required
                  disabled={missingToken}
                />
                <FieldDescription>
                  Use at least 8 characters with uppercase, lowercase, and a number.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat the new password"
                  required
                  disabled={missingToken}
                />
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              size="lg"
              disabled={missingToken}
              className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
            >
              Update password
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            Need another link?{" "}
            <Link href="/forgot-password" className="font-medium text-foreground">
              Request password reset
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-[var(--fom-marketing-featured-bg)] text-white">
        <CardHeader>
          <CardDescription className="text-white/60">
            Security
          </CardDescription>
          <CardTitle className="text-4xl leading-tight">
            The reset completes in one step.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            "The reset token is single-use and time-limited.",
            "Existing signed-in sessions are revoked after the change.",
            "Use the new password on your next sign-in.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/8 p-4 text-sm leading-7 text-white/72"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
