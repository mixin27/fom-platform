import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import {
  LegalDocument,
  LegalDocumentFooter,
  LegalSection,
} from "@/components/legal-document"
import { getPublicLaunchConfig } from "@/lib/launch/api"

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "Request deletion of your FOM Platform account, shop workspace, and associated personal data.",
}

export default async function AccountDeletionPage() {
  const launchConfig = await getPublicLaunchConfig()

  return (
    <LegalDocument
      eyebrow="Account"
      title="Delete your account"
      description={
        <>
          You can request deletion of your account and shop data at any time.
          We use this page to verify account deletion for app store policies
          (including Google Play).
        </>
      }
    >
      <LegalSection title="Before you request">
        <p>
          To process a deletion safely, contact us from the{" "}
          <strong>email address on your FOM account</strong> and include your{" "}
          <strong>shop name</strong> (and shop ID if you know it). If you use
          the mobile app, mention the phone number or email you sign in with.
        </p>
        <p>
          Deleting your account removes access to the FOM web and mobile apps
          for that shop workspace. If you only need to remove a staff member,
          ask your shop owner to update team access instead of deleting the whole
          shop account.
        </p>
      </LegalSection>

      <LegalSection title="What we delete">
        <p>
          After we confirm your identity, we delete or anonymize your account
          and shop operational data in line with our{" "}
          <Link href={launchConfig.legal.privacy_url}>Privacy Policy</Link>,
          including profile and shop workspace content you stored in FOM.
        </p>
      </LegalSection>

      <LegalSection title="What we may retain">
        <p>
          Some information may be kept for a limited period where the law
          requires it (for example billing and tax records). See the retention
          section of our{" "}
          <Link href={launchConfig.legal.privacy_url}>Privacy Policy</Link> for
          details.
        </p>
      </LegalSection>

      <LegalSection title="How to submit a request">
        <p>
          Send a request through{" "}
          <Link href={launchConfig.support.url}>{launchConfig.support.label}</Link>
          . You can use the subject line{" "}
          <strong>Account deletion request</strong> to help us triage your
          message quickly.
        </p>
        <div className="pt-2">
          <Button
            asChild
            className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
          >
            <Link className="legal-skip" href={launchConfig.support.url}>
              {launchConfig.support.label}
            </Link>
          </Button>
        </div>
      </LegalSection>

      <LegalDocumentFooter title="Policy">
        This process supplements our{" "}
        <Link href={launchConfig.legal.terms_url}>Terms &amp; Conditions</Link>{" "}
        and <Link href={launchConfig.legal.privacy_url}>Privacy Policy</Link>.
      </LegalDocumentFooter>
    </LegalDocument>
  )
}
