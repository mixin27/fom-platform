"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine, Plus, Save, Trash2 } from "lucide-react"

import type { ShopOrder } from "@/lib/shop/api"
import {
  addShopOrderItemAction,
  createShopOrderAction,
  removeShopOrderItemAction,
  updateShopOrderAction,
  updateShopOrderItemAction,
} from "../../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Textarea } from "@workspace/ui/components/textarea"

type ShopOrderSheetProps = {
  shopId: string
  order?: ShopOrder | null
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type EditableItem = {
  id?: string
  product_name: string
  qty: string
  unit_price: string
}

type FieldErrors = Record<string, string[]>

type FormValues = {
  customer_name: string
  customer_phone: string
  customer_township: string
  customer_address: string
  status: "new" | "confirmed"
  source: "manual" | "messenger"
  currency: string
  delivery_fee: string
  note: string
  items: EditableItem[]
  newItem: EditableItem
}

function emptyItem(): EditableItem {
  return {
    product_name: "",
    qty: "1",
    unit_price: "0",
  }
}

function getInitialValues(order?: ShopOrder | null): FormValues {
  return {
    customer_name: order?.customer.name ?? "",
    customer_phone: order?.customer.phone ?? "",
    customer_township: order?.customer.township ?? "",
    customer_address: order?.customer.address ?? "",
    status: order?.status === "confirmed" ? "confirmed" : "new",
    source: order?.source === "messenger" ? "messenger" : "manual",
    currency: order?.currency ?? "MMK",
    delivery_fee: String(order?.delivery_fee ?? 0),
    note: order?.note ?? "",
    items:
      order?.items.map((item) => ({
        id: item.id,
        product_name: item.product_name,
        qty: String(item.qty),
        unit_price: String(item.unit_price),
      })) ?? [emptyItem()],
    newItem: emptyItem(),
  }
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function ShopOrderSheet({
  shopId,
  order,
  triggerLabel,
  triggerVariant = "outline",
}: ShopOrderSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(order))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isEdit = Boolean(order)
  const subtotal = useMemo(
    () =>
      values.items.reduce((sum, item) => {
        const qty = parseInteger(item.qty)
        const unitPrice = parseInteger(item.unit_price)
        if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) {
          return sum
        }

        return sum + qty * unitPrice
      }, 0),
    [values.items]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(order))
    setFieldErrors({})
    setFormError(null)
    setNotice(null)
  }, [order, open])

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateItem(
    index: number,
    key: keyof EditableItem,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }))
  }

  function addDraftItemRow() {
    setValues((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }))
  }

  function removeDraftItemRow(index: number) {
    setValues((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((_, itemIndex) => itemIndex !== index)
          : [emptyItem()],
    }))
  }

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function handleCreate() {
    setFormError(null)
    setFieldErrors({})
    setNotice(null)

    startTransition(async () => {
      const deliveryFee = parseInteger(values.delivery_fee)
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
        setFormError("Delivery fee must be a non-negative integer.")
        return
      }

      const items = values.items
        .map((item) => ({
          product_name: item.product_name.trim(),
          qty: parseInteger(item.qty),
          unit_price: parseInteger(item.unit_price),
        }))
        .filter((item) => item.product_name.length > 0)

      if (
        items.some(
          (item) =>
            !Number.isFinite(item.qty) ||
            item.qty <= 0 ||
            !Number.isFinite(item.unit_price) ||
            item.unit_price < 0
        )
      ) {
        setFormError("Each item requires a valid quantity and unit price.")
        return
      }

      const result = await createShopOrderAction(shopId, {
        customer: {
          name: values.customer_name.trim(),
          phone: values.customer_phone.trim(),
          township: values.customer_township.trim() || null,
          address: values.customer_address.trim() || null,
        },
        items,
        status: values.status,
        source: values.source,
        currency: values.currency.trim() || "MMK",
        delivery_fee: deliveryFee,
        note: values.note.trim() || null,
      })

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  function handleSaveMetadata() {
    if (!order) {
      return
    }

    setFormError(null)
    setFieldErrors({})
    setNotice(null)

    startTransition(async () => {
      const deliveryFee = parseInteger(values.delivery_fee)
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
        setFormError("Delivery fee must be a non-negative integer.")
        return
      }

      const result = await updateShopOrderAction(shopId, order.id, {
        delivery_fee: deliveryFee,
        currency: values.currency.trim() || "MMK",
        source: values.source,
        note: values.note.trim() || null,
      })

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      setNotice(result.message)
      router.refresh()
    })
  }

  function handleSaveItem(index: number) {
    if (!order) {
      return
    }

    const item = values.items[index]
    if (!item?.id) {
      return
    }

    setFormError(null)
    setNotice(null)

    startTransition(async () => {
      const qty = parseInteger(item.qty)
      const unitPrice = parseInteger(item.unit_price)

      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        setFormError("Order items require a valid quantity and unit price.")
        return
      }

      const result = await updateShopOrderItemAction(shopId, order.id, item.id!, {
        product_name: item.product_name.trim(),
        qty,
        unit_price: unitPrice,
      })

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      setNotice(result.message)
      router.refresh()
    })
  }

  function handleRemoveExistingItem(itemId: string) {
    if (!order) {
      return
    }

    setFormError(null)
    setNotice(null)

    startTransition(async () => {
      const result = await removeShopOrderItemAction(shopId, order.id, itemId)

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      setNotice(result.message)
      router.refresh()
    })
  }

  function handleAddItem() {
    if (!order) {
      return
    }

    setFormError(null)
    setNotice(null)

    startTransition(async () => {
      const qty = parseInteger(values.newItem.qty)
      const unitPrice = parseInteger(values.newItem.unit_price)

      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        setFormError("Order items require a valid quantity and unit price.")
        return
      }

      const result = await addShopOrderItemAction(shopId, order.id, {
        product_name: values.newItem.product_name.trim(),
        qty,
        unit_price: unitPrice,
      })

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      setNotice(result.message)
      setValues((current) => ({
        ...current,
        newItem: emptyItem(),
      }))
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant={triggerVariant}>
          {isEdit ? <PencilLine data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {triggerLabel ?? (isEdit ? "Edit" : "Create order")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-l bg-white sm:max-w-2xl">
        <SheetHeader className="border-b border-black/6 pb-4">
          <SheetTitle>{isEdit ? "Edit order" : "Create order"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update order metadata and keep the line items accurate."
              : "Capture a manual order without leaving the owner dashboard."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          {isEdit && order ? (
            <div className="rounded-2xl border border-black/6 bg-[#fcfaf6] p-4 text-sm">
              <p className="font-semibold text-foreground">{order.order_no}</p>
              <p className="mt-1 text-muted-foreground">
                {order.customer.name} · {order.customer.phone}
              </p>
              <p className="mt-1 text-muted-foreground">
                Status: {order.status.replaceAll("_", " ")}
              </p>
            </div>
          ) : null}

          <FieldGroup>
            {!isEdit ? (
              <>
                <Field data-invalid={!!getFieldError("customer.name")}>
                  <FieldLabel htmlFor="shop-order-customer-name">Customer name</FieldLabel>
                  <Input
                    id="shop-order-customer-name"
                    value={values.customer_name}
                    onChange={(event) =>
                      updateValue("customer_name", event.target.value)
                    }
                    aria-invalid={!!getFieldError("customer.name")}
                    placeholder="Daw Aye Aye"
                  />
                  <FieldError>{getFieldError("customer.name")}</FieldError>
                </Field>

                <Field data-invalid={!!getFieldError("customer.phone")}>
                  <FieldLabel htmlFor="shop-order-customer-phone">Customer phone</FieldLabel>
                  <Input
                    id="shop-order-customer-phone"
                    value={values.customer_phone}
                    onChange={(event) =>
                      updateValue("customer_phone", event.target.value)
                    }
                    aria-invalid={!!getFieldError("customer.phone")}
                    placeholder="09 9871 2345"
                  />
                  <FieldError>{getFieldError("customer.phone")}</FieldError>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="shop-order-customer-township">Township</FieldLabel>
                    <Input
                      id="shop-order-customer-township"
                      value={values.customer_township}
                      onChange={(event) =>
                        updateValue("customer_township", event.target.value)
                      }
                      placeholder="Hlaing"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="shop-order-status">Initial status</FieldLabel>
                    <select
                      id="shop-order-status"
                      value={values.status}
                      onChange={(event) =>
                        updateValue("status", event.target.value as "new" | "confirmed")
                      }
                      className="h-10 rounded-xl border border-black/8 bg-white px-3 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="shop-order-customer-address">Address</FieldLabel>
                  <Textarea
                    id="shop-order-customer-address"
                    value={values.customer_address}
                    onChange={(event) =>
                      updateValue("customer_address", event.target.value)
                    }
                    className="min-h-24"
                    placeholder="No. 12, Shwe Taung Gyar St, Hlaing, Yangon"
                  />
                </Field>
              </>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <Field data-invalid={!!getFieldError("delivery_fee")}>
                <FieldLabel htmlFor="shop-order-delivery-fee">Delivery fee</FieldLabel>
                <Input
                  id="shop-order-delivery-fee"
                  value={values.delivery_fee}
                  onChange={(event) => updateValue("delivery_fee", event.target.value)}
                  aria-invalid={!!getFieldError("delivery_fee")}
                  inputMode="numeric"
                />
                <FieldError>{getFieldError("delivery_fee")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("currency")}>
                <FieldLabel htmlFor="shop-order-currency">Currency</FieldLabel>
                <Input
                  id="shop-order-currency"
                  value={values.currency}
                  onChange={(event) => updateValue("currency", event.target.value)}
                  aria-invalid={!!getFieldError("currency")}
                />
                <FieldError>{getFieldError("currency")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("source")}>
                <FieldLabel htmlFor="shop-order-source">Source</FieldLabel>
                <select
                  id="shop-order-source"
                  value={values.source}
                  onChange={(event) =>
                    updateValue("source", event.target.value as "manual" | "messenger")
                  }
                  className="h-10 rounded-xl border border-black/8 bg-white px-3 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="messenger">Messenger</option>
                </select>
                <FieldError>{getFieldError("source")}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!getFieldError("note")}>
              <FieldLabel htmlFor="shop-order-note">Order note</FieldLabel>
              <Textarea
                id="shop-order-note"
                value={values.note}
                onChange={(event) => updateValue("note", event.target.value)}
                aria-invalid={!!getFieldError("note")}
                className="min-h-24"
                placeholder="Deliver after 5pm"
              />
              <FieldDescription>
                Save operational notes that should stay attached to the order.
              </FieldDescription>
              <FieldError>{getFieldError("note")}</FieldError>
            </Field>
          </FieldGroup>

          <div className="rounded-2xl border border-black/6 bg-white">
            <div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
              <div>
                <p className="font-semibold text-foreground">Order items</p>
                <p className="text-xs text-muted-foreground">
                  Subtotal {subtotal.toLocaleString()} {values.currency || "MMK"}
                </p>
              </div>
              {!isEdit ? (
                <Button type="button" size="sm" variant="outline" onClick={addDraftItemRow}>
                  <Plus data-icon="inline-start" />
                  Add row
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 p-4">
              {values.items.map((item, index) => (
                <div
                  key={item.id ?? `draft-${index}`}
                  className="rounded-2xl border border-black/6 bg-[#fcfaf6] p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[1.5fr_0.55fr_0.75fr_auto]">
                    <Input
                      value={item.product_name}
                      onChange={(event) =>
                        updateItem(index, "product_name", event.target.value)
                      }
                      placeholder="Product name"
                    />
                    <Input
                      value={item.qty}
                      onChange={(event) => updateItem(index, "qty", event.target.value)}
                      inputMode="numeric"
                      placeholder="Qty"
                    />
                    <Input
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(index, "unit_price", event.target.value)
                      }
                      inputMode="numeric"
                      placeholder="Unit price"
                    />
                    <div className="flex gap-2">
                      {isEdit && item.id ? (
                        <>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleSaveItem(index)}
                            disabled={isPending}
                            aria-label="Save order item"
                          >
                            <Save />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleRemoveExistingItem(item.id!)}
                            disabled={isPending}
                            aria-label="Remove order item"
                          >
                            <Trash2 />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => removeDraftItemRow(index)}
                          aria-label="Remove draft item"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isEdit ? (
                <div className="rounded-2xl border border-dashed border-black/10 p-3">
                  <p className="mb-3 text-sm font-medium text-foreground">Add new item</p>
                  <div className="grid gap-3 sm:grid-cols-[1.5fr_0.55fr_0.75fr_auto]">
                    <Input
                      value={values.newItem.product_name}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          newItem: {
                            ...current.newItem,
                            product_name: event.target.value,
                          },
                        }))
                      }
                      placeholder="Product name"
                    />
                    <Input
                      value={values.newItem.qty}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          newItem: {
                            ...current.newItem,
                            qty: event.target.value,
                          },
                        }))
                      }
                      inputMode="numeric"
                      placeholder="Qty"
                    />
                    <Input
                      value={values.newItem.unit_price}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          newItem: {
                            ...current.newItem,
                            unit_price: event.target.value,
                          },
                        }))
                      }
                      inputMode="numeric"
                      placeholder="Unit price"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                      disabled={isPending}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {notice}
            </div>
          ) : null}
          {formError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-black/6 px-4 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={isEdit ? handleSaveMetadata : handleCreate}
            disabled={isPending}
          >
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save metadata"
                : "Create order"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
