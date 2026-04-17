"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"
import { SHOP_MESSENGER_OAUTH_SELECTION_COOKIE } from "@/lib/messenger/oauth"

function revalidateShopWorkspace() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/billing")
  revalidatePath("/dashboard/inbox")
  revalidatePath("/dashboard/orders")
  revalidatePath("/dashboard/orders/paste-from-messenger")
  revalidatePath("/dashboard/customers")
  revalidatePath("/dashboard/staffs")
  revalidatePath("/dashboard/deliveries")
  revalidatePath("/dashboard/templates")
  revalidatePath("/dashboard/reports")
  revalidatePath("/dashboard/settings")
}

function normalizeTextField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeIntegerField(value: FormDataEntryValue | null) {
  const normalized = normalizeTextField(value)
  if (!normalized) {
    return undefined
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeDateTimeField(value: FormDataEntryValue | null) {
  const normalized = normalizeTextField(value)

  if (!normalized) {
    return undefined
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

function normalizeBooleanField(value: FormDataEntryValue | null) {
  return typeof value === "string"
    ? ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
    : false
}

function getReturnTo(formData: FormData, fallbackPath: string) {
  const returnTo = normalizeTextField(formData.get("return_to"))

  if (!returnTo.startsWith("/dashboard")) {
    return fallbackPath
  }

  return returnTo
}

function appendRedirectParams(
  pathname: string,
  input: {
    notice?: string
    error?: string
  }
) {
  const url = new URL(pathname, "http://fom-platform.local")

  url.searchParams.delete("notice")
  url.searchParams.delete("error")

  if (input.notice) {
    url.searchParams.set("notice", input.notice)
  }

  if (input.error) {
    url.searchParams.set("error", input.error)
  }

  const search = url.searchParams.toString()
  return search.length > 0 ? `${url.pathname}?${search}` : url.pathname
}

function redirectToPath(
  pathname: string,
  input: {
    notice?: string
    error?: string
  }
) {
  redirect(appendRedirectParams(pathname, input))
}

function toActionMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.message
  }

  return fallbackMessage
}

function parseOrderItemsInput(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return {
      error:
        "Add at least one order item using the format Product name | Qty | Unit price.",
    } as const
  }

  const items = []

  for (const [index, line] of lines.entries()) {
    const parts = line.split("|").map((part) => part.trim())

    if (parts.length !== 3) {
      return {
        error: `Item line ${index + 1} must use Product name | Qty | Unit price.`,
      } as const
    }

    const productName = parts[0] ?? ""
    const qtyText = parts[1] ?? ""
    const unitPriceText = parts[2] ?? ""
    const qty = Number.parseInt(qtyText, 10)
    const unitPrice = Number.parseInt(unitPriceText, 10)

    if (!productName) {
      return {
        error: `Item line ${index + 1} is missing the product name.`,
      } as const
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return {
        error: `Item line ${index + 1} has an invalid quantity.`,
      } as const
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        error: `Item line ${index + 1} has an invalid unit price.`,
      } as const
    }

    items.push({
      product_name: productName,
      qty,
      unit_price: unitPrice,
    })
  }

  return { items } as const
}

export type ShopParsedOrderDraftInput = {
  customer: {
    name: string
    phone: string
    township: string
    address: string
  }
  items: Array<{
    product_name: string
    qty: number
    unit_price: number
  }>
  delivery_fee: number
  currency: string
  status: "new" | "confirmed"
  source: "messenger"
  note: string
}

export type ShopParsedOrderResult = {
  suggested_order: {
    customer: {
      name: string | null
      phone: string | null
      township: string | null
      address: string | null
    }
    items: Array<{
      product_name: string | null
      qty: number | null
      unit_price: number | null
      line_total: number | null
    }>
    delivery_fee: number | null
    subtotal: number
    total_price: number
    currency: "MMK"
    status: "new" | "confirmed"
    source: "messenger"
    note: string | null
  }
  parse_meta: {
    is_ready_to_create: boolean
    confidence: number
    matched_fields: string[]
    field_sources: Record<string, "message" | "customer_match" | "default">
    warnings: string[]
    unparsed_lines: string[]
  }
  customer_match: {
    id: string
    shop_id: string
    name: string
    phone: string
    township: string | null
    address: string | null
    notes: string | null
    created_at: string
  } | null
}

export type ShopAsyncActionResult<T> =
  | {
      ok: true
      data: T
      message?: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
    }

export type ShopMutationActionResult =
  | {
      ok: true
      message: string
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[]>
    }

function toFieldErrors(details?: Array<{ field: string; errors: string[] }>) {
  return Object.fromEntries((details ?? []).map((detail) => [detail.field, detail.errors]))
}

function toMutationActionError(
  error: unknown,
  fallbackMessage: string
): ShopMutationActionResult {
  if (error instanceof AuthApiError) {
    return {
      ok: false,
      message: error.message,
      fieldErrors: toFieldErrors(error.details),
    }
  }

  return {
    ok: false,
    message: fallbackMessage,
  }
}

