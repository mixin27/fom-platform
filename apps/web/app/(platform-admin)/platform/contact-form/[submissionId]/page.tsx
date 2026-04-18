import { PlatformContactSubmissionScreen } from "@/features/platform/contact-form/components/platform-contact-submission-screen"
import { getPlatformPublicContactSubmission } from "@/lib/platform/api"
import { type PlatformSearchParams } from "@/lib/platform/query"

type PlatformContactSubmissionPageProps = {
  params: Promise<{
    submissionId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformContactSubmissionPage({
  params,
  searchParams: _searchParams,
}: PlatformContactSubmissionPageProps) {
  const { submissionId } = await params
  const returnTo = `/platform/contact-form/${submissionId}`
  const response = await getPlatformPublicContactSubmission(submissionId, returnTo)

  return (
    <PlatformContactSubmissionScreen
      submissionId={submissionId}
      initialData={response.data}
    />
  )
}
