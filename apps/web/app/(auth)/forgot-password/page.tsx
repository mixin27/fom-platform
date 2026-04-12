import Link from "next/link"

import { requestPasswordResetAction } from "@/app/actions"
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

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string
    notice?: string
  }>
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams
  const invalidEmail = params?.error === "invalid_email"
  const requestFailed = params?.error === "request_failed"
  const notice = params?.notice === "check_email"

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border border-black/6 bg-white">
        <CardHeader>
          <CardDescription>Recovery</CardDescription>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {invalidEmail ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Enter a valid email address to continue.
            </div>
          ) : null}
          {requestFailed ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Password reset could not be requested right now. Try again shortly.
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              If the account exists, a reset email is on the way.
            </div>
          ) : null}
          <form action={requestPasswordResetAction} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="owner@shop.com"
                  required
                />
                <FieldDescription>
                  We will send a one-time reset link if the account exists.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              size="lg"
              className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
            >
              Send reset link
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/sign-in" className="font-medium text-foreground">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-black/6 bg-[linear-gradient(180deg,#fff8f2_0%,#fff_100%)]">
        <CardHeader>
          <CardDescription>Account access</CardDescription>
          <CardTitle className="text-4xl leading-tight">
            Reset access without opening support tickets.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            "One-time reset link with expiry and revocation.",
            "Password change invalidates existing sessions.",
            "Sign in again after the reset with the new password.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-black/6 bg-white p-4 text-sm leading-7 text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
