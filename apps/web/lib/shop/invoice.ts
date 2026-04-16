import { formatCurrency, formatDate } from "../platform/format"
import type { ShopOrder } from "./api"

export function generateOrderInvoiceText(
  order: ShopOrder,
  shopName: string
): string {
  const lines: string[] = []

  lines.push(shopName)
  lines.push("Order Invoice")
  lines.push("")
  lines.push(`Order No: ${order.order_no}`)
  lines.push(`Status: ${order.status.replace(/_/g, " ")}`)
  lines.push(`Date: ${new Date().toLocaleString()}`)
  lines.push("")
  lines.push("Customer")
  lines.push(`Name: ${order.customer.name}`)
  lines.push(`Phone: ${order.customer.phone}`)
  if (order.customer.township)
    lines.push(`Township: ${order.customer.township}`)
  if (order.customer.address) lines.push(`Address: ${order.customer.address}`)
  lines.push("")
  lines.push("Items")

  for (const item of order.items) {
    lines.push(
      `- ${item.product_name} x ${item.qty} · ${formatCurrency(item.line_total, order.currency)}`
    )
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.line_total, 0)

  lines.push("")
  lines.push(`Subtotal: ${formatCurrency(subtotal, order.currency)}`)
  lines.push(
    `Delivery Fee: ${formatCurrency(order.delivery_fee, order.currency)}`
  )
  lines.push(`Total: ${formatCurrency(order.total_price, order.currency)}`)

  if (order.note) {
    lines.push("")
    lines.push("Note")
    lines.push(order.note)
  }

  lines.push("")
  lines.push("---")
  lines.push("Powered by FOM Order Manager")
  lines.push("https://getfom.com")

  return lines.join("\n")
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

export function generateInvoiceFilename(
  order: ShopOrder,
  shopName: string,
  ext: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const safeShopName = slugify(shopName || "shop")
  const safeCustomerName = slugify(order.customer.name || "customer")
  const safeOrderNo = slugify(order.order_no || "order")

  return `${safeOrderNo}-${safeCustomerName}-${safeShopName}-${timestamp}.${ext}`
}
