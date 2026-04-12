"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine, Plus } from "lucide-react"

import type { ShopTemplate } from "@/lib/shop/api"
import {
  createShopTemplateAction,
  updateShopTemplateAction,
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

type ShopTemplateSheetProps = {
  shopId: string
  template?: ShopTemplate | null
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type FormValues = {
  title: string
  shortcut: string
  body: string
  isActive: boolean
}

type FieldErrors = Record<string, string[]>

function getInitialValues(template?: ShopTemplate | null): FormValues {
  return {
    title: template?.title ?? "",
    shortcut: template?.shortcut ?? "",
    body: template?.body ?? "",
    isActive: template?.is_active ?? true,
  }
}

export function ShopTemplateSheet({
  shopId,
  template,
  triggerLabel,
  triggerVariant = "outline",
}: ShopTemplateSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(template))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = Boolean(template)

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(template))
    setFieldErrors({})
    setFormError(null)
  }, [template, open])

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
      const payload = {
        title: values.title.trim(),
        shortcut: values.shortcut.trim() || null,
        body: values.body.trim(),
        is_active: values.isActive,
      }

      const result = isEdit
        ? await updateShopTemplateAction(shopId, template!.id, payload)
        : await createShopTemplateAction(shopId, payload)

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
          {triggerLabel ?? (isEdit ? "Edit" : "Create template")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-l bg-white sm:max-w-xl">
        <SheetHeader className="border-b border-black/6 pb-4">
          <SheetTitle>{isEdit ? "Edit quick reply" : "Create quick reply"}</SheetTitle>
          <SheetDescription>
            Keep reusable customer messages consistent across confirmations,
            dispatch, and payment follow-up.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <FieldGroup>
            <Field data-invalid={!!getFieldError("title")}>
              <FieldLabel htmlFor="shop-template-title">Template title</FieldLabel>
              <Input
                id="shop-template-title"
                value={values.title}
                onChange={(event) => updateValue("title", event.target.value)}
                aria-invalid={!!getFieldError("title")}
                placeholder="Payment confirmation"
              />
              <FieldError>{getFieldError("title")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("shortcut")}>
              <FieldLabel htmlFor="shop-template-shortcut">Shortcut</FieldLabel>
              <Input
                id="shop-template-shortcut"
                value={values.shortcut}
                onChange={(event) => updateValue("shortcut", event.target.value)}
                aria-invalid={!!getFieldError("shortcut")}
                placeholder="/paid"
              />
              <FieldDescription>
                Optional slash-style shortcut used to find the template quickly.
              </FieldDescription>
              <FieldError>{getFieldError("shortcut")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("body")}>
              <FieldLabel htmlFor="shop-template-body">Message body</FieldLabel>
              <Textarea
                id="shop-template-body"
                value={values.body}
                onChange={(event) => updateValue("body", event.target.value)}
                aria-invalid={!!getFieldError("body")}
                className="min-h-40"
                placeholder="Thanks! We received your payment and will ship tomorrow."
              />
              <FieldError>{getFieldError("body")}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="shop-template-state">Template state</FieldLabel>
              <select
                id="shop-template-state"
                value={values.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  updateValue("isActive", event.target.value === "active")
                }
                className="h-10 rounded-xl border border-black/8 bg-white px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </FieldGroup>

          {formError ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-black/6 px-4 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Create template"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
