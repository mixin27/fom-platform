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
    title: "What we collect",
    body: "We collect account details such as name, email, phone, role assignments, shop membership, and the operational business data you store in the platform, such as customers, orders, deliveries, templates, and billing records.",
  },
  {
    title: "How we use data",
    body: "We use data to provide the service, secure accounts, process billing, deliver support, send operational notices, and improve reliability. We do not use your shop data to run another tenant’s business.",
  },
  {
    title: "Sharing",
    body: "We only share data with infrastructure, email, payment, analytics, or support providers that help us operate the platform, or when disclosure is legally required.",
  },
  {
    title: "Retention and security",
    body: "We retain account and shop records as needed to operate the service, maintain financial records, investigate abuse, and satisfy legal obligations. We apply technical and organizational controls to reduce unauthorized access risk.",
  },
  {
    title: "Your choices",
    body: "Shop owners can update account details, request support, and decide whether to continue or end the subscription. Privacy and billing notices may still be sent when needed for service operations.",
  },
]

export default async function PrivacyPage() {
  const launchConfig = await getPublicLaunchConfig()

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--fom-orange)] uppercase">
          Legal
        </p>
        <h1 className="fom-display text-4xl text-[var(--fom-ink)]">
          Privacy Policy
        </h1>
        <p className="max-w-[720px] text-base leading-8 text-[var(--fom-slate)]">
          This policy describes how FOM handles account, billing, and shop
          operation data.
        </p>
      </div>

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
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-[var(--fom-slate)]">
          Questions about privacy, account access, or data handling can be sent
          to{" "}
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
