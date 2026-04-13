import Link from "next/link"
import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { getShopBilling } from "@/lib/shop/api"
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
    dataset: "orders",
    title: "Orders CSV",
    description: "Order rows, customer details, item summary, totals, and timestamps.",
  },
  {
    dataset: "customers",
    title: "Customers CSV",
    description: "Customer records with spend and latest-order context.",
  },
  {
    dataset: "deliveries",
    title: "Deliveries CSV",
    description: "Delivery assignments, driver details, and delivery timestamps.",
  },
  {
    dataset: "members",
    title: "Staffs CSV",
    description: "Member roster with account identifiers, role codes, and join time.",
  },
] as const

export default async function ShopExportsPage() {
  const billingResponse = await getShopBilling("/dashboard/exports")
  const billing = billingResponse.data
  const availableFeatures = new Set(
    billing.plan?.items
      .filter((item) => item.availability_status === "available")
      .map((item) => item.code) ?? []
  )
  const exportEnabled = availableFeatures.has("exports.csv")
  const memberExportEnabled = exportEnabled && availableFeatures.has("team.members")

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Exports"
        title="Download shop data as CSV"
        description="Exports are generated from the active shop context and follow the current subscription plan allowances."
      />

      {!exportEnabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          CSV export is not available on the current subscription plan. Upgrade to a paid plan to unlock operational exports.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {exportDatasets.map((item) => {
          const isDisabled = item.dataset === "members" ? !memberExportEnabled : !exportEnabled

          return (
            <Card
              key={item.dataset}
              className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none"
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
                  asChild={!isDisabled}
                  variant={isDisabled ? "outline" : "default"}
                  className={isDisabled ? "" : "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"}
                  disabled={isDisabled}
                >
                  {isDisabled ? (
                    <span>
                      <ShieldCheck data-icon="inline-start" />
                      Not available on this plan
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/exports/${item.dataset}`}
                      prefetch={false}
                    >
                      <Download data-icon="inline-start" />
                      Download CSV
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
