import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CircleSlash2Icon,
  PencilLineIcon,
} from "lucide-react"

import { getPlatformSettings } from "@/lib/platform/api"
import { formatCurrency } from "@/lib/platform/format"
import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function PlatformPlanDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const response = await getPlatformSettings()
  const plan = response.data.plans.find((p) => p.code === code)

  if (!plan) {
    notFound()
  }

  const availableItems = plan.items.filter(
    (i) => i.availability_status === "available"
  )
  const unavailableItems = plan.items.filter(
    (i) => i.availability_status === "unavailable"
  )

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Plan Details"
        title={plan.name}
        description={plan.description ?? "No description provided."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/plans">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to Catalog
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/platform/plans/${plan.code}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit Plan
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Status & Identity</CardDescription>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <span className="mr-2 text-xs text-muted-foreground">Code:</span>
              <span className="font-mono text-sm">{plan.code}</span>
            </div>
            <div>
              <span className="mr-2 text-xs text-muted-foreground">
                Status:
              </span>
              <Badge variant={plan.is_active ? "secondary" : "outline"}>
                {plan.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <span className="mr-2 text-xs text-muted-foreground">
                Sort order:
              </span>
              <span className="text-sm">{plan.sort_order}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Pricing</CardDescription>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <span className="mr-2 text-xs text-muted-foreground">Price:</span>
              <span className="text-sm font-medium">
                {formatCurrency(plan.price, plan.currency)}
                <span className="ml-1 text-muted-foreground">
                  / {plan.billing_period}
                </span>
              </span>
            </div>
            <div>
              <span className="mr-2 text-xs text-muted-foreground">
                Currency:
              </span>
              <span className="text-sm uppercase">{plan.currency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none lg:col-start-3">
          <CardHeader className="pb-3">
            <CardDescription>Performance</CardDescription>
            <CardTitle>Usage Data</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <span className="mr-2 text-xs text-muted-foreground">
                Subscribed Shops:
              </span>
              <span className="text-sm font-medium">{plan.shop_count}</span>
            </div>
            <div>
              <span className="mr-2 text-xs text-muted-foreground">
                Revenue:
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(plan.collected_revenue, plan.currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="border-b border-[var(--fom-border-subtle)] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Capabilities</CardDescription>
                <CardTitle>Features</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-50/50 text-emerald-600"
                >
                  <BadgeCheckIcon className="mr-1 size-3" />
                  {availableItems.length}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  <CircleSlash2Icon className="mr-1 size-3" />
                  {unavailableItems.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {plan.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No features defined for this plan.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {plan.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    {item.availability_status === "available" ? (
                      <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleSlash2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="border-b border-[var(--fom-border-subtle)] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Restrictions</CardDescription>
                <CardTitle>Limits</CardTitle>
              </div>
              <Badge variant="outline">{plan.limits.length} limits</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {plan.limits.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No limits defined for this plan.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/5 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-2 font-medium">Metric</th>
                      <th className="px-4 py-2 text-right font-medium">
                        Quota
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.limits.map((limit) => (
                      <tr
                        key={limit.id}
                        className="border-b border-[var(--fom-border-subtle)] last:border-0 hover:bg-muted/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {limit.label}
                            </span>
                            {limit.description ? (
                              <span className="mt-0.5 text-xs text-muted-foreground">
                                {limit.description}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">
                            {limit.value === null ? "Unlimited" : limit.value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
