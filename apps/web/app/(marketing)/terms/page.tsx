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
    title: "1. Eligibility and Accounts",
    body: (
      <div className="space-y-4">
        <p>
          To use the FOM Platform, you must be at least 18 years old and capable
          of entering into legally binding contracts. By creating an account,
          you represent that all information provided is accurate and complete.
        </p>
        <p>
          You are solely responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account, including actions taken by your invited staff members.
        </p>
      </div>
    ),
  },
  {
    title: "2. Subscription and Billing",
    body: (
      <div className="space-y-4">
        <p>
          FOM is a subscription-based SaaS platform. Most new shops are eligible
          for a 7-day free trial. Upon expiry of the trial, continued access
          requires an active paid subscription.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Billing Cycle:
            </span>{" "}
            Subscriptions are billed on a monthly or yearly basis in advance.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Non-Payment:
            </span>{" "}
            We reserve the right to suspend or terminate your access to the
            platform if invoices remain unpaid after the specified due date.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              No Refunds:
            </span>{" "}
            Unless required by law, all payments are non-refundable.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "3. Acceptable Use",
    body: (
      <div className="space-y-4">
        <p>
          You agree to use the FOM Platform only for lawful business operations.
          Prohibited activities include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Reverse engineering or attempting to extract the source code.</li>
          <li>
            Using the service to store or transmit infringing, libelous, or
            unlawful material.
          </li>
          <li>
            Interfering with the service integrity or performance for other
            tenants.
          </li>
          <li>Automating the service via unauthorized scripts or scrapers.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "4. Data Ownership and License",
    body: (
      <div className="space-y-4">
        <p>
          <span className="font-semibold text-[var(--fom-ink)]">Your Data:</span>{" "}
          You retain all ownership rights to the shop data, customer records,
          and content you upload to the platform. You grant us a limited license
          to host and process this data solely to provide the services to you.
        </p>
        <p>
          <span className="font-semibold text-[var(--fom-ink)]">
            Our Platform:
          </span>{" "}
          FOM and its licensors own all rights, titles, and interests in the
          platform, including software, design, and trademarks.
        </p>
      </div>
    ),
  },
  {
    title: "5. Limitation of Liability",
    body: (
      <div className="space-y-4">
        <p>
          The service is provided &quot;as-is&quot; without warranties of any
          kind. We are not liable for any business interruptions, loss of
          profits, or data inaccuracies resulting from your use of the platform
          or changes in third-party services like Messenger.
        </p>
      </div>
    ),
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