function sanitizeParsedDraftInput(draft: ShopParsedOrderDraftInput) {
  const customer = {
    name: draft.customer.name.trim(),
    phone: draft.customer.phone.trim(),
    township: draft.customer.township.trim(),
    address: draft.customer.address.trim(),
  }

  if (!customer.name || !customer.phone) {
    return {
      error: "Customer name and phone are required before creating an order.",
    } as const
  }

  const items = draft.items
    .map((item) => ({
      product_name: item.product_name.trim(),
      qty: Number(item.qty),
      unit_price: Number(item.unit_price),
    }))
    .filter((item) => item.product_name.length > 0)

  if (items.length === 0) {
    return {
      error: "Add at least one parsed item before creating the order.",
    } as const
  }

  for (const [index, item] of items.entries()) {
    if (!Number.isFinite(item.qty) || item.qty <= 0) {
      return {
        error: `Parsed item ${index + 1} has an invalid quantity.`,
      } as const
    }

    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      return {
        error: `Parsed item ${index + 1} has an invalid unit price.`,
      } as const
    }
  }

  const deliveryFee = Number(draft.delivery_fee)
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return {
      error: "Delivery fee must be a non-negative integer.",
    } as const
  }

  return {
    payload: {
      customer: {
        name: customer.name,
        phone: customer.phone,
        ...(customer.township ? { township: customer.township } : {}),
        ...(customer.address ? { address: customer.address } : {}),
      },
      items,
      delivery_fee: deliveryFee,
      currency: draft.currency.trim() || "MMK",
      status: draft.status,
      source: "messenger" as const,
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    },
  } as const
}

