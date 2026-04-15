import Link from "next/link"
import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { getShopBilling, getShopPortalContext } from "@/lib/shop/api"
import { getSingleSearchParam, type ShopSearchParams } from "@/lib/shop/query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { importShopOrdersSpreadsheetAction } from "../actions"

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

type ShopExportsPageProps = {
  searchParams?: Promise<ShopSearchParams>
}

export default async function ShopExportsPage({
  searchParams,
}: ShopExportsPageProps) {
  const params = (await searchParams) ?? {}
  const notice = getSingleSearchParam(params.notice)
  const error = getSingleSearchParam(params.error)
  const [{ activeShop }, billingResponse] = await Promise.all([
    getShopPortalContext(),
    getShopBilling("/dashboard/exports"),
  ])
  const billing = billingResponse.data
  const permissions = new Set(activeShop.membership.permissions)
  const availableFeatures = new Set(
    billing.plan?.items
      .filter((item) => item.availability_status === "available")
      .map((item) => item.code) ?? []
  )
  const exportEnabled = availableFeatures.has("exports.csv")
  const memberExportEnabled = exportEnabled && availableFeatures.has("team.members")
  const importEnabled = availableFeatures.has("orders.import_spreadsheet")
  const canWriteOrders = permissions.has("orders.write")
  const importDisabledReason = !canWriteOrders
    ? "You need order write permission to import historical orders."
    : !importEnabled
      ? "Spreadsheet order import is available on paid plans."
      : null

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Exports"
        title="Download shop data as CSV"
        description="Exports are generated from the active shop context and follow the current subscription plan allowances."
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!exportEnabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          CSV export is not available on the current subscription plan. Upgrade to a paid plan to unlock operational exports.
        </div>
      ) : null}

      {importDisabledReason ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {importDisabledReason}
        </div>
      ) : null}

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Order migration</CardDescription>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-[var(--fom-orange)]" />
            Import historical orders
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <p className="text-sm leading-6 text-muted-foreground">
            Download the Excel template, fill one row per order item, then upload
            a <code>.xlsx</code> or <code>.csv</code> file to migrate older
            order history into the current shop.
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                asChild={!importDisabledReason}
                variant={importDisabledReason ? "outline" : "default"}
                className={
                  importDisabledReason
                    ? ""
                    : "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                }
                disabled={Boolean(importDisabledReason)}
              >
                {importDisabledReason ? (
                  <span>
                    <ShieldCheck data-icon="inline-start" />
                    Not available right now
                  </span>
                ) : (
                  <Link
                    href="/dashboard/exports/orders-import-template"
                    prefetch={false}
                  >
                    <Download data-icon="inline-start" />
                    Download Excel template
                  </Link>
                )}
              </Button>
            </div>

            <form
              action={importShopOrdersSpreadsheetAction}
              className="flex w-full max-w-xl flex-col gap-2"
            >
              <input type="hidden" name="return_to" value="/dashboard/exports" />
              <input type="hidden" name="shop_id" value={activeShop.id} />
              <Input
                name="spreadsheet"
                type="file"
                accept=".xlsx,.csv"
                className="h-auto cursor-pointer rounded-xl py-2"
                disabled={Boolean(importDisabledReason)}
              />
              <Button
                type="submit"
                className="w-full bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)] sm:w-auto"
                disabled={Boolean(importDisabledReason)}
              >
                Import spreadsheet
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

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
