import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { redirect } from "next/navigation"

import { registerAction } from "@/app/actions"
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
import { getSession } from "@/lib/auth/session"

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
    redirect(session.role === "platform_admin" ? "/platform" : "/app")
  }

  const params = await searchParams
  const hasError = params?.error === "invalid_registration"

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
                  Registration currently opens the shop portal in trial mode until billing and real backend auth are wired in.
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