export async function createShopOrderFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const customerName = normalizeTextField(formData.get("customer_name"))
  const customerPhone = normalizeTextField(formData.get("customer_phone"))
  const customerTownship = normalizeTextField(formData.get("customer_township"))
  const customerAddress = normalizeTextField(formData.get("customer_address"))
  const status = normalizeTextField(formData.get("status"))
  const source = normalizeTextField(formData.get("source"))
  const currency = normalizeTextField(formData.get("currency"))
  const note = normalizeTextField(formData.get("note"))
  const deliveryFee = normalizeIntegerField(formData.get("delivery_fee"))
  const itemsInput = normalizeTextField(formData.get("items"))

  if (!shopId || !customerName || !customerPhone) {
    redirectToPath(returnTo, {
      error: "Customer name and phone are required.",
    })
  }

  const parsedItems = parseOrderItemsInput(itemsInput)
  if ("error" in parsedItems) {
    redirectToPath(returnTo, {
      error: parsedItems.error,
    })
  }

  if (deliveryFee !== undefined && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) {
    redirectToPath(returnTo, {
      error: "Delivery fee must be a non-negative integer.",
    })
  }

  const payload: Record<string, unknown> = {
    customer: {
      name: customerName,
      phone: customerPhone,
      ...(customerTownship ? { township: customerTownship } : {}),
      ...(customerAddress ? { address: customerAddress } : {}),
    },
    items: parsedItems.items,
  }

  if (status) {
    payload.status = status
  }
  if (source) {
    payload.source = source
  }
  if (currency) {
    payload.currency = currency
  }
  if (note) {
    payload.note = note
  }
  if (deliveryFee !== undefined) {
    payload.delivery_fee = deliveryFee
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: payload,
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order created." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to create the order right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function importShopOrdersSpreadsheetAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/exports")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const fileEntry = formData.get("spreadsheet")

  if (!shopId) {
    redirectToPath(returnTo, {
      error: "Shop context is missing for this import.",
    })
  }

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    redirectToPath(returnTo, {
      error: "Choose a CSV or Excel file before starting the import.",
    })
  }
  const selectedFile = fileEntry as File

  const filename = selectedFile.name.trim()
  if (!/\.(csv|xlsx)$/i.test(filename)) {
    redirectToPath(returnTo, {
      error: "Only .csv or .xlsx files are supported for order import.",
    })
  }

  if (selectedFile.size > 5 * 1024 * 1024) {
    redirectToPath(returnTo, {
      error: "The import file is too large. Keep it under 5 MB.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    const bytes = Buffer.from(await selectedFile.arrayBuffer())
    const response = await requestAuthenticatedActionApiEnvelope<{
      summary: string
    }>({
      path: `/api/v1/shops/${shopId}/orders/import-spreadsheet`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          filename,
          content_base64: bytes.toString("base64"),
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = {
      notice:
        response.data.summary || `Imported orders from ${filename}.`,
    }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(
        error,
        "Unable to import the spreadsheet right now."
      ),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopOrderStatusFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const orderId = normalizeTextField(formData.get("order_id"))
  const status = normalizeTextField(formData.get("status"))
  const note = normalizeTextField(formData.get("note"))

  if (!orderId || !status) {
    redirectToPath(returnTo, {
      error: "Order ID and status are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${normalizeTextField(formData.get("shop_id"))}/orders/${orderId}/status`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          status,
          ...(note ? { note } : {}),
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order status updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the order status right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopOrderFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const orderId = normalizeTextField(formData.get("order_id"))
  const deliveryFee = normalizeIntegerField(formData.get("delivery_fee"))
  const currency = normalizeTextField(formData.get("currency"))
  const source = normalizeTextField(formData.get("source"))
  const note = normalizeTextField(formData.get("note"))

  if (!shopId || !orderId) {
    redirectToPath(returnTo, {
      error: "Order context is missing.",
    })
  }

  if (deliveryFee !== undefined && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) {
    redirectToPath(returnTo, {
      error: "Delivery fee must be a non-negative integer.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(deliveryFee !== undefined ? { delivery_fee: deliveryFee } : {}),
          ...(currency ? { currency } : {}),
          ...(source ? { source } : {}),
          note: note || null,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order details updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the order right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function addShopOrderItemFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const orderId = normalizeTextField(formData.get("order_id"))
  const productName = normalizeTextField(formData.get("product_name"))
  const qty = normalizeIntegerField(formData.get("qty"))
  const unitPrice = normalizeIntegerField(formData.get("unit_price"))

  if (!shopId || !orderId || !productName) {
    redirectToPath(returnTo, {
      error: "Product name is required to add an order item.",
    })
  }

  if (!Number.isFinite(qty) || (qty ?? 0) <= 0) {
    redirectToPath(returnTo, {
      error: "Item quantity must be a positive integer.",
    })
  }

  if (!Number.isFinite(unitPrice) || (unitPrice ?? -1) < 0) {
    redirectToPath(returnTo, {
      error: "Item unit price must be a non-negative integer.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          product_name: productName,
          qty,
          unit_price: unitPrice,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order item added." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to add the order item right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopOrderItemFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const orderId = normalizeTextField(formData.get("order_id"))
  const itemId = normalizeTextField(formData.get("item_id"))
  const productName = normalizeTextField(formData.get("product_name"))
  const qty = normalizeIntegerField(formData.get("qty"))
  const unitPrice = normalizeIntegerField(formData.get("unit_price"))

  if (!shopId || !orderId || !itemId || !productName) {
    redirectToPath(returnTo, {
      error: "Order item context is missing.",
    })
  }

  if (!Number.isFinite(qty) || (qty ?? 0) <= 0) {
    redirectToPath(returnTo, {
      error: "Item quantity must be a positive integer.",
    })
  }

  if (!Number.isFinite(unitPrice) || (unitPrice ?? -1) < 0) {
    redirectToPath(returnTo, {
      error: "Item unit price must be a non-negative integer.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items/${itemId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          product_name: productName,
          qty,
          unit_price: unitPrice,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order item updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the order item right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function removeShopOrderItemFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/orders")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const orderId = normalizeTextField(formData.get("order_id"))
  const itemId = normalizeTextField(formData.get("item_id"))

  if (!shopId || !orderId || !itemId) {
    redirectToPath(returnTo, {
      error: "Order item context is missing.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items/${itemId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Order item removed." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to remove the order item right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function parseShopOrderMessageAction(
  shopId: string,
  message: string
): Promise<ShopAsyncActionResult<ShopParsedOrderResult>> {
  if (!shopId || !message.trim()) {
    return {
      ok: false,
      message: "Paste a Messenger conversation before parsing.",
    }
  }

  try {
    const response = await requestAuthenticatedActionApiEnvelope<ShopParsedOrderResult>({
      path: `/api/v1/shops/${shopId}/orders/parse-message`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          message: message.trim(),
        },
      },
    })

    return {
      ok: true,
      data: response.data,
    }
  } catch (error) {
    if (error instanceof AuthApiError) {
      return {
        ok: false,
        message: error.message,
        fieldErrors: toFieldErrors(error.details),
      }
    }

    return {
      ok: false,
      message: "Unable to parse the Messenger message right now.",
    }
  }
}

export async function createShopOrderFromParsedDraftAction(
  shopId: string,
  draft: ShopParsedOrderDraftInput
): Promise<ShopAsyncActionResult<{ id: string; order_no: string }>> {
  const sanitized = sanitizeParsedDraftInput(draft)

  if ("error" in sanitized) {
    return {
      ok: false,
      message: sanitized.error ?? "The parsed order draft is incomplete.",
    }
  }

  try {
    const response = await requestAuthenticatedActionApiEnvelope<{
      id: string
      order_no: string
    }>({
      path: `/api/v1/shops/${shopId}/orders`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: sanitized.payload,
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      data: {
        id: response.data.id,
        order_no: response.data.order_no,
      },
      message: "Order created from Messenger draft.",
    }
  } catch (error) {
    if (error instanceof AuthApiError) {
      return {
        ok: false,
        message: error.message,
        fieldErrors: toFieldErrors(error.details),
      }
    }

    return {
      ok: false,
      message: "Unable to create the order from the parsed draft right now.",
    }
  }
    }

export type ShopOrderCreateInput = {
  customer: {
    name: string
    phone: string
    township?: string | null
    address?: string | null
  }
  items: Array<{
    product_name: string
    qty: number
    unit_price: number
    product_id?: string | null
  }>
  status?: "new" | "confirmed"
  source?: "manual" | "messenger"
  delivery_fee?: number
  currency?: string
  note?: string | null
}

export type ShopOrderUpdateInput = {
  delivery_fee?: number | null
  currency?: string
  source?: "manual" | "messenger"
  note?: string | null
}

export type ShopOrderItemInput = {
  product_name?: string
  qty?: number
  unit_price?: number
  product_id?: string | null
}

export type ShopCustomerInput = {
  name: string
  phone: string
  township?: string | null
  address?: string | null
  notes?: string | null
}

export type ShopMessengerAutoReplyRuleInput = {
  name: string
  match_type: "contains" | "exact"
  pattern: string
  reply_text: string
  is_active: boolean
}

export async function updateShopMessengerConnectionFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const pageId = normalizeTextField(formData.get("page_id"))
  const pageName = normalizeTextField(formData.get("page_name"))
  const pageAccessToken = normalizeTextField(formData.get("page_access_token"))

  if (!shopId || !pageId || !pageAccessToken) {
    redirectToPath(returnTo, {
      error: "Page ID and page access token are required.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/connection`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PUT",
        json: {
          page_id: pageId,
          ...(pageName ? { page_name: pageName } : {}),
          page_access_token: pageAccessToken,
        },
      },
    })

    revalidateShopWorkspace()
    revalidatePath(returnTo)
    redirectToPath(returnTo, {
      notice: "Messenger page connection updated.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to save the Messenger page connection right now."
      ),
    })
  }
}

export async function disconnectShopMessengerConnectionFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))

  if (!shopId) {
    redirectToPath(returnTo, {
      error: "Shop context is missing.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/connection`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()
    revalidatePath(returnTo)
    redirectToPath(returnTo, {
      notice: "Messenger page disconnected.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to disconnect the Messenger page right now."
      ),
    })
  }
}

export async function completeShopMessengerOauthSelectionFromFormAction(
  formData: FormData
) {
  const shopId = normalizeTextField(formData.get("shop_id"))
  const selectionToken = normalizeTextField(formData.get("selection_token"))
  const pageId = normalizeTextField(formData.get("page_id"))
  const pageName = normalizeTextField(formData.get("page_name"))
  const cookieStore = await cookies()

  if (!shopId || !selectionToken || !pageId) {
    cookieStore.delete(SHOP_MESSENGER_OAUTH_SELECTION_COOKIE)
    redirectToPath("/dashboard/inbox", {
      error: "Messenger page selection expired.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/oauth/select-page`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          selection_token: selectionToken,
          page_id: pageId,
          ...(pageName ? { page_name: pageName } : {}),
        },
      },
    })

    cookieStore.delete(SHOP_MESSENGER_OAUTH_SELECTION_COOKIE)
    revalidateShopWorkspace()
    revalidatePath("/dashboard/inbox/connect-meta/select")
    redirectToPath("/dashboard/inbox", {
      notice: "Messenger page connected.",
    })
  } catch (error) {
    cookieStore.delete(SHOP_MESSENGER_OAUTH_SELECTION_COOKIE)
    redirectToPath("/dashboard/inbox", {
      error: toActionMessage(
        error,
        "Unable to connect the selected Messenger page right now."
      ),
    })
  }
}

export async function markShopMessengerThreadReadFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const threadId = normalizeTextField(formData.get("thread_id"))

  if (!shopId || !threadId) {
    redirectToPath(returnTo, {
      error: "Messenger thread context is missing.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/threads/${threadId}/read`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
      },
    })

    revalidateShopWorkspace()
    revalidatePath(returnTo)
    redirectToPath(returnTo, {
      notice: "Thread marked as read.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(error, "Unable to update the thread right now."),
    })
  }
}

export async function sendShopMessengerReplyFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const threadId = normalizeTextField(formData.get("thread_id"))
  const text = normalizeTextField(formData.get("text"))

  if (!shopId || !threadId || !text) {
    redirectToPath(returnTo, {
      error: "Reply text is required before sending.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/threads/${threadId}/reply`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          text,
        },
      },
    })

    revalidateShopWorkspace()
    revalidatePath(returnTo)
    redirectToPath(returnTo, {
      notice: "Reply sent to Messenger.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to send the Messenger reply right now."
      ),
    })
  }
}

export async function createShopMessengerAutoReplyRuleFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const name = normalizeTextField(formData.get("name"))
  const matchType = normalizeTextField(formData.get("match_type"))
  const pattern = normalizeTextField(formData.get("pattern"))
  const replyText = normalizeTextField(formData.get("reply_text"))
  const isActive = normalizeBooleanField(formData.get("is_active"))

  if (!shopId || !name || !matchType || !pattern || !replyText) {
    redirectToPath(returnTo, {
      error: "Rule name, match type, pattern, and reply text are required.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/auto-reply-rules`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          name,
          match_type: matchType,
          pattern,
          reply_text: replyText,
          is_active: isActive,
        },
      },
    })

    revalidateShopWorkspace()
    revalidatePath("/dashboard/inbox")
    redirectToPath(returnTo, {
      notice: "Auto reply rule created.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to create the auto reply rule right now."
      ),
    })
  }
}

export async function updateShopMessengerAutoReplyRuleFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const ruleId = normalizeTextField(formData.get("rule_id"))
  const name = normalizeTextField(formData.get("name"))
  const matchType = normalizeTextField(formData.get("match_type"))
  const pattern = normalizeTextField(formData.get("pattern"))
  const replyText = normalizeTextField(formData.get("reply_text"))
  const isActive = normalizeBooleanField(formData.get("is_active"))

  if (!shopId || !ruleId || !name || !matchType || !pattern || !replyText) {
    redirectToPath(returnTo, {
      error: "Rule context is incomplete.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/auto-reply-rules/${ruleId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          name,
          match_type: matchType,
          pattern,
          reply_text: replyText,
          is_active: isActive,
        },
      },
    })

    revalidateShopWorkspace()
    revalidatePath(returnTo)
    redirectToPath(returnTo, {
      notice: "Auto reply rule updated.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to update the auto reply rule right now."
      ),
    })
  }
}

