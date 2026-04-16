import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { getPlatformSettings } from "@/lib/platform/api"
import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import { PlanEditor } from "../../_components/plan-editor"

export default async function EditPlatformPlanPage({
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

  const featurePresets = response.data.feature_presets
  const limitPresets = response.data.limit_presets

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        title={`Edit ${plan.name}`}
        description="Adjust pricing, visibility, runtime feature items, and numeric limits."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/platform/plans/${plan.code}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Details
            </Link>
          </Button>
        }
      />

      <PlanEditor
        mode="edit"
        plan={plan}
        featurePresets={featurePresets}
        limitPresets={limitPresets}
      />
    </div>
  )
}
