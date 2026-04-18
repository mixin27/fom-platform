import { AuthApiError } from "@/lib/auth/api"
import { getActiveShop, getSession, hasShopAccess } from "@/lib/auth/session"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import type { ShopBillingInvoiceDetail } from "@/lib/shop/api"
import { routeData, routeError } from "@/features/shared/server/route-response"

type RouteContext = {
  params: Promise<{
    invoiceId: string
  }>
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      throw new AuthApiError(
        "Session expired. Please sign in again.",
        "UNAUTHORIZED",
        401
      )
    }

    if (!hasShopAccess(session)) {
      throw new AuthApiError(
        "You do not have permission to access shop billing.",
        "FORBIDDEN",
        403
      )
    }

    const activeShop = getActiveShop(session)

    if (!activeShop) {
      throw new AuthApiError(
        "Shop context is missing.",
        "SHOP_CONTEXT_MISSING",
        400
      )
    }

    if (!activeShop.membership.permissions.includes("shops.write")) {
      throw new AuthApiError(
        "Billing access is restricted to shop managers.",
        "FORBIDDEN",
        403
      )
    }

    const { invoiceId } = await context.params

    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${activeShop.id}/billing/invoices/${invoiceId}/mmqr-session`,
      requiredAccess: "shop",
      preferFreshSession: true,
      init: {
        method: "POST",
      },
    })

    const detailResponse = await requestAuthenticatedActionApiEnvelope<ShopBillingInvoiceDetail>(
      {
        path: `/api/v1/shops/${activeShop.id}/billing/invoices/${invoiceId}`,
        requiredAccess: "shop",
        preferFreshSession: true,
      }
    )

    return routeData(detailResponse.data)
  } catch (error) {
    return routeError(error, "Unable to create a payment session right now.")
  }
}
