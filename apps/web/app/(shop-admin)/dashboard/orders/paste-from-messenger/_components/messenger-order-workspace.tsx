"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquareText,
  Plus,
  Trash2,
} from "lucide-react"

import type {
  ShopParsedOrderDraftInput,
  ShopParsedOrderResult,
} from "@/app/(shop-admin)/dashboard/actions"
import {
  createShopOrderFromParsedDraftAction,
  parseShopOrderMessageAction,
} from "@/app/(shop-admin)/dashboard/actions"
import { PlatformStatusBadge } from "@/components/platform/platform-status-badge"
import { formatCurrency, formatPercent } from "@/lib/platform/format"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

type MessengerOrderWorkspaceProps = {
  shopId: string
  canUseParser: boolean
}

function toDraft(result: ShopParsedOrderResult): ShopParsedOrderDraftInput {
  return {
    customer: {
      name: result.suggested_order.customer.name ?? "",
      phone: result.suggested_order.customer.phone ?? "",
      township: result.suggested_order.customer.township ?? "",
      address: result.suggested_order.customer.address ?? "",
    },
    items:
      result.suggested_order.items.length > 0
        ? result.suggested_order.items.map((item) => ({
            product_name: item.product_name ?? "",
            qty: item.qty ?? 1,
            unit_price: item.unit_price ?? 0,
          }))
        : [
            {
              product_name: "",
              qty: 1,
              unit_price: 0,
            },
          ],
    delivery_fee: result.suggested_order.delivery_fee ?? 0,
    currency: result.suggested_order.currency,
    status: result.suggested_order.status,
    source: "messenger",
    note: result.suggested_order.note ?? "",
  }
}

function emptyDraft(): ShopParsedOrderDraftInput {
  return {
    customer: {
      name: "",
      phone: "",
      township: "",
      address: "",
    },
    items: [
      {
        product_name: "",
        qty: 1,
        unit_price: 0,
      },
    ],
    delivery_fee: 0,
    currency: "MMK",
    status: "new",
    source: "messenger",
    note: "",
  }
}

