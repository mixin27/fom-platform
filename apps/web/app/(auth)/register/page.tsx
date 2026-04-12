import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { redirect } from "next/navigation"

import { registerAction } from "@/app/actions"
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

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string
  }>
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const session = await getSession()

  if (session) {
    redirect(defaultPathForSession(session))
  }

  const params = await searchParams
  const hasError = params?.error === "invalid_registration"
  const emailInUse = params?.error === "email_in_use"
  const shopSetupFailed =
    params?.error === "shop_setup_failed" ||
    params?.error === "shop_name_unavailable"
  const trialUnavailable = params?.error === "trial_unavailable"
  const registrationFailed = params?.error === "registration_failed"

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border border-black/6 bg-white">
        <CardHeader>
          <CardDescription>Get started</CardDescription>
          <CardTitle>Create your shop account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {hasError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Fill in all fields with a valid email and a password of at least 8 characters.
            </div>
          ) : null}
          {emailInUse ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              That email is already registered. Sign in instead or use another email.
            </div>
          ) : null}
          {shopSetupFailed ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Your account was created, but the initial shop setup did not complete. Try signing in and create the shop again later.
            </div>
          ) : null}
          {trialUnavailable ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Self-serve registration is available, but the free trial plan is currently disabled. Ask the platform owner to enable the trial plan.
            </div>
          ) : null}
          {registrationFailed ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Registration could not be completed right now. Check the API connection and try again.
            </div>
          ) : null}
          <form action={registerAction} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Your name</FieldLabel>
                <Input id="fullName" name="fullName" placeholder="Daw Aye Aye" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="shopName">Shop name</FieldLabel>
                <Input id="shopName" name="shopName" placeholder="Aye Fashion House" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="owner@shop.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" required />
                <FieldDescription>
                  Registration creates your account, provisions the first shop, starts that shop on a free trial, then signs you into the dashboard.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
              Create account
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-black/6 bg-[linear-gradient(180deg,#fff8f2_0%,#fff_100%)]">
        <CardHeader>
          <CardDescription>For shop owners</CardDescription>
          <CardTitle className="text-4xl leading-tight">
            Start with the shop portal, then grow into the full workflow.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[
            "Manual order entry for fast Facebook selling",
            "Customer, delivery, and message template workflows",
            "Daily, weekly, and monthly reporting surfaces",
            "Free trial starts automatically with the first self-serve shop",
            "RBAC-ready staff expansion once the shop grows",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-black/6 bg-white p-4 text-sm leading-7 text-muted-foreground">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
