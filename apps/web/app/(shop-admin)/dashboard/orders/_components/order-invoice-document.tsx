"use client"

import React from "react"
import { formatCurrency, formatDate } from "@/lib/platform/format"
import type { ShopOrder } from "@/lib/shop/api"

type OrderInvoiceDocumentProps = {
  order: ShopOrder
  shopName: string
}

export const OrderInvoiceDocument = React.forwardRef<
  HTMLDivElement,
  OrderInvoiceDocumentProps
>(({ order, shopName }, ref) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.line_total, 0)

  return (
    <div
      ref={ref}
      className="bg-white p-12 text-slate-900 shadow-sm"
      style={{
        width: "800px",
        minHeight: "1131px", // A4 ratio approximately
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header Section */}
      <div className="flex justify-between border-b-2 border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f4622a]">
            {shopName}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Official Invoice
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Invoice No.
            </span>
            <span className="text-lg font-bold text-slate-900">
              {order.order_no}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 text-sm text-slate-500">
            <span>{formatDate(new Date().toISOString())}</span>
          </div>
          <div className="mt-2 text-right">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                order.status === "delivered"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="mt-10 grid grid-cols-2 gap-12">
        {/* Billing Column */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bill To
          </h2>
          <div className="mt-3 space-y-1">
            <p className="text-base font-bold text-slate-900">
              {order.customer.name}
            </p>
            <p className="text-sm text-slate-600">{order.customer.phone}</p>
          </div>
        </div>

        {/* Shipping Column */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ship To
          </h2>
          <div className="mt-3 space-y-1">
            {order.customer.township && (
              <p className="text-sm font-medium text-slate-700">
                {order.customer.township}
              </p>
            )}
            {order.customer.address ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                {order.customer.address}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400">
                No address provided
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-12">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="pb-4 pr-4 font-bold">Item Description</th>
              <th className="pb-4 px-4 text-center font-bold">Qty</th>
              <th className="pb-4 px-4 text-right font-bold">Price</th>
              <th className="pb-4 pl-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <tr key={index} className="group">
                <td className="py-5 pr-4">
                  <p className="text-sm font-bold text-slate-800">
                    {item.product_name}
                  </p>
                </td>
                <td className="py-5 px-4 text-center text-sm text-slate-600">
                  {item.qty}
                </td>
                <td className="py-5 px-4 text-right text-sm text-slate-600">
                  {formatCurrency(item.unit_price, order.currency)}
                </td>
                <td className="py-5 pl-4 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(item.line_total, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mt-8 flex justify-end">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium text-slate-800">
              {formatCurrency(subtotal, order.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Delivery Fee</span>
            <span className="font-medium text-slate-800">
              {formatCurrency(order.delivery_fee, order.currency)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Total</span>
              <span className="text-xl font-black text-[#f4622a]">
                {formatCurrency(order.total_price, order.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Note Section */}
      {order.note && (
        <div className="mt-12 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Note
          </h2>
          <p className="mt-2 text-sm italic text-slate-600 leading-relaxed">
            "{order.note}"
          </p>
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-auto pt-24">
        <div className="flex flex-col items-center justify-center border-t border-slate-100 pt-8 text-center">
          <p className="text-sm font-bold text-slate-800">
            Thank you for shopping with us!
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 grayscale opacity-50 contrast-125">
             <img src="/brand/png/logo-mark.png" alt="FOM" className="h-5 w-5 object-contain" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Powered by FOM Order Manager · getfom.com
             </p>
          </div>
        </div>
      </div>
    </div>
  )
})

OrderInvoiceDocument.displayName = "OrderInvoiceDocument"
