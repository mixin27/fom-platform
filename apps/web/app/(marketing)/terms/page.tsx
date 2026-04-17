import Link from "next/link"

import {
  LegalDocument,
  LegalDocumentFooter,
  LegalSection,
} from "@/components/legal-document"
import { getPublicLaunchConfig } from "@/lib/launch/api"

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
    <LegalDocument
      title="Terms & Conditions"
      description={
        <>
          These terms govern access to the FOM platform for shop owners and
          staff. Consent version:{" "}
          <span className="font-semibold text-[var(--fom-ink)]">
            {launchConfig.legal.consent_version}
          </span>
          .
        </>
      }
    >
      <LegalSection title="Service summary">
        <div className="space-y-4">
          <p>
            FOM provides hosted order operations software for Facebook-first
            shops, including order tracking, customer history, reporting, and
            related workflow tools.
          </p>
          <p>
            By registering, signing in, or using the service, you agree to these
            terms and to the{" "}
            <Link href={launchConfig.legal.privacy_url}>Privacy Policy</Link>.
          </p>
        </div>
      </LegalSection>

      {sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.body}
        </LegalSection>
      ))}

      <LegalDocumentFooter title="Questions">
        For billing, legal, or account questions, use{" "}
        <Link href={launchConfig.support.url}>{launchConfig.support.label}</Link>
        .
      </LegalDocumentFooter>
    </LegalDocument>
  )
}
