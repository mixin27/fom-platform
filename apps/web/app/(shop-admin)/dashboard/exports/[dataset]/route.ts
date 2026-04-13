import { type NextRequest } from "next/server"

import { requestAuthenticatedDownload } from "@/lib/auth/download"
import { getActiveShop, getSession } from "@/lib/auth/session"

const datasetToPath = {
  orders: "/api/v1/shops/:shopId/exports/orders.csv",
  customers: "/api/v1/shops/:shopId/exports/customers.csv",
  deliveries: "/api/v1/shops/:shopId/exports/deliveries.csv",
  members: "/api/v1/shops/:shopId/exports/members.csv",
} as const

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      dataset: string
    }>
  }
) {
  const { dataset } = await context.params
  const target = datasetToPath[dataset as keyof typeof datasetToPath]

  if (!target) {
    return new Response("Not found", { status: 404 })
  }

  const session = await getSession()
  const shopId = session ? getActiveShop(session)?.id ?? null : null

  if (!shopId) {
    return new Response("Shop context is missing.", { status: 400 })
  }

  return requestAuthenticatedDownload(target.replace(":shopId", shopId), "shop")
}
