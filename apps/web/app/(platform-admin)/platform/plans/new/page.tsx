import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { getPlatformSettings } from "@/lib/platform/api"
import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import { PlanEditor } from "../_components/plan-editor"

export default async function CreatePlatformPlanPage() {
  const response = await getPlatformSettings()
  const featurePresets = response.data.feature_presets
  const limitPresets = response.data.limit_presets

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        title="Create Plan"
        description="Configure a new subscription plan with selected features and limits."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/platform/plans">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Catalog
            </Link>
          </Button>
        }
      />

      <PlanEditor
        mode="create"
        plan={null}
        featurePresets={featurePresets}
        limitPresets={limitPresets}
      />
    </div>
  )
}
