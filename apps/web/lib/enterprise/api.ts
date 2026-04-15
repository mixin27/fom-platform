import "server-only"

import { type ApiSuccess } from "@/lib/auth/api"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"

type SearchParamsValue = string | string[] | undefined
type SearchParamsRecord = Record<string, SearchParamsValue>

export type EnterpriseWorkspace = {
  entitlements: {
    multi_shop_enabled: boolean
    eligible_shop_count: number
    locked_shop_count: number
    analytics_enabled: boolean
    priority_support_enabled: boolean
  }
  filters: {
    shop_id: string | null
    status: "all" | "active" | "trial" | "expiring" | "overdue" | "inactive" | string
  }
  shop_options: Array<{
    id: string
    name: string
    owner_name: string
    owner_email: string | null
    status: string
    subscription_status: string
    plan_name: string | null
    member_count: number
    active_member_count: number
    customer_count: number
    total_orders: number
    delivered_orders: number
    average_order_value: number
    total_revenue: number
    enterprise_enabled: boolean
    analytics_enabled: boolean
    priority_support_enabled: boolean
    last_active_at: string | null
  }>
  overview: {
    accessible_shops: number
    selected_shops: number
    total_orders: number
    delivered_orders: number
    total_revenue: number
    average_order_value: number
    customer_count: number
  }
  status_breakdown: Array<{
    status: string
    count: number
  }>
  top_shops: Array<{
    id: string
    name: string
    timezone: string
    owner_name: string
    owner_email: string | null
    plan_code: string | null
    plan_name: string | null
    status: string
    subscription_status: string
    member_count: number
    active_member_count: number
    customer_count: number
    total_orders: number
    delivered_orders: number
    total_revenue: number
    average_order_value: number
    last_active_at: string | null
    enterprise_enabled: boolean
    analytics_enabled: boolean
    priority_support_enabled: boolean
  }>
  recent_orders: Array<{
    id: string
    order_no: string
    shop_id: string
    shop_name: string
    status: string
    total_price: number
    customer_name: string
    updated_at: string
    created_at: string
  }>
}

function buildQueryString(searchParams?: SearchParamsRecord) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          query.append(key, item)
        }
      }
      continue
    }

    if (value) {
      query.set(key, value)
    }
  }

  const serialized = query.toString()
  return serialized.length > 0 ? `?${serialized}` : ""
}

export async function getEnterpriseWorkspace(
  searchParams?: SearchParamsRecord,
  retryPath = "/dashboard/workspace"
): Promise<ApiSuccess<EnterpriseWorkspace>> {
  return requestAuthenticatedApiEnvelope<EnterpriseWorkspace>({
    path: `/api/v1/enterprise/workspace${buildQueryString(searchParams)}`,
    retryPath,
    requiredAccess: "shop",
  })
}
