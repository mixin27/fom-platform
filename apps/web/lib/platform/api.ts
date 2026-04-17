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

export type PlatformInvoice = {
  id: string
  subscription_id: string
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
}

export type PlatformSubscription = {
  id: string
  shop_id: string
  shop_name: string
  owner_name: string
  owner_email: string | null
  plan_id: string
  plan_code: string
  plan_name: string
  plan_price: number
  plan_currency: string
  billing_period: string
  status: string
  auto_renews: boolean
  start_at: string
  end_at: string | null
  created_at: string
  updated_at: string
  latest_invoice: PlatformInvoice | null
  invoice_count: number
}

export type PlatformPlanOption = {
  id: string
  code: string
  name: string
  description: string | null
  billing_period: string
  price: number
  currency: string
  is_active: boolean
  marketing_visible: boolean
  sort_order: number
  items: PlatformPlanItem[]
  limits: PlatformPlanLimit[]
}

export type PlatformPlanItem = {
  id: string
  code: string
  label: string
  description: string | null
  availability_status: "available" | "unavailable" | string
  sort_order: number
}

export type PlatformPlanLimit = {
  id: string
  code: string
  label: string
  description: string | null
  value: number | null
  sort_order: number
}

export type PlatformSettingsPlan = PlatformPlanOption & {
  shop_count: number
  collected_revenue: number
}

export type PlatformFeaturePreset = {
  code: string
  category: string
  name: string
  description: string
  launch_phase: "phase_one" | "future" | string
}

export type PlatformLimitPreset = {
  code: string
  category: string
  name: string
  description: string
  launch_phase: "phase_one" | "future" | string
}

export type PlatformPlanSummary = {
  plan_code: string
  plan_name: string
  billing_period: string
  shop_count: number
  share: number
  monthly_recurring_revenue: number
  collected_revenue: number
}

export type PlatformShop = {
  id: string
  name: string
  timezone: string
  owner_user_id: string
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

export type PlatformOwnerAccount = {
  id: string
  name: string
  email: string | null
  phone: string | null
  active_shop_count: number
  owned_shop_count: number
  has_password_credential: boolean
}

export type PlatformUser = {
  id: string
  name: string
  email: string | null
  phone: string | null
  locale: string
  created_at: string
  last_active_at: string | null
  active_session_count: number
  auth_methods: string[]
  access_type: "platform" | "shop_owner" | "staff" | "no_shop"
  platform_roles: Array<{
    id: string
    code: string
    name: string
  }>
  platform_permissions_count: number
  owned_shop_count: number
  active_shop_count: number
  shops: Array<{
    shop_id: string
    shop_name: string
    membership_status: string
    role: string | null
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
      shop_id: string | null
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

export async function getPlatformUsers(searchParams?: SearchParamsRecord) {
  const retryPath = `/platform/users${buildQueryString(searchParams)}`

  return platformRequest<Array<PlatformUser>>(
    "/api/v1/platform/users",
    searchParams,
    retryPath
  )
}

export async function searchPlatformOwnerAccounts(query: string, limit = 8) {
  return platformRequest<Array<PlatformOwnerAccount>>(
    "/api/v1/platform/owner-accounts",
    {
      query,
      limit: String(limit),
    },
    "/platform/shops"
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
    invoices: PlatformInvoice[]
    invoices_pagination: {
      limit: number
      cursor: string | null
      next_cursor: string | null
      total: number
    }
    subscriptions: PlatformSubscription[]
    available_plans: PlatformPlanOption[]
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
    plans: PlatformPlanSummary[]
  }>("/api/v1/platform/subscriptions", searchParams, retryPath)
}

export async function getPlatformSupport() {
  return platformRequest<{
    overview: {
      open_items: number
      high_priority_items: number
      onboarding_items: number
      billing_items: number
      public_contact_inbox: number
    }
    issues: Array<{
      id: string
      kind: string
      severity: string
      status: string
      source: string
      shop_id: string | null
      shop_name: string
      title: string
      detail: string
      occurred_at: string
      assigned_to_user_id: string | null
      assigned_to_user_name: string | null
      resolution_note: string | null
      resolved_at: string | null
    }>
    public_contact: {
      open_count: number
      submissions: Array<{
        id: string
        email: string
        name: string | null
        subject: string | null
        message: string
        email_status: string
        ip_fingerprint: string | null
        user_agent: string | null
        archived: boolean
        admin_note: string | null
        created_at: string
      }>
    }
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
    plans: PlatformSettingsPlan[]
    feature_presets: PlatformFeaturePreset[]
    limit_presets: PlatformLimitPreset[]
  }>("/api/v1/platform/settings", undefined, "/platform/settings")
}
