"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import type {
  PlatformInvoice,
  PlatformSubscription,
} from "@/lib/platform/api"
import {
  createPlatformInvoiceAction,
  updatePlatformInvoiceAction,
  type PlatformInvoiceFormInput,
} from "../actions"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

const invoiceStatusOptions = ["pending", "paid", "overdue", "failed"] as const

type PlatformInvoiceFormSheetProps = {
  mode: "create" | "edit"
  subscription?: PlatformSubscription | null
  invoice?: PlatformInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: (message: string) => void
}

type FieldErrors = Record<string, string[]>

type FormValues = {
  amount: string
  currency: string
  status: string
  payment_method: string
  provider_ref: string
  due_at: string
  paid_at: string
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : ""
}

function getInitialValues(
  mode: "create" | "edit",
  subscription?: PlatformSubscription | null,
  invoice?: PlatformInvoice | null
): FormValues {
  if (mode === "edit" && invoice) {
    return {
      amount: String(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      payment_method: invoice.payment_method ?? "",
      provider_ref: invoice.provider_ref ?? "",
      due_at: toDateInputValue(invoice.due_at),
      paid_at: toDateInputValue(invoice.paid_at),
    }
  }

  return {
    amount: subscription ? String(subscription.plan_price) : "",
    currency: subscription?.plan_currency ?? "MMK",
    status: "pending",
    payment_method: "",
    provider_ref: "",
    due_at: toDateInputValue(subscription?.end_at),
    paid_at: "",
  }
}

export function PlatformInvoiceFormSheet({
  mode,
  subscription,
  invoice,
  open,
  onOpenChange,
  onCompleted,
}: PlatformInvoiceFormSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(
    getInitialValues(mode, subscription, invoice)
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(mode, subscription, invoice))
    setFieldErrors({})
    setFormError(null)
  }, [open, mode, subscription, invoice])

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function buildPayload(): PlatformInvoiceFormInput {
    const payload: PlatformInvoiceFormInput = {
      status: values.status,
      currency: values.currency.trim() || undefined,
      payment_method: values.payment_method.trim() || null,
      provider_ref: values.provider_ref.trim() || null,
      due_at: values.due_at ? toIsoDate(values.due_at) : null,
      paid_at: values.paid_at ? toIsoDate(values.paid_at) : null,
    }

    if (values.amount.trim().length > 0) {
      payload.amount = Number(values.amount)
    }

    return payload
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const payload = buildPayload()

      const result =
        mode === "create"
          ? subscription
            ? await createPlatformInvoiceAction(subscription.id, payload)
            : {
                ok: false as const,
                message: "Subscription context is missing.",
              }
          : invoice
            ? await updatePlatformInvoiceAction(invoice.id, payload)
            : {
                ok: false as const,
                message: "Invoice context is missing.",
              }

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      onOpenChange(false)
      onCompleted(result.message)
      router.refresh()
    })
  }

  const title = mode === "create" ? "Create invoice" : "Edit invoice"
  const description =
    mode === "create"
      ? "Create a billing record for the selected subscription."
      : "Update payment status, references, and billing dates."

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] sm:max-w-xl">
        <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {subscription ? (
            <div className="mb-4 rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-3.5 py-3 text-sm">
              <p className="font-semibold text-[var(--fom-ink)]">{subscription.shop_name}</p>
              <p className="text-muted-foreground">
                {subscription.plan_name} · {subscription.owner_name}
              </p>
            </div>
          ) : null}

          <FieldGroup>
            <Field data-invalid={!!getFieldError("amount")}>
              <FieldLabel htmlFor="invoice-amount">Amount</FieldLabel>
              <Input
                id="invoice-amount"
                type="number"
                min="0"
                value={values.amount}
                onChange={(event) => updateValue("amount", event.target.value)}
                aria-invalid={!!getFieldError("amount")}
              />
              <FieldError>{getFieldError("amount")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("currency")}>
              <FieldLabel htmlFor="invoice-currency">Currency</FieldLabel>
              <Input
                id="invoice-currency"
                value={values.currency}
                onChange={(event) => updateValue("currency", event.target.value)}
                aria-invalid={!!getFieldError("currency")}
              />
              <FieldError>{getFieldError("currency")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("status")}>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={values.status}
                onValueChange={(value) => updateValue("status", value)}
              >
                <SelectTrigger aria-invalid={!!getFieldError("status")}>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {invoiceStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{getFieldError("status")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("payment_method")}>
              <FieldLabel htmlFor="invoice-method">Payment method</FieldLabel>
              <Input
                id="invoice-method"
                value={values.payment_method}
                onChange={(event) => updateValue("payment_method", event.target.value)}
                aria-invalid={!!getFieldError("payment_method")}
                placeholder="KBZPay"
              />
              <FieldError>{getFieldError("payment_method")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("provider_ref")}>
              <FieldLabel htmlFor="invoice-provider-ref">Provider reference</FieldLabel>
              <Input
                id="invoice-provider-ref"
                value={values.provider_ref}
                onChange={(event) => updateValue("provider_ref", event.target.value)}
                aria-invalid={!!getFieldError("provider_ref")}
                placeholder="KBZ-20260407-001"
              />
              <FieldError>{getFieldError("provider_ref")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("due_at")}>
              <FieldLabel htmlFor="invoice-due-at">Due date</FieldLabel>
              <Input
                id="invoice-due-at"
                type="date"
                value={values.due_at}
                onChange={(event) => updateValue("due_at", event.target.value)}
                aria-invalid={!!getFieldError("due_at")}
              />
              <FieldDescription>Leave blank if this invoice does not have a due date.</FieldDescription>
              <FieldError>{getFieldError("due_at")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("paid_at")}>
              <FieldLabel htmlFor="invoice-paid-at">Paid date</FieldLabel>
              <Input
                id="invoice-paid-at"
                type="date"
                value={values.paid_at}
                onChange={(event) => updateValue("paid_at", event.target.value)}
                aria-invalid={!!getFieldError("paid_at")}
              />
              <FieldDescription>Set this when the invoice has already been collected.</FieldDescription>
              <FieldError>{getFieldError("paid_at")}</FieldError>
            </Field>
          </FieldGroup>

          {formError ? (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-[var(--fom-border-subtle)] bg-muted/10">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create invoice"
                  : "Save invoice"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