export async function deleteShopMessengerAutoReplyRuleFromFormAction(
  formData: FormData
) {
  const returnTo = getReturnTo(formData, "/dashboard/inbox")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const ruleId = normalizeTextField(formData.get("rule_id"))

  if (!shopId || !ruleId) {
    redirectToPath(returnTo, {
      error: "Auto reply rule context is missing.",
    })
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/messenger/auto-reply-rules/${ruleId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()
    revalidatePath("/dashboard/inbox")
    redirectToPath(returnTo, {
      notice: "Auto reply rule deleted.",
    })
  } catch (error) {
    redirectToPath(returnTo, {
      error: toActionMessage(
        error,
        "Unable to delete the auto reply rule right now."
      ),
    })
  }
}

export type ShopCustomerUpdateInput = Partial<ShopCustomerInput>

export type ShopTemplateInput = {
  title: string
  body: string
  shortcut?: string | null
  is_active?: boolean
}

export type ShopTemplateUpdateInput = Partial<ShopTemplateInput>

export type ShopDeliveryInput = {
  order_id: string
  driver_user_id: string
  status?: "scheduled" | "out_for_delivery" | "delivered"
  delivery_fee?: number | null
  address_snapshot?: string | null
  scheduled_at?: string | null
  delivered_at?: string | null
}

export type ShopDeliveryUpdateInput = {
  driver_user_id?: string
  status?: "scheduled" | "out_for_delivery" | "delivered"
  delivery_fee?: number | null
  address_snapshot?: string | null
  scheduled_at?: string | null
  delivered_at?: string | null
}

export async function createShopOrderAction(
  shopId: string,
  input: ShopOrderCreateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !input.customer.name.trim() || !input.customer.phone.trim()) {
    return {
      ok: false,
      message: "Customer name and phone are required.",
    }
  }

  if (input.items.length === 0) {
    return {
      ok: false,
      message: "Add at least one order item.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          customer: {
            name: input.customer.name.trim(),
            phone: input.customer.phone.trim(),
            ...(input.customer.township?.trim()
              ? { township: input.customer.township.trim() }
              : {}),
            ...(input.customer.address?.trim()
              ? { address: input.customer.address.trim() }
              : {}),
          },
          items: input.items.map((item) => ({
            product_name: item.product_name.trim(),
            qty: item.qty,
            unit_price: item.unit_price,
            ...(item.product_id?.trim() ? { product_id: item.product_id.trim() } : {}),
          })),
          ...(input.status ? { status: input.status } : {}),
          ...(input.source ? { source: input.source } : {}),
          ...(input.delivery_fee !== undefined
            ? { delivery_fee: input.delivery_fee }
            : {}),
          ...(input.currency?.trim() ? { currency: input.currency.trim() } : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() ? input.note.trim() : null }
            : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Order created.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to create the order right now.")
  }
}

