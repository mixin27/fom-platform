import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import type { PlatformPublicContactSubmission } from "@/lib/platform/api"
import { routeData, routeError } from "@/features/shared/server/route-response"

type RouteContext = {
  params: Promise<{
    submissionId: string
  }>
}

type ContactSubmissionUpdateBody = {
  archived?: boolean
  adminNote?: string
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { submissionId } = await context.params
    const response =
      await requestAuthenticatedActionApiEnvelope<PlatformPublicContactSubmission>(
        {
          path: `/api/v1/platform/public-contact-submissions/${submissionId}`,
          requiredAccess: "platform",
          preferFreshSession: true,
        }
      )

    return routeData(response.data)
  } catch (error) {
    return routeError(error, "Unable to load this contact submission right now.")
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { submissionId } = await context.params
    const body = (await request.json()) as ContactSubmissionUpdateBody
    const response =
      await requestAuthenticatedActionApiEnvelope<PlatformPublicContactSubmission>(
        {
          path: `/api/v1/platform/public-contact-submissions/${submissionId}`,
          requiredAccess: "platform",
          preferFreshSession: true,
          init: {
            method: "PATCH",
            json: {
              archived: body.archived ?? false,
              admin_note: body.adminNote ?? "",
            },
          },
        }
      )

    return routeData(response.data)
  } catch (error) {
    return routeError(error, "Unable to update this contact submission right now.")
  }
}
