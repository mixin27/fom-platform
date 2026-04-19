import { AuthApiError } from "@/lib/auth/api"
import { getActiveShop, getSession, hasShopAccess } from "@/lib/auth/session"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import type { ShopBilling } from "@/lib/shop/api"
import { routeData, routeError } from "@/features/shared/server/route-response"

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      planCode?: string
    }

    const planCode = body.planCode?.trim()

    if (!planCode) {
      throw new AuthApiError(
        "Plan code is required.",
        "VALIDATION_ERROR",
        400
      )
    }

    const response = await requestAuthenticatedActionApiEnvelope<
      ShopBilling["invoices"][number]
    >({
      path: `/api/v1/shops/${activeShop.id}/billing/subscriptions`,
      requiredAccess: "shop",
      preferFreshSession: true,
      init: {
        method: "POST",
        json: {
          plan_code: planCode,
        },
      },
    })

    return routeData(response.data, { status: 201 })
  } catch (error) {
    return routeError(error, "Unable to create this subscription invoice.")
  }
}
