"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { AuthApiError } from "@/lib/auth/api"
import { requestAuthenticatedActionApiEnvelope } from "@/lib/auth/request"

function revalidateShopWorkspace() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
  revalidatePath("/dashboard/customers")
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
