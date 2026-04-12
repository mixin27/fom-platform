"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import type {
  PlatformPlanOption,
  PlatformSubscription,
} from "@/lib/platform/api"
import {
  updatePlatformSubscriptionAction,
  type PlatformSubscriptionFormInput,
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
import { Switch } from "@workspace/ui/components/switch"

const subscriptionStatusOptions = [
  "trialing",
  "active",
  "overdue",
  "expired",
  "cancelled",
  "inactive",
] as const

type PlatformSubscriptionFormSheetProps = {
  subscription: PlatformSubscription | null
  plans: PlatformPlanOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: (message: string) => void
}

type FieldErrors = Record<string, string[]>

type FormValues = {
  plan_code: string
  status: string
  start_at: string
  end_at: string
  auto_renews: boolean
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : ""
}

function getInitialValues(subscription: PlatformSubscription | null): FormValues {
  return {
    plan_code: subscription?.plan_code ?? "",
    status: subscription?.status ?? "active",
    start_at: toDateInputValue(subscription?.start_at),
    end_at: toDateInputValue(subscription?.end_at),
    auto_renews: subscription?.auto_renews ?? false,
  }
}

export function PlatformSubscriptionFormSheet({
  subscription,
  plans,
  open,
  onOpenChange,
  onCompleted,
}: PlatformSubscriptionFormSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(subscription))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(subscription))
    setFieldErrors({})
    setFormError(null)
  }, [open, subscription])

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSubmit() {
    if (!subscription) {
      setFormError("Subscription context is missing.")
      return
    }

    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const payload: PlatformSubscriptionFormInput = {}

      if (values.plan_code !== subscription.plan_code) {
        payload.plan_code = values.plan_code
      }

      if (values.status !== subscription.status) {
        payload.status = values.status
      }

      if (values.start_at !== toDateInputValue(subscription.start_at)) {
        payload.start_at = toIsoDate(values.start_at)
      }

      if (values.end_at !== toDateInputValue(subscription.end_at)) {
        payload.end_at = values.end_at ? toIsoDate(values.end_at) : null
      }

      if (values.auto_renews !== subscription.auto_renews) {
        payload.auto_renews = values.auto_renews
      }

      if (Object.keys(payload).length === 0) {
        setFormError("No changes to save.")
        return
      }

      const result = await updatePlatformSubscriptionAction(subscription.id, payload)

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] sm:max-w-xl">
        <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <SheetTitle>Edit subscription</SheetTitle>
          <SheetDescription>
            Update the plan, renewal window, and billing state for this shop.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {subscription ? (
            <div className="mb-4 rounded-xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-3.5 py-3 text-sm">
              <p className="font-semibold text-[var(--fom-ink)]">{subscription.shop_name}</p>
              <p className="text-muted-foreground">
                {subscription.owner_name}
                {subscription.owner_email ? ` · ${subscription.owner_email}` : ""}
              </p>
            </div>
          ) : null}

          <FieldGroup>
            <Field data-invalid={!!getFieldError("plan_code")}>
              <FieldLabel>Plan</FieldLabel>
              <Select
                value={values.plan_code}
                onValueChange={(value) => updateValue("plan_code", value)}
              >
                <SelectTrigger aria-invalid={!!getFieldError("plan_code")}>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {plans.map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        {plan.name} · {plan.price.toLocaleString()} {plan.currency}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{getFieldError("plan_code")}</FieldError>
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
                    {subscriptionStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{getFieldError("status")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("start_at")}>
              <FieldLabel htmlFor="subscription-start-at">Start date</FieldLabel>
              <Input
                id="subscription-start-at"
                type="date"
                value={values.start_at}
                onChange={(event) => updateValue("start_at", event.target.value)}
                aria-invalid={!!getFieldError("start_at")}
              />
              <FieldError>{getFieldError("start_at")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("end_at")}>
              <FieldLabel htmlFor="subscription-end-at">End date</FieldLabel>
              <Input
                id="subscription-end-at"
                type="date"
                value={values.end_at}
                onChange={(event) => updateValue("end_at", event.target.value)}
                aria-invalid={!!getFieldError("end_at")}
              />
              <FieldDescription>Leave blank to keep the subscription open-ended.</FieldDescription>
              <FieldError>{getFieldError("end_at")}</FieldError>
            </Field>

            <Field>
              <div className="flex items-center justify-between rounded-xl border border-[var(--fom-border-strong)] px-3 py-3">
                <div className="flex flex-col gap-1">
                  <FieldLabel className="text-sm">Auto renew</FieldLabel>
                  <FieldDescription>
                    Enable automatic renewal on the current billing cadence.
                  </FieldDescription>
                </div>
                <Switch
                  checked={values.auto_renews}
                  onCheckedChange={(checked) => updateValue("auto_renews", checked)}
                />
              </div>
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
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