export function MessengerOrderWorkspace({
  shopId,
  canUseParser,
}: MessengerOrderWorkspaceProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdNotice, setCreatedNotice] = useState<string | null>(null)
  const [createdOrderNo, setCreatedOrderNo] = useState<string | null>(null)
  const [result, setResult] = useState<ShopParsedOrderResult | null>(null)
  const [draft, setDraft] = useState<ShopParsedOrderDraftInput>(emptyDraft)

  function updateCustomerField<
    K extends keyof ShopParsedOrderDraftInput["customer"],
  >(key: K, value: ShopParsedOrderDraftInput["customer"][K]) {
    setDraft((current) => ({
      ...current,
      customer: {
        ...current.customer,
        [key]: value,
      },
    }))
  }

  function updateItemField(
    index: number,
    key: keyof ShopParsedOrderDraftInput["items"][number],
    value: string | number
  ) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]:
                key === "qty" || key === "unit_price"
                  ? Number(value) || 0
                  : String(value),
            }
          : item
      ),
    }))
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          product_name: "",
          qty: 1,
          unit_price: 0,
        },
      ],
    }))
  }

  function removeItem(index: number) {
    setDraft((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function handleParse() {
    setParseError(null)
    setCreateError(null)
    setCreatedNotice(null)

    startTransition(async () => {
      const response = await parseShopOrderMessageAction(shopId, message)

      if (!response.ok) {
        setParseError(response.message)
        setResult(null)
        setDraft(emptyDraft())
        return
      }

      setResult(response.data)
      setDraft(toDraft(response.data))
    })
  }

  function handleCreate() {
    setCreateError(null)
    setCreatedNotice(null)

    startTransition(async () => {
      const response = await createShopOrderFromParsedDraftAction(shopId, draft)

      if (!response.ok) {
        setCreateError(response.message)
        return
      }

      setCreatedNotice(response.message ?? "Order created.")
      setCreatedOrderNo(response.data.order_no)
    })
  }

  const subtotal = draft.items.reduce(
    (sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.unit_price),
    0
  )
  const total = subtotal + Math.max(0, draft.delivery_fee)

  if (!canUseParser) {
    return (
      <Card className="border border-black/6 bg-white shadow-none">
        <CardHeader>
          <CardDescription>Access restricted</CardDescription>
          <CardTitle>Orders write permission is required</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Your current shop role can view orders, but it cannot parse Messenger messages into new orders.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="border border-black/6 bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Source message</CardDescription>
          <CardTitle>Paste Messenger conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`Name: Daw Khin Myat\nPhone: 09 7812 3456\nAddress: No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon\nProduct: Silk Longyi Set (Green, Size M)\nQty: 2\nPrice: 18,000 MMK\nDeli: 3,000`}
            className="min-h-[320px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleParse} disabled={isPending}>
              <MessageSquareText data-icon="inline-start" />
              Parse message
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMessage("")
                setParseError(null)
                setCreateError(null)
                setCreatedNotice(null)
                setCreatedOrderNo(null)
                setResult(null)
                setDraft(emptyDraft())
              }}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
          {parseError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {parseError}
            </div>
          ) : null}
          {createdNotice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
              {createdNotice}
              {createdOrderNo ? ` ${createdOrderNo}.` : ""}
            </div>
          ) : null}
          {createError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {createError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Card className="border border-black/6 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Draft review</CardDescription>
            <CardTitle>Parsed order draft</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {result ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <PlatformStatusBadge
                    status={result.parse_meta.is_ready_to_create ? "active" : "pending"}
                    label={
                      result.parse_meta.is_ready_to_create
                        ? "Ready to create"
                        : "Needs review"
                    }
                  />
                  <PlatformStatusBadge
                    status={result.customer_match ? "active" : "pending"}
                    label={
                      result.customer_match ? "Customer match found" : "No customer match"
                    }
                  />
                  <PlatformStatusBadge
                    status="confirmed"
                    label={`Confidence ${formatPercent(result.parse_meta.confidence)}`}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={draft.customer.name}
                    onChange={(event) =>
                      updateCustomerField("name", event.target.value)
                    }
                    placeholder="Customer name"
                    className="h-9"
                  />
                  <Input
                    value={draft.customer.phone}
                    onChange={(event) =>
                      updateCustomerField("phone", event.target.value)
                    }
                    placeholder="Phone"
                    className="h-9"
                  />
                  <Input
                    value={draft.customer.township}
                    onChange={(event) =>
                      updateCustomerField("township", event.target.value)
                    }
                    placeholder="Township"
                    className="h-9"
                  />
                  <Input
                    value={draft.currency}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    placeholder="Currency"
                    className="h-9"
                  />
                </div>
                <Input
                  value={draft.customer.address}
                  onChange={(event) =>
                    updateCustomerField("address", event.target.value)
                  }
                  placeholder="Address"
                  className="h-9"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value as "new" | "confirmed",
                      }))
                    }
                    className="h-9 rounded-xl border border-black/8 bg-white px-3 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                  <Input
                    value={String(draft.delivery_fee)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        delivery_fee: Number(event.target.value) || 0,
                      }))
                    }
                    placeholder="Delivery fee"
                    className="h-9"
                  />
                </div>
                <Textarea
                  value={draft.note}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Internal note"
                  className="min-h-[84px]"
                />

                <div className="flex flex-col gap-2">
                  {draft.items.map((item, index) => (
                    <div
                      key={`${index}-${item.product_name}`}
                      className="rounded-2xl border border-black/6 bg-[#fcfbf9] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Item {index + 1}
                        </p>
                        {draft.items.length > 1 ? (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        <Input
                          value={item.product_name}
                          onChange={(event) =>
                            updateItemField(index, "product_name", event.target.value)
                          }
                          placeholder="Product name"
                          className="h-9"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            value={String(item.qty)}
                            onChange={(event) =>
                              updateItemField(index, "qty", event.target.value)
                            }
                            placeholder="Qty"
                            className="h-9"
                          />
                          <Input
                            value={String(item.unit_price)}
                            onChange={(event) =>
                              updateItemField(index, "unit_price", event.target.value)
                            }
                            placeholder="Unit price"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={addItem}>
                    <Plus data-icon="inline-start" />
                    Add item
                  </Button>
                  <Button type="button" onClick={handleCreate} disabled={isPending}>
                    <CheckCircle2 data-icon="inline-start" />
                    Create order from draft
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Parse a Messenger conversation to review the extracted customer, items, warnings, and ready-to-create status here.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 xl:grid-cols-2">
          <Card className="border border-black/6 bg-white shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Diagnostics</CardDescription>
              <CardTitle>Parse signals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {result ? (
                <>
                  <div className="rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Totals
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Subtotal {formatCurrency(subtotal)} · Total {formatCurrency(total)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Matched fields
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.parse_meta.matched_fields.map((field) => (
                        <PlatformStatusBadge key={field} status="active" label={field} />
                      ))}
                    </div>
                  </div>

                  {result.customer_match ? (
                    <div className="rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Existing customer
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {result.customer_match.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.customer_match.phone}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Confidence, matched fields, and customer match signals will appear here after parsing.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-black/6 bg-white shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Warnings</CardDescription>
              <CardTitle>Uncertain or unparsed content</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {result ? (
                <>
                  {result.parse_meta.warnings.length > 0 ? (
                    result.parse_meta.warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      >
                        <AlertTriangle className="mr-2 inline size-4 align-text-bottom" />
                        {warning}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      No parse warnings.
                    </div>
                  )}

                  {result.parse_meta.unparsed_lines.length > 0 ? (
                    <div className="rounded-2xl border border-black/6 bg-[#fcfbf9] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Unparsed lines
                      </p>
                      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                        {result.parse_meta.unparsed_lines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Parse warnings and leftover lines will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {createdOrderNo ? (
          <Card className="border border-black/6 bg-white shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>Next step</CardDescription>
              <CardTitle>Continue in the order workspace</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline">
                <Link href="/dashboard/orders">Return to orders</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
