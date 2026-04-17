import type { Metadata } from "next"
import Link from "next/link"

import { submitContactFormAction } from "@/app/(marketing)/contact/actions"
import { LegalDocument } from "@/components/legal-document"
import { getPublicLaunchConfig } from "@/lib/launch/api"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a message to the FOM platform team.",
}

type ContactPageProps = {
  searchParams?: Promise<{
    notice?: string
    error?: string
  }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {}
  const launchConfig = await getPublicLaunchConfig()
  const sent = params.notice === "sent"
  const errorKey = params.error

  return (
    <LegalDocument
      eyebrow="Support"
      title="Contact us"
      description={
        <>
          Questions about billing, your shop, or the platform? Send a message
          below. We typically reply by email. You can also review our{" "}
          <Link href={launchConfig.legal.privacy_url}>Privacy Policy</Link>.
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thanks — your message was received. If you included an email address,
          we will follow up there.
        </div>
      ) : null}

      {errorKey === "required" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Please enter your email and a message (at least 10 characters).
        </div>
      ) : null}
      {errorKey === "rate_limit" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Too many requests. Please wait a bit and try again.
        </div>
      ) : null}
      {errorKey === "validation" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Please check your entries and try again.
        </div>
      ) : null}
      {errorKey === "send_failed" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          We could not send your message right now. Please try again later.
        </div>
      ) : null}

      <form
        action={submitContactFormAction}
        className="relative flex max-w-lg flex-col gap-5"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="contact-email">Email</FieldLabel>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10"
            />
            <FieldDescription>We use this to reply to you.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="contact-name">Name (optional)</FieldLabel>
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              placeholder="Your name"
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="contact-subject">Subject (optional)</FieldLabel>
            <Input
              id="contact-subject"
              name="subject"
              placeholder="What is this about?"
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="contact-message">Message</FieldLabel>
            <Textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              placeholder="How can we help?"
              className="min-h-[140px]"
            />
          </Field>
        </FieldGroup>

        <div
          className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
          aria-hidden="true"
        >
          <label htmlFor="contact-website">Company website</label>
          <Input
            id="contact-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Button
          type="submit"
          className="w-fit bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
        >
          Send message
        </Button>
      </form>
    </LegalDocument>
  )
}
