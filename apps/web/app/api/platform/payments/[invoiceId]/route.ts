import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import type { PlatformPaymentDetail } from "@/lib/platform/api"
import { routeData, routeError } from "@/features/shared/server/route-response"

type RouteContext = {
  params: Promise<{
    invoiceId: string
  }>
}

type PaymentUpdateBody = {
  amount?: number
  currency?: string
  status?: string
  dueAt?: string | null
  paidAt?: string | null
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { invoiceId } = await context.params
    const response = await requestAuthenticatedActionApiEnvelope<PlatformPaymentDetail>(
      {
        path: `/api/v1/platform/invoices/${invoiceId}`,
        requiredAccess: "platform",
        preferFreshSession: true,
      }
    )

    return routeData(response.data)
  } catch (error) {
    return routeError(error, "Unable to load this payment right now.")
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { invoiceId } = await context.params
    const body = (await request.json()) as PaymentUpdateBody

    const response = await requestAuthenticatedActionApiEnvelope<PlatformPaymentDetail>(
      {
        path: `/api/v1/platform/invoices/${invoiceId}`,
        requiredAccess: "platform",
        preferFreshSession: true,
        init: {
          method: "PATCH",
          json: {
            amount: body.amount,
            currency: body.currency,
            status: body.status,
            due_at: body.dueAt
              ? new Date(`${body.dueAt}T00:00:00.000Z`).toISOString()
              : null,
            paid_at: body.paidAt
              ? new Date(`${body.paidAt}T00:00:00.000Z`).toISOString()
              : null,
          },
        },
      }
    )

    return routeData(response.data)
  } catch (error) {
    return routeError(error, "Unable to update this invoice right now.")
  }
}
