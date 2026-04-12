import Link from "next/link"

import {
  confirmEmailVerificationAction,
  sendEmailVerificationAction,
} from "@/app/actions"
import {
  defaultPathForSession,
  getSession,
  hasPlatformAccess,
  hasShopAccess,
} from "@/lib/auth/session"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string
    status?: string
    error?: string
  }>
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const session = await getSession()
  const params = await searchParams
  const token = params?.token?.trim() ?? ""
  const status = params?.status ?? ""
  const error = params?.error ?? ""
  const isVerified = Boolean(session?.user.emailVerifiedAt)
  const showVerifiedMessage = status === "verified"
  const showAlreadyVerifiedMessage =
    !showVerifiedMessage && (status === "already_verified" || isVerified)
  const showActionError =
    !showVerifiedMessage &&
    !showAlreadyVerifiedMessage &&
    (error === "verification_failed" || error === "send_failed")
  const defaultPath =
    session && (hasPlatformAccess(session) || hasShopAccess(session))
      ? defaultPathForSession(session)
      : "/sign-in"

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border border-black/6 bg-white">
        <CardHeader>
          <CardDescription>Email verification</CardDescription>
          <CardTitle>Verify your email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {showVerifiedMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Your email is verified. You can continue in the portal.
            </div>
          ) : null}
          {status === "sent" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              A new verification email has been sent.
            </div>
          ) : null}
          {showAlreadyVerifiedMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              This account email is already verified.
            </div>
          ) : null}
          {error === "missing_token" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Verification token is missing.
            </div>
          ) : null}
          {error === "expired" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This verification link is invalid or expired.
            </div>
          ) : null}
          {showActionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Email verification could not be completed right now.
            </div>
          ) : null}

          {showVerifiedMessage || showAlreadyVerifiedMessage ? (
            <Button
              asChild
              size="lg"
              className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
            >
              <Link href={defaultPath}>Continue</Link>
            </Button>
          ) : token ? (
            <form action={confirmEmailVerificationAction} className="flex flex-col gap-4">
              <input type="hidden" name="token" value={token} />
              <p className="text-sm leading-7 text-muted-foreground">
                Confirm this email address for your account.
              </p>
              <Button
                type="submit"
                size="lg"
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                Verify email
              </Button>
            </form>
          ) : session?.user.email ? (
            <form action={sendEmailVerificationAction} className="flex flex-col gap-4">
              <input type="hidden" name="returnTo" value="/verify-email" />
              <p className="text-sm leading-7 text-muted-foreground">
                Send a fresh verification email to{" "}
                <span className="font-medium text-foreground">
                  {session.user.email}
                </span>
                .
              </p>
              <Button
                type="submit"
                size="lg"
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                Send verification email
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-7 text-muted-foreground">
                Sign in to resend a verification email, or open the link from your email inbox.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href="/sign-in">Go to sign in</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-black/6 bg-[linear-gradient(180deg,#fff8f2_0%,#fff_100%)]">
        <CardHeader>
          <CardDescription>Account trust</CardDescription>
          <CardTitle className="text-4xl leading-tight">
            Verified email is used for recovery and billing notices.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            "Password recovery links are sent to the verified email address.",
            "Billing and subscription notices depend on a reachable inbox.",
            "You can resend the verification link from inside the portal.",
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
