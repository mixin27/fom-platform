import Link from "next/link"

import { acceptInvitationAction } from "@/app/actions"
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

type AcceptInvitePageProps = {
  searchParams?: Promise<{
    token?: string
    error?: string
  }>
}

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const params = await searchParams
  const token = params?.token?.trim() ?? ""
  const missingToken = token.length === 0
  const invalidInvite = params?.error === "invalid_invite"
  const expired = params?.error === "expired"
  const inviteFailed = params?.error === "invite_failed"

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr] transition-all duration-300">
      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)]">
        <CardHeader>
          <CardDescription>Staff invitation</CardDescription>
          <CardTitle>Set your password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {missingToken ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              This invitation link is incomplete. Ask the shop owner to resend it.
            </div>
          ) : null}
          {invalidInvite ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Enter matching passwords with at least 8 characters.
            </div>
          ) : null}
          {expired ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This invitation link is invalid or expired. Ask the shop owner to resend it.
            </div>
          ) : null}
          {inviteFailed ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Invitation acceptance could not be completed right now.
            </div>
          ) : null}
          <form action={acceptInvitationAction} className="flex flex-col gap-5">
            <input type="hidden" name="token" value={token} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
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
              Join workspace
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            Already have access?{" "}
            <Link href="/sign-in" className="font-medium text-foreground">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/5 bg-[var(--fom-marketing-featured-bg)] text-white">
        <CardHeader>
          <CardDescription className="text-white/60">
            Invitation
          </CardDescription>
          <CardTitle className="text-4xl leading-tight">
            Your shop access starts after this one step.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            "The invitation link is single-use and time-limited.",
            "Completing this step activates your invited shop access.",
            "After the password is set, you are signed directly into the workspace.",
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
