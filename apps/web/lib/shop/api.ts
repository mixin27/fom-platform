import "server-only"

import { redirect } from "next/navigation"

import { type ApiSuccess } from "@/lib/auth/api"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"
import { getActiveShop, requireShopAdmin } from "@/lib/auth/session"

type SearchParamsValue = string | string[] | undefined
type SearchParamsRecord = Record<string, SearchParamsValue>

export type ShopCursorPagination = {
  limit: number
  cursor: string | null
  next_cursor: string | null
  total: number
}

export type ShopPortalContext = Awaited<ReturnType<typeof getShopPortalContext>>

export type ShopRecord = {
  id: string
  owner_user_id: string
  name: string
  timezone: string
  member_count: number
  created_at: string
}

export type ShopMembershipSummary = {
  id: string
  role: string | null
  roles: Array<{
    id: string
    code: string
    name: string
    description: string | null
  }>
  status: string
  permissions: string[]
}

export type ShopMember = {
  id: string
  shop_id: string
  user_id: string
  role: string | null
  roles: Array<{
    id: string
    code: string
    name: string
    description: string | null
  }>
  status: string
  created_at: string
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    locale: string
  }
  permissions: string[]
}

export type ShopOrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  qty: number
  unit_price: number
  line_total: number
}

export type ShopOrder = {
  id: string
  shop_id: string
  customer_id: string
  order_no: string
  status: string
  total_price: number
  currency: string
  delivery_fee: number
  note: string | null
  source: string
  created_at: string
  updated_at: string
  customer: {
    id: string
    name: string
    phone: string
    township: string | null
    address: string | null
  }
  items: ShopOrderItem[]
  status_history?: Array<{
    id: string
    from_status: string | null
    to_status: string
    changed_at: string
    note: string | null
    changed_by: {
      id: string
      name: string
    } | null
  }>
}

export type ShopCustomer = {
  id: string
  shop_id: string
  name: string
  phone: string
  township: string | null
  address: string | null
  notes: string | null
  created_at: string
  total_orders: number
  total_spent: number
  last_order_at: string | null
  delivered_rate: number
  is_vip: boolean
  is_new_this_week: boolean
  largest_order_total: number
  favourite_item: string | null
  recent_orders?: Array<{
    id: string
    order_no: string
    status: string
    total_price: number
    created_at: string
    product_name: string
  }>
}

export type ShopDelivery = {
  id: string
  shop_id: string
  order_id: string
  driver_user_id: string
  status: string
  delivery_fee: number | null
  address_snapshot: string | null
  scheduled_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  driver: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  order: {
    id: string
    order_no: string
    status: string
    total_price: number
    currency: string
    delivery_fee: number
    customer: {
      id: string
      name: string
      phone: string
      township: string | null
      address: string | null
    }
  }
}

