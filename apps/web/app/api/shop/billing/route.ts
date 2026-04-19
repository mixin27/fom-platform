import { AuthApiError } from "@/lib/auth/api"
import { getActiveShop, getSession, hasShopAccess } from "@/lib/auth/session"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import type { ShopBilling } from "@/lib/shop/api"
import { routeData, routeError } from "@/features/shared/server/route-response"

export async function GET() {
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

    const [billingResponse, plansResponse] = await Promise.all([
      requestAuthenticatedActionApiEnvelope<ShopBilling>({
        path: `/api/v1/shops/${activeShop.id}/billing`,
        requiredAccess: "shop",
        preferFreshSession: true,
      }),
      requestAuthenticatedActionApiEnvelope<ShopBilling["plans"]>({
        path: `/api/v1/shops/${activeShop.id}/billing/plans`,
        requiredAccess: "shop",
        preferFreshSession: true,
      }),
    ])

    return routeData({
      billing: billingResponse.data,
      plans: plansResponse.data,
    })
  } catch (error) {
    return routeError(error, "Unable to load shop billing right now.")
  }
}
