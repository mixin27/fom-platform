import Link from "next/link"
import { Download, FileSpreadsheet } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const exportDatasets = [
  {
    dataset: "shops",
    title: "Shops CSV",
    description: "Tenant shops, ownership details, subscription state, and counts.",
  },
  {
    dataset: "users",
    title: "Users CSV",
    description: "User accounts, platform roles, and linked shop memberships.",
  },
  {
    dataset: "subscriptions",
    title: "Subscriptions CSV",
    description: "Plan, billing cadence, term dates, and renewal state.",
  },
  {
    dataset: "invoices",
    title: "Invoices CSV",
    description: "Invoice, payment, and provider reference history across shops.",
  },
] as const

export default function PlatformExportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Exports"
        title="Download platform CSV exports"
        description="Use these exports for finance review, tenant audits, or offline analysis."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {exportDatasets.map((item) => (
          <Card
            key={item.dataset}
            className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none"
          >
            <CardHeader className="pb-3">
              <CardDescription>CSV export</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-[var(--fom-orange)]" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Button
                asChild
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href={`/platform/exports/${item.dataset}`} prefetch={false}>
                  <Download data-icon="inline-start" />
                  Download CSV
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
