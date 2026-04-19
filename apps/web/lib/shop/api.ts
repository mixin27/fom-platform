import "server-only"

import { redirect } from "next/navigation"

import { type ApiSuccess } from "@/lib/auth/api"
import type { PortalAnnouncement } from "@/lib/announcements/types"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"
import {
  defaultPathForSession,
  getActiveShop,
  requireShopAdmin,
} from "@/lib/auth/session"

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
  role_name?: string | null
  roles: Array<{
    id: string
    code: string
    name: string
    description: string | null
    is_system?: boolean
  }>
  status: string
  permissions: string[]
}

export type ShopMember = {
  id: string
  shop_id: string
  user_id: string
  role: string | null
  role_name?: string | null
  role_ids?: string[]
  roles: Array<{
    id: string
    code: string
    name: string
    description: string | null
    is_system?: boolean
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

export type ShopPermissionOption = {
  code: string
  name: string
  description: string
}

export type ShopRole = {
  id: string
  shop_id: string | null
  code: string
  name: string
  description: string | null
  is_system: boolean
  member_count: number
  assignable: boolean
  editable: boolean
  deletable: boolean
  permissions: Array<{
    id: string
    code: string
    name: string
    description: string | null
  }>
  permission_codes: string[]
  created_at: string
  updated_at: string
}

export type ShopRoleCatalog = {
  roles: ShopRole[]
  available_permissions: ShopPermissionOption[]
}

export type ShopAuditLog = {
  id: string
  shop_id: string
  action: string
  entity_type: string
  entity_id: string | null
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
  actor:
    | {
        id: string | null
        name: string
      }
    | null
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

export type ShopBilling = {
  shop_id: string
  shop_name: string
  payment_provider: {
    code: string
    label: string
    is_enabled: boolean
  }
  overview: {
    status: string | null
    auto_renews: boolean
    plan_code: string | null
    plan_name: string | null
    plan_price: number | null
    plan_currency: string | null
    billing_period: string | null
    current_period_start: string | null
    current_period_end: string | null
    outstanding_balance: number
    overdue_invoice_count: number
    next_due_at: string | null
    latest_invoice_status: string | null
    latest_paid_at: string | null
  }
  subscription: {
    id: string
    status: string
    auto_renews: boolean
    start_at: string
    end_at: string | null
    created_at: string
    updated_at: string
  } | null
  plans: Array<{
    id: string
    code: string
    name: string
    description: string | null
    price: number
    currency: string
    billing_period: string
    is_active: boolean
    items: Array<{
      code: string
      label: string
      description: string | null
      availability_status: string
      sort_order: number
    }>
  }>
  invoices: Array<{
    id: string
    invoice_no: string
    amount: number
    currency: string
    status: string
    payment_method: string | null
    provider_ref: string | null
    due_at: string | null
    paid_at: string | null
    created_at: string
    updated_at: string
    latest_transaction: {
      id: string
      provider: string
      provider_order_id: string
      status: string
      expires_at: string | null
      paid_at: string | null
      created_at: string
    } | null
  }>
  payment_proofs: Array<{
    id: string
    payment_id: string
    invoice_no: string
    amount_claimed: number
    currency_claimed: string
    payment_channel: string
    paid_at: string | null
    sender_name: string | null
    sender_phone: string | null
    transaction_ref: string | null
    note: string | null
    status: string
    admin_note: string | null
    reviewed_at: string | null
    reviewed_by: {
      id: string
      name: string
    } | null
    created_at: string
  }>
}

export type ShopBillingInvoiceDetail = {
  id: string
  invoice_no: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  provider_ref: string | null
  due_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  payment_provider: {
    code: string
    label: string
    is_enabled: boolean
  }
  subscription: {
    id: string
    status: string
    auto_renews: boolean
    start_at: string
    end_at: string | null
    shop_id: string
    shop_name: string
    plan_code: string
    plan_name: string
    plan_price: number
    plan_currency: string
    billing_period: string
  }
  latest_transaction: {
    id: string
    provider: string
    provider_txn_id: string | null
    provider_order_id: string
    status: string
    amount: number
    currency: string
    qr_payload: string | null
    qr_image_url: string | null
    payment_url: string | null
    expires_at: string | null
    paid_at: string | null
    created_at: string
    updated_at: string | null
  } | null
  transactions: Array<{
    id: string
    provider: string
    provider_txn_id: string | null
    provider_order_id: string
    status: string
    amount: number
    currency: string
    qr_payload: string | null
    qr_image_url: string | null
    payment_url: string | null
    expires_at: string | null
    paid_at: string | null
    created_at: string
    updated_at: string | null
  }>
}

export type ShopMessengerOverview = {
  connection: {
    id: string
    shop_id: string
    page_id: string
    page_name: string
    status: string
    last_webhook_at: string | null
    created_at: string
    updated_at: string
  } | null
  setup: {
    webhook_url: string
    verify_token_configured: boolean
    signature_validation_enabled: boolean
    graph_api_version: string
    oauth_connect_enabled: boolean
  }
  stats: {
    thread_count: number
    unread_count: number
    auto_reply_rule_count: number
  }
}

export type ShopMessengerOauthPageChoice = {
  page_id: string
  page_name: string
}

export type ShopMessengerOauthCompleteResult =
  | {
      status: "connected"
      connection: NonNullable<ShopMessengerOverview["connection"]>
    }
  | {
      status: "selection_required"
      redirect_uri: string
      selection_token: string
      pages: ShopMessengerOauthPageChoice[]
    }

export type ShopMessengerThread = {
  id: string
  shop_id: string
  connection_id: string
  customer_psid: string
  customer_name: string | null
  customer_locale: string | null
  customer_label: string
  last_message_text: string | null
  last_message_at: string | null
  unread_count: number
  message_count?: number
  created_at: string
  updated_at: string
  page: {
    id: string
    name: string
    status: string
  } | null
}

export type ShopMessengerMessage = {
  id: string
  thread_id: string
  provider_message_id: string | null
  direction: "inbound" | "outbound" | string
  message_type: string
  sender_psid: string | null
  recipient_id: string | null
  text_body: string | null
  is_echo: boolean
  sent_at: string
  created_at: string
  updated_at: string
}

export type ShopMessengerThreadDetail = ShopMessengerThread & {
  connection: NonNullable<ShopMessengerThread["page"]> & {
    shop_id: string
    page_id: string
    page_name: string
    last_webhook_at: string | null
    created_at: string
    updated_at: string
  }
  messages: ShopMessengerMessage[]
}

export type ShopMessengerAutoReplyRule = {
  id: string
  shop_id: string
  name: string
  match_type: "contains" | "exact" | string
  pattern: string
  reply_text: string
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export type ShopMessengerOrderSource = {
  thread_id: string
  message: string
  line_count: number
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
    redirect(defaultPathForSession(session))
  }

  return {
    session,
    activeShop,
  }
}

async function shopRequest<T>(
  path: string,
  searchParams?: SearchParamsRecord,
  retryPath = "/dashboard",
  allowForbidden = false
): Promise<ApiSuccess<T>> {
  const { activeShop } = await getShopPortalContext()

  return requestAuthenticatedApiEnvelope<T>({
    path: `/api/v1/shops/${activeShop.id}${path}${buildQueryString(searchParams)}`,
    retryPath,
    requiredAccess: "shop",
    allowForbidden,
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
  return shopRequest<ShopMember[]>("/members", searchParams, resolvedRetryPath, true)
}

export async function getShopMember(memberId: string, retryPath = "/dashboard/staffs") {
  return shopRequest<ShopMember>(`/members/${memberId}`, undefined, retryPath, true)
}

export async function getShopMemberByUserId(userId: string, retryPath = "/dashboard/staffs") {
  return shopRequest<ShopMember>(`/members/user/${userId}`, undefined, retryPath, true)
}

export async function getShopRoles(retryPath = "/dashboard/staffs") {
  return shopRequest<ShopRoleCatalog>("/roles", undefined, retryPath)
}

export async function getShopAuditLogs(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/staffs${buildQueryString(searchParams)}`
  return shopRequest<ShopAuditLog[]>("/audit-logs", searchParams, resolvedRetryPath)
}

export async function getShopBilling(retryPath = "/dashboard/billing") {
  return shopRequest<ShopBilling>("/billing", undefined, retryPath, true)
}

export async function getAvailablePlans(retryPath = "/dashboard/billing") {
  return shopRequest<ShopBilling["plans"]>("/billing/plans", undefined, retryPath)
}

export async function createSubscriptionInvoice(
  planCode: string,
  retryPath = "/dashboard/billing"
) {
  const { activeShop } = await getShopPortalContext()

  return requestAuthenticatedApiEnvelope<ShopBilling["invoices"][number]>({
    path: `/api/v1/shops/${activeShop.id}/billing/subscriptions`,
    init: {
      method: "POST",
      json: { plan_code: planCode },
    },
    retryPath,
    requiredAccess: "shop",
  })
}

export async function createInvoiceMmqrSession(
  invoiceId: string,
  retryPath?: string
) {
  const { activeShop } = await getShopPortalContext()

  return requestAuthenticatedApiEnvelope({
    path: `/api/v1/shops/${activeShop.id}/billing/invoices/${invoiceId}/mmqr-session`,
    init: {
      method: "POST",
    },
    retryPath,
    requiredAccess: "shop",
  })
}

export async function getShopAnnouncements(retryPath = "/dashboard") {
  return shopRequest<{ announcements: PortalAnnouncement[] }>(
    "/announcements",
    undefined,
    retryPath
  )
}

export async function getShopMessengerOverview(
  retryPath = "/dashboard/inbox",
  allowForbidden = false
) {
  return shopRequest<ShopMessengerOverview | null>(
    "/messenger",
    undefined,
    retryPath,
    allowForbidden
  )
}

export async function getShopMessengerThreads(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/inbox${buildQueryString(searchParams)}`
  return shopRequest<ShopMessengerThread[]>(
    "/messenger/threads",
    searchParams,
    resolvedRetryPath,
    true
  )
}

export async function getShopMessengerThread(
  threadId: string,
  retryPath = "/dashboard/inbox"
) {
  return shopRequest<ShopMessengerThreadDetail>(
    `/messenger/threads/${threadId}`,
    undefined,
    retryPath,
    true
  )
}

export async function getShopMessengerOrderSource(
  threadId: string,
  retryPath = "/dashboard/orders/paste-from-messenger"
) {
  return shopRequest<ShopMessengerOrderSource>(
    `/messenger/threads/${threadId}/order-source`,
    undefined,
    retryPath,
    true
  )
}

export async function getShopMessengerAutoReplyRules(
  retryPath = "/dashboard/inbox"
) {
  return shopRequest<{ rules: ShopMessengerAutoReplyRule[] }>(
    "/messenger/auto-reply-rules",
    undefined,
    retryPath,
    true
  )
}

export async function getShopMessengerAutoReplyRule(
  ruleId: string,
  retryPath = "/dashboard/inbox"
) {
  return shopRequest<ShopMessengerAutoReplyRule>(
    `/messenger/auto-reply-rules/${ruleId}`,
    undefined,
    retryPath,
    true
  )
}

export async function getShopBillingInvoice(
  invoiceId: string,
  retryPath = "/dashboard/billing"
) {
  return shopRequest<ShopBillingInvoiceDetail>(
    `/billing/invoices/${invoiceId}`,
    undefined,
    retryPath,
    true
  )
}

export async function getShopOrders(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/orders${buildQueryString(searchParams)}`
  return shopRequest<ShopOrder[]>("/orders", searchParams, resolvedRetryPath, true)
}

export async function getShopOrder(orderId: string, retryPath = "/dashboard/orders") {
  return shopRequest<ShopOrder>(`/orders/${orderId}`, undefined, retryPath, true)
}

export async function getShopCustomers(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/customers${buildQueryString(searchParams)}`
  return shopRequest<ShopCustomer[]>("/customers", searchParams, resolvedRetryPath, true)
}

export async function getShopCustomer(
  customerId: string,
  retryPath = "/dashboard/customers"
) {
  return shopRequest<ShopCustomer>(`/customers/${customerId}`, undefined, retryPath, true)
}

export async function getShopDeliveries(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/deliveries${buildQueryString(searchParams)}`
  return shopRequest<ShopDelivery[]>("/deliveries", searchParams, resolvedRetryPath, true)
}

export async function getShopTemplates(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/templates${buildQueryString(searchParams)}`
  return shopRequest<ShopTemplate[]>("/templates", searchParams, resolvedRetryPath, true)
}

export async function getShopDailySummary(
  searchParams?: SearchParamsRecord,
  retryPath?: string
) {
  const resolvedRetryPath =
    retryPath ?? `/dashboard/reports${buildQueryString(searchParams)}`
  return shopRequest<ShopDailySummary>(
    "/summaries/daily",
    searchParams,
    resolvedRetryPath,
    true
  )
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
