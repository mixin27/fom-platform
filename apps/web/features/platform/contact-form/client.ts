"use client"

import type { PlatformPublicContactSubmission } from "@/lib/platform/api"

import { clientApiRequest } from "@/features/shared/client/api-client"

export type PlatformContactSubmissionUpdateInput = {
  archived: boolean
  adminNote: string
}

export function getPlatformContactSubmissionQueryKey(submissionId: string) {
  return ["platform", "contact-form", submissionId] as const
}

export function fetchPlatformContactSubmission(submissionId: string) {
  return clientApiRequest<PlatformPublicContactSubmission>(
    `/api/platform/contact-form/${submissionId}`
  )
}

export function updatePlatformContactSubmission(
  submissionId: string,
  input: PlatformContactSubmissionUpdateInput
) {
  return clientApiRequest<PlatformPublicContactSubmission>(
    `/api/platform/contact-form/${submissionId}`,
    {
      method: "PATCH",
      json: input,
    }
  )
}
