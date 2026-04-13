import { type NextRequest } from "next/server"

import { requestAuthenticatedDownload } from "@/lib/auth/download"

const datasetToPath = {
  shops: "/api/v1/platform/exports/shops.csv",
  users: "/api/v1/platform/exports/users.csv",
  subscriptions: "/api/v1/platform/exports/subscriptions.csv",
  invoices: "/api/v1/platform/exports/invoices.csv",
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

  return requestAuthenticatedDownload(target, "platform")
}
