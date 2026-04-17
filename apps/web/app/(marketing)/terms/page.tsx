import Link from "next/link"

import { getPublicLaunchConfig } from "@/lib/launch/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const sections = [
  {
    title: "Account and access",
    body: "You are responsible for the account, devices, and staff access connected to your shop. Keep passwords and session access private, and use the service only for your own lawful business operations.",
  },
  {
    title: "Subscriptions and payment",
    body: "Each shop subscription belongs to one shop workspace. Trial access, billing periods, overdue handling, and feature availability follow the plan attached to that shop. Paid access may be suspended if invoices remain unpaid after the due date.",
  },
  {
    title: "Acceptable use",
    body: "Do not use the platform to store unlawful content, impersonate customers or staff, attack the service, or interfere with other tenants. We may suspend accounts that create operational or security risk.",
  },
  {
    title: "Availability and changes",
    body: "We may update features, plans, limits, and operational policies as the product evolves. We will use in-product notices, email, or the website to communicate material changes when appropriate.",
  },
  {
    title: "Termination",
    body: "You may stop using the service at any time. We may suspend or terminate access for non-payment, abuse, fraud, or material violations of these terms.",
  },
]

export default async function TermsPage() {
  const launchConfig = await getPublicLaunchConfig()

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--fom-orange)] uppercase">
          Legal
        </p>
        <h1 className="fom-display text-4xl text-[var(--fom-ink)]">
          Terms & Conditions
        </h1>
        <p className="max-w-[720px] text-base leading-8 text-[var(--fom-slate)]">
          These terms govern access to the FOM platform for shop owners and
          staff. Consent version:{" "}
          <span className="font-semibold">
            {launchConfig.legal.consent_version}
          </span>
          .
        </p>
      </div>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-marketing-surface)]">
        <CardHeader>
          <CardTitle>Service summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-[var(--fom-slate)]">
          <p>
            FOM provides hosted order operations software for Facebook-first
            shops, including order tracking, customer history, reporting, and
            related workflow tools.
          </p>
          <p>
            By registering, signing in, or using the service, you agree to these
            terms and to the{" "}
            <Link
              href={launchConfig.legal.privacy_url}
              className="font-semibold text-[var(--fom-orange)] underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="border border-[var(--fom-border-subtle)] bg-[var(--fom-marketing-surface)]"
          >
            <CardHeader>
              <CardTitle className="text-xl">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[var(--fom-slate)]">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-marketing-surface)]">
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-[var(--fom-slate)]">
          For billing, legal, or account questions, use{" "}
          <Link
            href={launchConfig.support.url}
            className="font-semibold text-[var(--fom-orange)] underline underline-offset-4"
          >
            {launchConfig.support.label}
          </Link>
          .
        </CardContent>
      </Card>
    </div>
  )
}
