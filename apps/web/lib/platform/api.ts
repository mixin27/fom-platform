import "server-only"

import { type ApiSuccess } from "@/lib/auth/api"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"

type SearchParamsValue = string | string[] | undefined
type SearchParamsRecord = Record<string, SearchParamsValue>

export type PlatformCursorPagination = {
  limit: number
  cursor: string | null
  next_cursor: string | null
  total: number
}

export type PlatformInvoiceSummary = {
  invoice_no: string
  amount: number
  currency: string
  status: string
  due_at: string | null
  paid_at: string | null
}

export type PlatformShop = {
  id: string
  name: string
  owner_name: string
  owner_email: string | null
  owner_phone: string | null
  plan_code: string | null
  plan_name: string | null
  plan_price: number | null
  plan_currency: string | null
  billing_period: string | null
  status: string
  member_count: number
  customer_count: number
  total_orders: number
  delivered_orders: number
  total_revenue: number
  township: string | null
  joined_at: string
  last_active_at: string | null
  active_session_count: number
  current_period_end: string | null
  latest_invoice: PlatformInvoiceSummary | null
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

async function platformRequest<T>(
  path: string,
  searchParams?: SearchParamsRecord,
  retryPath = "/platform"
): Promise<ApiSuccess<T>> {
  return requestAuthenticatedApiEnvelope<T>({
    path: `${path}${buildQueryString(searchParams)}`,
    retryPath,
    requiredAccess: "platform",
  })
}

export async function getPlatformDashboard() {
  return platformRequest<{
    overview: {
      total_shops: number
      active_shops: number
      trial_shops: number
      total_orders: number
      total_revenue: number
      monthly_recurring_revenue: number
      projected_arr: number
      yearly_plan_revenue: number
      overdue_invoices: number
    }
    revenue_series: Array<{
      date: string
      label: string
      amount: number
    }>
    subscription_mix: Array<{
      plan_code: string
      plan_name: string
      billing_period: string
      shop_count: number
      share: number
      monthly_recurring_revenue: number
      collected_revenue: number
    }>
    health: {
      active_shops: number
      trials_expiring_this_week: number
      overdue_payments: number
      average_orders_per_shop: number
    }
    recent_shops: Array<{
      id: string
      name: string
      owner_name: string
      owner_email: string | null
      plan_name: string | null
      status: string
      total_orders: number
      total_revenue: number
      township: string | null
      joined_at: string
      last_active_at: string | null
      latest_invoice: {
        invoice_no: string
        amount: number
        currency: string
        status: string
        due_at: string | null
        paid_at: string | null
      } | null
    }>
    attention_items: Array<{
      id: string
      kind: string
      severity: string
      shop_id: string
      shop_name: string
      title: string
      detail: string
      occurred_at: string
    }>
  }>("/api/v1/platform/dashboard", undefined, "/platform")
}

export async function getPlatformShops(searchParams?: SearchParamsRecord) {
  const retryPath = `/platform/shops${buildQueryString(searchParams)}`

  return platformRequest<Array<PlatformShop>>(
    "/api/v1/platform/shops",
    searchParams,
    retryPath
  )
}

export async function getPlatformSubscriptions(searchParams?: SearchParamsRecord) {
  const retryPath = `/platform/subscriptions${buildQueryString(searchParams)}`

  return platformRequest<{
    overview: {
      monthly_recurring_revenue: number
      projected_arr: number
      yearly_plan_revenue: number
      overdue_invoices: number
      paid_invoices: number
    }
    overdue_notice: {
      id: string
      invoice_no: string
      shop_id: string
      shop_name: string
      plan_code: string
      plan_name: string
      amount: number
      currency: string
      payment_method: string | null
      provider_ref: string | null
      status: string
      due_at: string | null
      paid_at: string | null
      created_at: string
    } | null
    invoices: Array<{
      id: string
      invoice_no: string
      shop_id: string
      shop_name: string
      plan_code: string
      plan_name: string
      amount: number
      currency: string
      payment_method: string | null
      provider_ref: string | null
      status: string
      due_at: string | null
      paid_at: string | null
      created_at: string
    }>
    invoices_pagination: {
      limit: number
      cursor: string | null
      next_cursor: string | null
      total: number
    }
    upcoming_renewals: Array<{
      shop_id: string
      shop_name: string
      plan_code: string | null
      plan_name: string | null
      amount: number | null
      currency: string | null
      due_at: string | null
      status: string
    }>
    plans: Array<{
      plan_code: string
      plan_name: string
      billing_period: string
      shop_count: number
      share: number
      monthly_recurring_revenue: number
      collected_revenue: number
    }>
  }>("/api/v1/platform/subscriptions", searchParams, retryPath)
}

export async function getPlatformSupport() {
  return platformRequest<{
    overview: {
      open_items: number
      high_priority_items: number
      onboarding_items: number
      billing_items: number
    }
    issues: Array<{
      id: string
      kind: string
      severity: string
      shop_id: string
      shop_name: string
      title: string
      detail: string
      occurred_at: string
    }>
    health: {
      total_shops: number
      active_shops: number
      inactive_shops: number
      overdue_invoices: number
    }
    recent_activity: Array<{
      shop_id: string
      shop_name: string
      status: string
      total_orders: number
      last_active_at: string | null
    }>
  }>("/api/v1/platform/support", undefined, "/platform/support")
}

export async function getPlatformSettings() {
  return platformRequest<{
    profile: {
      id: string
      name: string
      email: string | null
      phone: string | null
      locale: string
      active_sessions: number
      last_seen_at: string | null
    }
    access: {
      role: string | null
      roles: string[]
      permissions: string[]
      role_count: number
      permission_count: number
    }
    plans: Array<{
      id: string
      code: string
      name: string
      description: string | null
      billing_period: string
      price: number
      currency: string
      is_active: boolean
      shop_count: number
      collected_revenue: number
    }>
  }>("/api/v1/platform/settings", undefined, "/platform/settings")
}