export type ShopTemplate = {
  id: string
  shop_id: string
  title: string
  shortcut: string | null
  body: string
  preview: string
  character_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ShopDailySummary = {
  id: string
  shop_id: string
  summary_date: string
  total_orders: number
  total_revenue: number
  delivered_count: number
  pending_count: number
  customer_count: number
  average_order_value: number
  revenue_delta_vs_previous_day: number
  delivered_rate: number
  status_breakdown: {
    new: number
    confirmed: number
    out_for_delivery: number
    delivered: number
  }
  hourly_breakdown: Array<{
    hour: number
    label: string
    order_count: number
    revenue: number
  }>
  top_products: Array<{
    product_name: string
    qty_sold: number
    revenue: number
  }>
  top_customers: Array<{
    customer_id: string
    customer_name: string
    order_count: number
    total_spent: number
  }>
  recent_orders: Array<{
    id: string
    order_no: string
    customer_name: string
    product_name: string
    status: string
    total_price: number
    created_at: string
  }>
}

export type ShopPeriodReport = {
  id: string
  shop_id: string
  report_type: "weekly" | "monthly"
  period_key: string
  period_label: string
  period_start_date: string
  period_end_date: string
  total_orders: number
  total_revenue: number
  delivered_count: number
  pending_count: number
  customer_count: number
  average_order_value: number
  revenue_delta_vs_previous_period: number
  delivered_rate: number
  status_breakdown: {
    new: number
    confirmed: number
    out_for_delivery: number
    delivered: number
  }
  daily_breakdown: Array<{
    date: string
    label: string
    order_count: number
    revenue: number
    delivered_count: number
    pending_count: number
  }>
  top_products: Array<{
    product_name: string
    qty_sold: number
    revenue: number
  }>
  top_customers: Array<{
    customer_id: string
    customer_name: string
    order_count: number
    total_spent: number
  }>
  recent_orders: Array<{
    id: string
    order_no: string
    customer_name: string
    product_name: string
    status: string
    total_price: number
    created_at: string
  }>
}

export type CurrentUserProfile = {
  id: string
  name: string
  email: string | null
  phone: string | null
  locale: string
  email_verified_at: string | null
  phone_verified_at: string | null
  platform_access: {
    role: string | null
    roles: Array<{
      id: string
      code: string
      name: string
      description: string | null
    }>
    permissions: string[]
  } | null
  auth_methods: string[]
  created_at: string
  updated_at: string
  shops: Array<
    ShopRecord & {
      membership: ShopMembershipSummary
    }
  >
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

export async function getShopPortalContext() {
  const session = await requireShopAdmin()
  const activeShop = getActiveShop(session)

  if (!activeShop) {
    redirect("/sign-in?error=no_access")
  }

  return {
    session,
    activeShop,
  }
}

async function shopRequest<T>(
  path: string,
  searchParams?: SearchParamsRecord,
  retryPath = "/dashboard"
): Promise<ApiSuccess<T>> {
  const { activeShop } = await getShopPortalContext()

  return requestAuthenticatedApiEnvelope<T>({
    path: `/api/v1/shops/${activeShop.id}${path}${buildQueryString(searchParams)}`,
    retryPath,
    requiredAccess: "shop",
  })
}

export async function getShopDetails(retryPath = "/dashboard/settings") {
  return shopRequest<ShopRecord>("", undefined, retryPath)
}

export async function getShopMembers(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/settings${buildQueryString(searchParams)}`
  return shopRequest<ShopMember[]>("/members", searchParams, resolvedRetryPath)
}

export async function getShopOrders(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/orders${buildQueryString(searchParams)}`
  return shopRequest<ShopOrder[]>("/orders", searchParams, resolvedRetryPath)
}

export async function getShopCustomers(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/customers${buildQueryString(searchParams)}`
  return shopRequest<ShopCustomer[]>("/customers", searchParams, resolvedRetryPath)
}

export async function getShopDeliveries(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/deliveries${buildQueryString(searchParams)}`
  return shopRequest<ShopDelivery[]>("/deliveries", searchParams, resolvedRetryPath)
}

export async function getShopTemplates(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/templates${buildQueryString(searchParams)}`
  return shopRequest<ShopTemplate[]>("/templates", searchParams, resolvedRetryPath)
}

export async function getShopDailySummary(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/reports${buildQueryString(searchParams)}`
  return shopRequest<ShopDailySummary>("/summaries/daily", searchParams, resolvedRetryPath)
}

export async function getShopWeeklyReport(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/reports${buildQueryString(searchParams)}`
  return shopRequest<ShopPeriodReport>("/reports/weekly", searchParams, resolvedRetryPath)
}

export async function getShopMonthlyReport(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/reports${buildQueryString(searchParams)}`
  return shopRequest<ShopPeriodReport>("/reports/monthly", searchParams, resolvedRetryPath)
}

export async function getCurrentUserProfile(retryPath = "/dashboard/settings") {
  return requestAuthenticatedApiEnvelope<CurrentUserProfile>({
    path: "/api/v1/users/me",
    retryPath,
    requiredAccess: "shop",
  })
}
