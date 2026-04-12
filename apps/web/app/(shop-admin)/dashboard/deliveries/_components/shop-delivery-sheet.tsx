"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine, Plus } from "lucide-react"

import type { ShopDelivery, ShopMember, ShopOrder } from "@/lib/shop/api"
import {
  createShopDeliveryAction,
  updateShopDeliveryAction,
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

type ShopDeliverySheetProps = {
  shopId: string
  delivery?: ShopDelivery | null
  orders: ShopOrder[]
  members: ShopMember[]
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type FormValues = {
  order_id: string
  driver_user_id: string
  status: "scheduled" | "out_for_delivery" | "delivered"
  delivery_fee: string
  address_snapshot: string
  scheduled_at: string
  delivered_at: string
}

type FieldErrors = Record<string, string[]>

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function getInitialValues(delivery?: ShopDelivery | null): FormValues {
  return {
    order_id: delivery?.order_id ?? "",
    driver_user_id: delivery?.driver_user_id ?? "",
    status: (delivery?.status as FormValues["status"]) ?? "scheduled",
    delivery_fee: String(delivery?.delivery_fee ?? delivery?.order.delivery_fee ?? 0),
    address_snapshot:
      delivery?.address_snapshot ?? delivery?.order.customer.address ?? "",
    scheduled_at: toDateTimeLocalValue(delivery?.scheduled_at),
    delivered_at: toDateTimeLocalValue(delivery?.delivered_at),
  }
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function ShopDeliverySheet({
  shopId,
  delivery,
  orders,
  members,
  triggerLabel,
  triggerVariant = "outline",
}: ShopDeliverySheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(delivery))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = Boolean(delivery)

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(delivery))
    setFieldErrors({})
    setFormError(null)
  }, [delivery, open])

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
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

      const scheduledAt = toIsoDateTime(values.scheduled_at)
      const deliveredAt = toIsoDateTime(values.delivered_at)

      if (values.scheduled_at && !scheduledAt) {
        setFormError("Scheduled time is invalid.")
        return
      }

      if (values.delivered_at && !deliveredAt) {
        setFormError("Delivered time is invalid.")
        return
      }

      const payload = {
        driver_user_id: values.driver_user_id.trim(),
        status: values.status,
        delivery_fee: deliveryFee,
        address_snapshot: values.address_snapshot.trim() || null,
        scheduled_at: scheduledAt,
        delivered_at: deliveredAt,
      }

      const result = isEdit
        ? await updateShopDeliveryAction(shopId, delivery!.id, payload)
        : await createShopDeliveryAction(shopId, {
            order_id: values.order_id.trim(),
            ...payload,
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant={triggerVariant}>
          {isEdit ? <PencilLine data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {triggerLabel ?? (isEdit ? "Edit" : "Create delivery")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] sm:max-w-xl">
        <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <SheetTitle>{isEdit ? "Edit delivery" : "Create delivery"}</SheetTitle>
          <SheetDescription>
            Assign a rider, keep route timing accurate, and sync the underlying
            order status cleanly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {isEdit && delivery ? (
            <div className="mb-4 rounded-2xl border border-[var(--fom-border-strong)] bg-[var(--fom-surface-variant)] p-4 text-sm">
              <p className="font-semibold text-foreground">{delivery.order.order_no}</p>
              <p className="mt-1 text-muted-foreground">
                {delivery.order.customer.name} · {delivery.order.customer.phone}
              </p>
            </div>
          ) : null}

          <FieldGroup>
            {!isEdit ? (
              <Field data-invalid={!!getFieldError("order_id")}>
                <FieldLabel htmlFor="shop-delivery-order">Order</FieldLabel>
                <select
                  id="shop-delivery-order"
                  value={values.order_id}
                  onChange={(event) => updateValue("order_id", event.target.value)}
                  className="h-10 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
                >
                  <option value="">Select confirmed order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_no} · {order.customer.name}
                    </option>
                  ))}
                </select>
                <FieldError>{getFieldError("order_id")}</FieldError>
              </Field>
            ) : null}

            <Field data-invalid={!!getFieldError("driver_user_id")}>
              <FieldLabel htmlFor="shop-delivery-driver">Driver</FieldLabel>
              <select
                id="shop-delivery-driver"
                value={values.driver_user_id}
                onChange={(event) => updateValue("driver_user_id", event.target.value)}
                className="h-10 rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] px-3 text-sm"
              >
                <option value="">Assign driver</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
              <FieldError>{getFieldError("driver_user_id")}</FieldError>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!getFieldError("status")}>
                <FieldLabel htmlFor="shop-delivery-status">Status</FieldLabel>
                <select
                  id="shop-delivery-status"
                  value={values.status}
                  onChange={(event) =>
                    updateValue(
                      "status",
                      event.target.value as FormValues["status"]
                    )
                  }
                  className="h-10 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
                <FieldError>{getFieldError("status")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("delivery_fee")}>
                <FieldLabel htmlFor="shop-delivery-fee">Delivery fee</FieldLabel>
                <Input
                  id="shop-delivery-fee"
                  value={values.delivery_fee}
                  onChange={(event) => updateValue("delivery_fee", event.target.value)}
                  inputMode="numeric"
                  aria-invalid={!!getFieldError("delivery_fee")}
                />
                <FieldError>{getFieldError("delivery_fee")}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!getFieldError("address_snapshot")}>
              <FieldLabel htmlFor="shop-delivery-address">Address snapshot</FieldLabel>
              <Textarea
                id="shop-delivery-address"
                value={values.address_snapshot}
                onChange={(event) =>
                  updateValue("address_snapshot", event.target.value)
                }
                className="min-h-28"
                aria-invalid={!!getFieldError("address_snapshot")}
                placeholder="Delivery address snapshot"
              />
              <FieldDescription>
                Keep a delivery-side snapshot if the order address later changes.
              </FieldDescription>
              <FieldError>{getFieldError("address_snapshot")}</FieldError>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!getFieldError("scheduled_at")}>
                <FieldLabel htmlFor="shop-delivery-scheduled-at">Scheduled at</FieldLabel>
                <Input
                  id="shop-delivery-scheduled-at"
                  type="datetime-local"
                  value={values.scheduled_at}
                  onChange={(event) =>
                    updateValue("scheduled_at", event.target.value)
                  }
                  aria-invalid={!!getFieldError("scheduled_at")}
                />
                <FieldError>{getFieldError("scheduled_at")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("delivered_at")}>
                <FieldLabel htmlFor="shop-delivery-delivered-at">Delivered at</FieldLabel>
                <Input
                  id="shop-delivery-delivered-at"
                  type="datetime-local"
                  value={values.delivered_at}
                  onChange={(event) =>
                    updateValue("delivered_at", event.target.value)
                  }
                  aria-invalid={!!getFieldError("delivered_at")}
                />
                <FieldError>{getFieldError("delivered_at")}</FieldError>
              </Field>
            </div>
          </FieldGroup>

          {formError ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-[var(--fom-border-subtle)] px-4 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Create delivery"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
