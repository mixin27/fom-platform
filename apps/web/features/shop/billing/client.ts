"use client"

import type { ShopBilling, ShopBillingInvoiceDetail } from "@/lib/shop/api"

import { clientApiRequest } from "@/features/shared/client/api-client"

export type ShopBillingWorkspaceData = {
  billing: ShopBilling
  plans: ShopBilling["plans"]
}

export function getShopBillingWorkspaceQueryKey() {
  return ["shop", "billing"] as const
}

export function getShopBillingInvoiceQueryKey(invoiceId: string) {
  return ["shop", "billing", "invoice", invoiceId] as const
}

export function fetchShopBillingWorkspace() {
  return clientApiRequest<ShopBillingWorkspaceData>("/api/shop/billing")
}

export function createShopSubscriptionInvoice(planCode: string) {
  return clientApiRequest<ShopBilling["invoices"][number]>(
    "/api/shop/billing/subscriptions",
    {
      method: "POST",
      json: { planCode },
    }
  )
}

export function fetchShopBillingInvoice(invoiceId: string) {
  return clientApiRequest<ShopBillingInvoiceDetail>(
    `/api/shop/billing/invoices/${invoiceId}`
  )
}

export function createShopBillingInvoiceMmqrSession(invoiceId: string) {
  return clientApiRequest<ShopBillingInvoiceDetail>(
    `/api/shop/billing/invoices/${invoiceId}/mmqr-session`,
    {
      method: "POST",
    }
  )
}
