"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SaveIcon, Trash2Icon } from "lucide-react"

import type { ShopCustomer } from "@/lib/shop/api"
import {
  createShopCustomerAction,
  deleteShopCustomerAction,
  updateShopCustomerAction,
} from "../../actions"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"

type FormValues = {
  name: string
  phone: string
  township: string
  address: string
  notes: string
}

function getInitialValues(customer?: ShopCustomer | null): FormValues {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    township: customer?.township ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  }
}

interface ShopCustomerFormProps {
  shopId: string
  customer?: ShopCustomer | null
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function ShopCustomerForm({
  shopId,
  customer,
  mode,
  onSuccess,
}: ShopCustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [values, setValues] = useState<FormValues>(getInitialValues(customer))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode === "edit"
  const canDelete = Boolean(customer && customer.total_orders === 0)

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
        name: values.name.trim(),
        phone: values.phone.trim(),
        township: values.township.trim() || null,
        address: values.address.trim() || null,
        notes: values.notes.trim() || null,
      }

      const result = isEdit
        ? await updateShopCustomerAction(shopId, customer!.id, payload)
        : await createShopCustomerAction(shopId, payload)

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      router.refresh()
      onSuccess?.()
      if (!onSuccess) {
        router.push("/dashboard/customers")
      }
    })
  }

  function handleDelete() {
    if (!customer) return

    setFormError(null)
    startTransition(async () => {
      const result = await deleteShopCustomerAction(shopId, customer.id)
      if (!result.ok) {
        setFormError(result.message)
        setDeleteDialogOpen(false)
        return
      }
      setDeleteDialogOpen(false)
      router.push("/dashboard/customers")
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-invalid={!!getFieldError("name")}>
            <FieldLabel>Customer Name</FieldLabel>
            <Input
              value={values.name}
              onChange={(e) => updateValue("name", e.target.value)}
              placeholder="e.g. Daw Aye Aye"
              className="h-11"
            />
            <FieldError>{getFieldError("name")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("phone")}>
            <FieldLabel>Phone Number</FieldLabel>
            <Input
              value={values.phone}
              onChange={(e) => updateValue("phone", e.target.value)}
              placeholder="09..."
              className="h-11 font-mono"
            />
            <FieldDescription>Stays as the identifier for repeat matching.</FieldDescription>
            <FieldError>{getFieldError("phone")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("township")}>
            <FieldLabel>Township</FieldLabel>
            <Input
              value={values.township}
              onChange={(e) => updateValue("township", e.target.value)}
              placeholder="e.g. Hlaing"
              className="h-11"
            />
            <FieldError>{getFieldError("township")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("address")}>
            <FieldLabel>Delivery Address</FieldLabel>
            <Textarea
              value={values.address}
              onChange={(e) => updateValue("address", e.target.value)}
              placeholder="Full mailing address for rider"
              className="min-h-[100px]"
            />
            <FieldError>{getFieldError("address")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("notes")}>
            <FieldLabel>Internal Notes</FieldLabel>
            <Textarea
              value={values.notes}
              onChange={(e) => updateValue("notes", e.target.value)}
              placeholder="Cod risk, VIP note, etc."
              className="min-h-[100px]"
            />
            <FieldError>{getFieldError("notes")}</FieldError>
          </Field>
        </FieldGroup>

        {formError && (
          <p className="text-[13px] font-bold text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20 text-center">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={handleSubmit} disabled={isPending} className="h-12 font-bold text-[15px]">
            {isPending ? "Processing..." : isEdit ? "Save Profile" : "Register Customer"}
          </Button>

          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 font-medium text-muted-foreground hover:text-destructive"
              disabled={isPending || !canDelete}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete Permanently
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete customer profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All saved data for {values.name} will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
