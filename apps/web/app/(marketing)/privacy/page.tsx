import Link from "next/link"

import {
  LegalDocument,
  LegalDocumentFooter,
  LegalSection,
} from "@/components/legal-document"
import { getPublicLaunchConfig } from "@/lib/launch/api"

const sections = [
  {
    title: "1. Information We Collect",
    body: (
      <div className="space-y-4">
        <p>
          To provide the FOM Platform services, we collect information that you
          expressly provide, as well as data generated during your use of the
          system.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Account Information:
            </span>{" "}
            When you register, we collect your name, email address, phone
            number, and password hashes. This data is used to verify your
            identity and manage your access to the platform.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Shop Operational Data:
            </span>{" "}
            As a SaaS provider, we store the data you input into your shop
            workspace, including customer lists (names, delivery addresses,
            phones), order records (order numbers, product details, prices),
            delivery statuses, and custom message templates.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Usage and Technical Data:
            </span>{" "}
            We automatically collect technical information such as your IP
            address, browser type, device details, and timestamps of your
            actions for security monitoring and troubleshooting purposes.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "2. How We Use Data",
    body: (
      <div className="space-y-4">
        <p>Your data is processed for the following purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Service Delivery:
            </span>{" "}
            Processing Messenger orders, managing customer history, and
            generating operational reports.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Platform Security:
            </span>{" "}
            Applying rate limiting, detecting fraudulent activity, and
            protecting against unauthorized access.
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Communication:
            </span>{" "}
            Sending critical service alerts, billing notifications, and
            responses to your support requests.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "3. Data Sharing and Disclosure",
    body: (
      <div className="space-y-4">
        <p>
          We do not sell your shop data or customer information to third
          parties. We only share data with service providers who assist in our
          operations:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Infrastructure:
            </span>{" "}
            Cloud hosting and database providers (e.g., AWS, DigitalOcean).
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">
              Communications:
            </span>{" "}
            Email delivery services for transactional messages (e.g.,
            SendGrid).
          </li>
          <li>
            <span className="font-semibold text-[var(--fom-ink)]">Legal:</span>{" "}
            We may disclose data if required by law or to protect the safety and
            rights of our users and the platform.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "4. Retention and Security",
    body: (
      <div className="space-y-4">
        <p>
          We retain account and shop records as long as your subscription is
          active. Upon account deletion, identifiers are removed or anonymized
          within 30 days, except where retention is required for financial
          audits or legal compliance.
        </p>
        <p>
          We apply industry-standard technical controls, including encryption of
          data in transit and at rest, and JWT-based session management to
          protect your information.
        </p>
      </div>
    ),
  },
  {
    title: "5. Your Rights and Choices",
    body: (
      <div className="space-y-4">
        <p>
          Shop owners have the right to access, export, or correct their shop
          data at any time through the dashboard. You may request account
          deletion or decertification of specific records by contacting our
          support team. Note that certain billing-related data may be retained
          as required by law.
        </p>
      </div>
    ),
  },
]

export default async function PrivacyPage() {
  const launchConfig = await getPublicLaunchConfig()

  return (
    <LegalDocument
      title="Privacy Policy"
      description="This policy describes how FOM handles account, billing, and shop operation data."
    >
      {sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.body}
        </LegalSection>
      ))}

      <LegalDocumentFooter title="Contact">
        Questions about privacy, account access, or data handling can be sent to{" "}
        <Link href={launchConfig.support.url}>{launchConfig.support.label}</Link>
        .
      </LegalDocumentFooter>
    </LegalDocument>
  )
}