export async function updateShopOrderAction(
  shopId: string,
  orderId: string,
  input: ShopOrderUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !orderId) {
    return {
      ok: false,
      message: "Order context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.delivery_fee !== undefined
            ? { delivery_fee: input.delivery_fee }
            : {}),
          ...(input.currency !== undefined
            ? { currency: input.currency.trim() }
            : {}),
          ...(input.source !== undefined ? { source: input.source } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Order updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the order right now.")
  }
}

export async function addShopOrderItemAction(
  shopId: string,
  orderId: string,
  input: Required<Pick<ShopOrderItemInput, "product_name" | "qty" | "unit_price">> &
    Pick<ShopOrderItemInput, "product_id">
): Promise<ShopMutationActionResult> {
  if (!shopId || !orderId || !input.product_name.trim()) {
    return {
      ok: false,
      message: "Product name is required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          product_name: input.product_name.trim(),
          qty: input.qty,
          unit_price: input.unit_price,
          ...(input.product_id?.trim() ? { product_id: input.product_id.trim() } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Order item added.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to add the order item right now.")
  }
}

export async function updateShopOrderItemAction(
  shopId: string,
  orderId: string,
  itemId: string,
  input: ShopOrderItemInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !orderId || !itemId) {
    return {
      ok: false,
      message: "Order item context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items/${itemId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.product_name !== undefined
            ? { product_name: input.product_name.trim() }
            : {}),
          ...(input.qty !== undefined ? { qty: input.qty } : {}),
          ...(input.unit_price !== undefined
            ? { unit_price: input.unit_price }
            : {}),
          ...(input.product_id !== undefined
            ? { product_id: input.product_id?.trim() ? input.product_id.trim() : null }
            : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Order item updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the order item right now.")
  }
}

export async function removeShopOrderItemAction(
  shopId: string,
  orderId: string,
  itemId: string
): Promise<ShopMutationActionResult> {
  if (!shopId || !orderId || !itemId) {
    return {
      ok: false,
      message: "Order item context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/orders/${orderId}/items/${itemId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Order item removed.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to remove the order item right now.")
  }
}

export async function createShopCustomerAction(
  shopId: string,
  input: ShopCustomerInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !input.name.trim() || !input.phone.trim()) {
    return {
      ok: false,
      message: "Customer name and phone are required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/customers`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          name: input.name.trim(),
          phone: input.phone.trim(),
          ...(input.township?.trim() ? { township: input.township.trim() } : {}),
          ...(input.address?.trim() ? { address: input.address.trim() } : {}),
          ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Customer saved.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to save the customer right now.")
  }
}

export async function updateShopCustomerAction(
  shopId: string,
  customerId: string,
  input: ShopCustomerUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !customerId) {
    return {
      ok: false,
      message: "Customer context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/customers/${customerId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
          ...(input.township !== undefined
            ? { township: input.township?.trim() ? input.township.trim() : null }
            : {}),
          ...(input.address !== undefined
            ? { address: input.address?.trim() ? input.address.trim() : null }
            : {}),
          ...(input.notes !== undefined
            ? { notes: input.notes?.trim() ? input.notes.trim() : null }
            : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Customer updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the customer right now.")
  }
}

export async function deleteShopCustomerAction(
  shopId: string,
  customerId: string
): Promise<ShopMutationActionResult> {
  if (!shopId || !customerId) {
    return {
      ok: false,
      message: "Customer context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/customers/${customerId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Customer deleted.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to delete the customer right now.")
  }
}

export async function createShopTemplateAction(
  shopId: string,
  input: ShopTemplateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !input.title.trim() || !input.body.trim()) {
    return {
      ok: false,
      message: "Template title and body are required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/templates`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          title: input.title.trim(),
          body: input.body.trim(),
          ...(input.shortcut?.trim() ? { shortcut: input.shortcut.trim() } : {}),
          ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Template created.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to create the template right now.")
  }
}

export async function updateShopTemplateAction(
  shopId: string,
  templateId: string,
  input: ShopTemplateUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !templateId) {
    return {
      ok: false,
      message: "Template context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/templates/${templateId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.body !== undefined ? { body: input.body.trim() } : {}),
          ...(input.shortcut !== undefined
            ? { shortcut: input.shortcut?.trim() ? input.shortcut.trim() : null }
            : {}),
          ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Template updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the template right now.")
  }
}

export async function createShopDeliveryAction(
  shopId: string,
  input: ShopDeliveryInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !input.order_id.trim() || !input.driver_user_id.trim()) {
    return {
      ok: false,
      message: "Order and driver are required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/deliveries`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          order_id: input.order_id.trim(),
          driver_user_id: input.driver_user_id.trim(),
          ...(input.status ? { status: input.status } : {}),
          ...(input.delivery_fee !== undefined
            ? { delivery_fee: input.delivery_fee }
            : {}),
          ...(input.address_snapshot?.trim()
            ? { address_snapshot: input.address_snapshot.trim() }
            : {}),
          ...(input.scheduled_at ? { scheduled_at: input.scheduled_at } : {}),
          ...(input.delivered_at ? { delivered_at: input.delivered_at } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Delivery created.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to create the delivery right now.")
  }
}

export async function updateShopDeliveryAction(
  shopId: string,
  deliveryId: string,
  input: ShopDeliveryUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !deliveryId) {
    return {
      ok: false,
      message: "Delivery context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/deliveries/${deliveryId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.driver_user_id !== undefined
            ? { driver_user_id: input.driver_user_id.trim() }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.delivery_fee !== undefined
            ? { delivery_fee: input.delivery_fee }
            : {}),
          ...(input.address_snapshot !== undefined
            ? {
                address_snapshot: input.address_snapshot?.trim()
                  ? input.address_snapshot.trim()
                  : null,
              }
            : {}),
          ...(input.scheduled_at !== undefined ? { scheduled_at: input.scheduled_at } : {}),
          ...(input.delivered_at !== undefined ? { delivered_at: input.delivered_at } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Delivery updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the delivery right now.")
  }
}

export async function createShopCustomerFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/customers")
  const name = normalizeTextField(formData.get("name"))
  const phone = normalizeTextField(formData.get("phone"))
  const township = normalizeTextField(formData.get("township"))
  const address = normalizeTextField(formData.get("address"))
  const notes = normalizeTextField(formData.get("notes"))
  const shopId = normalizeTextField(formData.get("shop_id"))

  if (!name || !phone) {
    redirectToPath(returnTo, {
      error: "Customer name and phone are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/customers`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          name,
          phone,
          ...(township ? { township } : {}),
          ...(address ? { address } : {}),
          ...(notes ? { notes } : {}),
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Customer saved." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to save the customer right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopCustomerFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/customers")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const customerId = normalizeTextField(formData.get("customer_id"))
  const name = normalizeTextField(formData.get("name"))
  const phone = normalizeTextField(formData.get("phone"))
  const township = normalizeTextField(formData.get("township"))
  const address = normalizeTextField(formData.get("address"))
  const notes = normalizeTextField(formData.get("notes"))

  if (!shopId || !customerId || !name || !phone) {
    redirectToPath(returnTo, {
      error: "Customer name and phone are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/customers/${customerId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          name,
          phone,
          township: township || null,
          address: address || null,
          notes: notes || null,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Customer updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the customer right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function createShopDeliveryFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/deliveries")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const orderId = normalizeTextField(formData.get("order_id"))
  const driverUserId = normalizeTextField(formData.get("driver_user_id"))
  const status = normalizeTextField(formData.get("status"))
  const addressSnapshot = normalizeTextField(formData.get("address_snapshot"))
  const scheduledAt = normalizeDateTimeField(formData.get("scheduled_at"))
  const deliveryFee = normalizeIntegerField(formData.get("delivery_fee"))

  if (!shopId || !orderId || !driverUserId) {
    redirectToPath(returnTo, {
      error: "Order and driver are required to create a delivery.",
    })
  }

  if (deliveryFee !== undefined && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) {
    redirectToPath(returnTo, {
      error: "Delivery fee must be a non-negative integer.",
    })
  }

  if (scheduledAt === null) {
    redirectToPath(returnTo, {
      error: "Scheduled time must be a valid date and time.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/deliveries`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          order_id: orderId,
          driver_user_id: driverUserId,
          ...(status ? { status } : {}),
          ...(addressSnapshot ? { address_snapshot: addressSnapshot } : {}),
          ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
          ...(deliveryFee !== undefined ? { delivery_fee: deliveryFee } : {}),
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Delivery created." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to create the delivery right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopDeliveryFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/deliveries")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const deliveryId = normalizeTextField(formData.get("delivery_id"))
  const status = normalizeTextField(formData.get("status"))

  if (!shopId || !deliveryId || !status) {
    redirectToPath(returnTo, {
      error: "Delivery ID and status are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/deliveries/${deliveryId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          status,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Delivery updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the delivery right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function createShopTemplateFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/templates")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const title = normalizeTextField(formData.get("title"))
  const shortcut = normalizeTextField(formData.get("shortcut"))
  const body = normalizeTextField(formData.get("body"))
  const isActive = normalizeTextField(formData.get("is_active"))

  if (!shopId || !title || !body) {
    redirectToPath(returnTo, {
      error: "Template title and body are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/templates`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          title,
          body,
          ...(shortcut ? { shortcut } : {}),
          is_active: isActive !== "inactive",
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Template created." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to create the template right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopTemplateStateFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/templates")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const templateId = normalizeTextField(formData.get("template_id"))
  const nextState = normalizeTextField(formData.get("is_active"))

  if (!shopId || !templateId || !nextState) {
    redirectToPath(returnTo, {
      error: "Template ID and state are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/templates/${templateId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          is_active: nextState === "true",
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Template updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the template right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopTemplateFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/templates")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const templateId = normalizeTextField(formData.get("template_id"))
  const title = normalizeTextField(formData.get("title"))
  const shortcut = normalizeTextField(formData.get("shortcut"))
  const body = normalizeTextField(formData.get("body"))
  const isActive = normalizeTextField(formData.get("is_active"))

  if (!shopId || !templateId || !title || !body) {
    redirectToPath(returnTo, {
      error: "Template title and body are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/templates/${templateId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          title,
          body,
          shortcut: shortcut || null,
          is_active: isActive !== "inactive",
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Template updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the template right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopProfileFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/settings")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const name = normalizeTextField(formData.get("name"))
  const timezone = normalizeTextField(formData.get("timezone"))

  const payload: Record<string, string> = {}

  if (name) {
    payload.name = name
  }

  if (timezone) {
    payload.timezone = timezone
  }

  if (!shopId || Object.keys(payload).length === 0) {
    redirectToPath(returnTo, {
      error: "Provide at least one shop field to update.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: payload,
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Shop settings updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the shop settings right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateCurrentUserProfileFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/settings")
  const name = normalizeTextField(formData.get("name"))
  const email = normalizeTextField(formData.get("email"))
  const phone = normalizeTextField(formData.get("phone"))
  const locale = normalizeTextField(formData.get("locale"))

  const payload: Record<string, string> = {}

  if (name) {
    payload.name = name
  }

  if (email) {
    payload.email = email
  }

  if (phone) {
    payload.phone = phone
  }

  if (locale) {
    payload.locale = locale
  }

  if (Object.keys(payload).length === 0) {
    redirectToPath(returnTo, {
      error: "Provide at least one profile field to update.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: "/api/v1/users/me",
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: payload,
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Your profile was updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update your profile right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function addShopMemberFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/settings")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const email = normalizeTextField(formData.get("email"))
  const phone = normalizeTextField(formData.get("phone"))
  const name = normalizeTextField(formData.get("name"))
  const roleCode = normalizeTextField(formData.get("role_code"))

  if (!shopId || (!email && !phone)) {
    redirectToPath(returnTo, {
      error: "Provide at least an email or phone number to add a member.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/members`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(name ? { name } : {}),
          role_codes: [roleCode || "staff"],
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Member added to the shop." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to add the member right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function updateShopMemberFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/settings")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const memberId = normalizeTextField(formData.get("member_id"))
  const status = normalizeTextField(formData.get("status"))

  if (!shopId || !memberId || !status) {
    redirectToPath(returnTo, {
      error: "Member ID and status are required.",
    })
  }

  let redirectInput: { notice?: string; error?: string }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/members/${memberId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          status,
        },
      },
    })

    revalidateShopWorkspace()
    redirectInput = { notice: "Member access updated." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(error, "Unable to update the member right now."),
    }
  }

  redirectToPath(returnTo, redirectInput)
}

export async function createInvoiceMmqrSessionFromFormAction(formData: FormData) {
  const returnTo = getReturnTo(formData, "/dashboard/billing")
  const shopId = normalizeTextField(formData.get("shop_id"))
  const invoiceId = normalizeTextField(formData.get("invoice_id"))

  if (!shopId || !invoiceId) {
    redirectToPath(returnTo, {
      error: "Invoice context is missing.",
    })
  }

  let redirectInput: { notice?: string; error?: string }
  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/billing/invoices/${invoiceId}/mmqr-session`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
      },
    })
    revalidateShopWorkspace()
    redirectInput = { notice: "MyanMyanPay payment session is ready." }
  } catch (error) {
    redirectInput = {
      error: toActionMessage(
        error,
        "Unable to create a MyanMyanPay payment session right now."
      ),
    }
  }
  redirectToPath(returnTo, redirectInput)
}

export type ShopMemberInput = {
  name?: string
  email?: string
  phone?: string
  role_ids: string[]
}

export type ShopMemberUpdateInput = {
  status?: "active" | "invited" | "disabled"
  role_ids?: string[]
}

export type ShopRoleInput = {
  name: string
  description?: string | null
  permission_codes: string[]
}

export type ShopRoleUpdateInput = {
  name?: string
  description?: string | null
  permission_codes?: string[]
}

export async function createShopMemberAction(
  shopId: string,
  input: ShopMemberInput
): Promise<ShopMutationActionResult> {
  if (!shopId || (!input.email?.trim() && !input.phone?.trim()) || input.role_ids.length === 0) {
    return {
      ok: false,
      message: "Member contact and at least one role are required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/members`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          ...(input.name?.trim() ? { name: input.name.trim() } : {}),
          ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
          ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
          role_ids: input.role_ids,
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Member added to the shop.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to add the member right now.")
  }
}

export async function updateShopMemberAction(
  shopId: string,
  memberId: string,
  input: ShopMemberUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !memberId) {
    return {
      ok: false,
      message: "Member context is missing.",
    }
  }

  if (input.status === undefined && input.role_ids === undefined) {
    return {
      ok: false,
      message: "Provide a status or role update for the member.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/members/${memberId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.role_ids !== undefined ? { role_ids: input.role_ids } : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Member access updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the member right now.")
  }
}

export async function resendShopMemberInvitationAction(
  shopId: string,
  memberId: string
): Promise<ShopMutationActionResult> {
  if (!shopId || !memberId) {
    return {
      ok: false,
      message: "Member context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/members/${memberId}/invite`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Invitation email sent.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to resend the invitation right now.")
  }
}

export async function createShopRoleAction(
  shopId: string,
  input: ShopRoleInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !input.name.trim() || input.permission_codes.length === 0) {
    return {
      ok: false,
      message: "Role name and at least one permission are required.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/roles`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "POST",
        json: {
          name: input.name.trim(),
          ...(input.description?.trim() ? { description: input.description.trim() } : {}),
          permission_codes: input.permission_codes,
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Custom role created.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to create the role right now.")
  }
}

export async function updateShopRoleAction(
  shopId: string,
  roleId: string,
  input: ShopRoleUpdateInput
): Promise<ShopMutationActionResult> {
  if (!shopId || !roleId) {
    return {
      ok: false,
      message: "Role context is missing.",
    }
  }

  if (
    input.name === undefined &&
    input.description === undefined &&
    input.permission_codes === undefined
  ) {
    return {
      ok: false,
      message: "Provide role details to update.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/roles/${roleId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "PATCH",
        json: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() ? input.description.trim() : null }
            : {}),
          ...(input.permission_codes !== undefined
            ? { permission_codes: input.permission_codes }
            : {}),
        },
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Role updated.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to update the role right now.")
  }
}

export async function deleteShopRoleAction(
  shopId: string,
  roleId: string
): Promise<ShopMutationActionResult> {
  if (!shopId || !roleId) {
    return {
      ok: false,
      message: "Role context is missing.",
    }
  }

  try {
    await requestAuthenticatedActionApiEnvelope({
      path: `/api/v1/shops/${shopId}/roles/${roleId}`,
      preferFreshSession: true,
      requiredAccess: "shop",
      init: {
        method: "DELETE",
      },
    })

    revalidateShopWorkspace()

    return {
      ok: true,
      message: "Role deleted.",
    }
  } catch (error) {
    return toMutationActionError(error, "Unable to delete the role right now.")
  }
}
