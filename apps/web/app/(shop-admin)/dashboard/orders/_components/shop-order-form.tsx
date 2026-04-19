"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import type { ShopOrder } from "@/lib/shop/api"
import {
  createShopOrderAction,
  updateShopOrderAction,
  addShopOrderItemAction,
  updateShopOrderItemAction,
  removeShopOrderItemAction,
} from "../../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

type EditableItem = {
  id?: string
  product_name: string
  qty: string
  unit_price: string
}

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

interface ShopOrderFormProps {
  shopId: string
  order?: ShopOrder | null
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function ShopOrderForm({
  shopId,
  order,
  mode,
  onSuccess,
}: ShopOrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(order))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode === "edit"

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateItem(index: number, key: keyof EditableItem, value: string) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }))
  }

  function addEmptyRow() {
    setValues((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }))
  }

  function removeRow(index: number) {
    setValues((current) => ({
      ...current,
      items: current.items.length > 1 
        ? current.items.filter((_, i) => i !== index)
        : [emptyItem()],
    }))
  }

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const deliveryFee = parseInteger(values.delivery_fee)
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
        setFormError("Delivery fee must be a non-negative integer.")
        return
      }

      if (isEdit && order) {
        // In edit mode, we only update metadata here. Items are handled separately in the original sheet logic,
        // but for a dedicated edit page, we might want to sync all.
        // For now, let's stick to the existing action structure which updates metadata.
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
      } else {
        const items = values.items
          .map((item) => ({
            product_name: item.product_name.trim(),
            qty: parseInteger(item.qty),
            unit_price: parseInteger(item.unit_price),
          }))
          .filter((item) => item.product_name.length > 0)

        if (items.length === 0) {
          setFormError("At least one order item is required.")
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
      }

      router.refresh()
      onSuccess?.()
      if (!onSuccess) {
        router.push("/dashboard/orders")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        {!isEdit && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!getFieldError("customer.name")}>
              <FieldLabel>Customer Name</FieldLabel>
              <Input
                value={values.customer_name}
                onChange={(e) => updateValue("customer_name", e.target.value)}
                placeholder="Required"
                className="h-10"
              />
              <FieldError>{getFieldError("customer.name")}</FieldError>
            </Field>
            <Field data-invalid={!!getFieldError("customer.phone")}>
              <FieldLabel>Phone Number</FieldLabel>
              <Input
                value={values.customer_phone}
                onChange={(e) => updateValue("customer_phone", e.target.value)}
                placeholder="Required"
                className="h-10"
              />
              <FieldError>{getFieldError("customer.phone")}</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Delivery Address</FieldLabel>
              <Textarea
                value={values.customer_address}
                onChange={(e) => updateValue("customer_address", e.target.value)}
                placeholder="Full address for rider"
                className="min-h-[80px]"
              />
            </Field>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <select
              value={values.status}
              onChange={(e) => updateValue("status", e.target.value as any)}
              className="h-10 rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-3 text-[13px] font-medium"
            >
              <option value="new">New Order</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </Field>
          <Field>
            <FieldLabel>Delivery Fee</FieldLabel>
            <Input
              value={values.delivery_fee}
              onChange={(e) => updateValue("delivery_fee", e.target.value)}
              className="h-10"
            />
          </Field>
          <Field>
            <FieldLabel>Currency</FieldLabel>
            <Input
              value={values.currency}
              onChange={(e) => updateValue("currency", e.target.value)}
              className="h-10"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Note</FieldLabel>
          <Textarea
            value={values.note}
            onChange={(e) => updateValue("note", e.target.value)}
            placeholder="Operational notes..."
            className="min-h-[60px]"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--fom-border-subtle)]/50 pb-2">
          <h3 className="text-sm font-bold">Line Items</h3>
          {!isEdit && (
            <Button type="button" size="sm" variant="outline" onClick={addEmptyRow} className="h-8">
              <PlusIcon data-icon="inline-start" />
              Add Item
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {values.items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-start bg-muted/20 p-2 rounded-xl border border-[var(--fom-border-subtle)]">
              <Input
                value={item.product_name}
                onChange={(e) => updateItem(index, "product_name", e.target.value)}
                placeholder="Product"
                className="h-9 text-[13px]"
              />
              <Input
                value={item.qty}
                onChange={(e) => updateItem(index, "qty", e.target.value)}
                placeholder="Qty"
                inputMode="numeric"
                className="h-9 text-[13px]"
              />
              <Input
                value={item.unit_price}
                onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                placeholder="Price"
                inputMode="numeric"
                className="h-9 text-[13px]"
              />
              <Button 
                type="button" 
                size="icon-sm" 
                variant="ghost" 
                className="h-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(index)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {formError && (
        <p className="text-[13px] font-bold text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20">
          {formError}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={isPending} className="h-11 font-bold">
        {isPending ? "Processing..." : isEdit ? "Update Order" : "Record Order"}
      </Button>
    </div>
  )
}
