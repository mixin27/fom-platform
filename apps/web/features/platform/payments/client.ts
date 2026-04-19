"use client"

import type { PlatformPaymentDetail } from "@/lib/platform/api"

import { clientApiRequest } from "@/features/shared/client/api-client"

export type PlatformPaymentUpdateInput = {
  amount: number
  currency: string
  status: string
  dueAt: string | null
  paidAt: string | null
}

export function getPlatformPaymentQueryKey(invoiceId: string) {
  return ["platform", "payments", invoiceId] as const
}

export function fetchPlatformPayment(invoiceId: string) {
  return clientApiRequest<PlatformPaymentDetail>(
    `/api/platform/payments/${invoiceId}`
  )
}

export function updatePlatformPayment(
  invoiceId: string,
  input: PlatformPaymentUpdateInput
) {
  return clientApiRequest<PlatformPaymentDetail>(
    `/api/platform/payments/${invoiceId}`,
    {
      method: "PATCH",
      json: input,
    }
  )
}
