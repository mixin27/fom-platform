"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine, Plus, Trash2Icon } from "lucide-react"

import type { ShopCustomer } from "@/lib/shop/api"
import {
  createShopCustomerAction,
  deleteShopCustomerAction,
  updateShopCustomerAction,
} from "../../actions"
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

type ShopCustomerSheetProps = {
  shopId: string
  customer?: ShopCustomer | null
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type FormValues = {
  name: string
  phone: string
  township: string
  address: string
  notes: string
}

type FieldErrors = Record<string, string[]>

function getInitialValues(customer?: ShopCustomer | null): FormValues {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    township: customer?.township ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  }
}

export function ShopCustomerSheet({
  shopId,
  customer,
  triggerLabel,
  triggerVariant = "outline",
}: ShopCustomerSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(customer))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = Boolean(customer)
  const canDelete = Boolean(customer && customer.total_orders === 0)

  useEffect(() => {
    if (!open) {
      setDeleteDialogOpen(false)
      return
    }

    setValues(getInitialValues(customer))
    setFieldErrors({})
    setFormError(null)
  }, [customer, open])

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

      setOpen(false)
      setDeleteDialogOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!customer) {
      return
    }

    setFormError(null)

    startTransition(async () => {
      const result = await deleteShopCustomerAction(shopId, customer.id)

      if (!result.ok) {
        setFormError(result.message)
        setDeleteDialogOpen(false)
        return
      }

      setDeleteDialogOpen(false)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" size="sm" variant={triggerVariant}>
            {isEdit ? <PencilLine data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            {triggerLabel ?? (isEdit ? "Edit" : "Create customer")}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] sm:max-w-xl">
          <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
            <SheetTitle>{isEdit ? "Edit customer" : "Create customer"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update customer delivery details and operator notes."
                : "Save a customer profile so future orders are faster to create."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <FieldGroup>
              <Field data-invalid={!!getFieldError("name")}>
                <FieldLabel htmlFor="shop-customer-name">Customer name</FieldLabel>
                <Input
                  id="shop-customer-name"
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  aria-invalid={!!getFieldError("name")}
                  placeholder="Daw Aye Aye"
                />
                <FieldError>{getFieldError("name")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("phone")}>
                <FieldLabel htmlFor="shop-customer-phone">Phone</FieldLabel>
                <Input
                  id="shop-customer-phone"
                  value={values.phone}
                  onChange={(event) => updateValue("phone", event.target.value)}
                  aria-invalid={!!getFieldError("phone")}
                  placeholder="09 9871 2345"
                />
                <FieldDescription>
                  This stays as the shop-level match key for repeat orders.
                </FieldDescription>
                <FieldError>{getFieldError("phone")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("township")}>
                <FieldLabel htmlFor="shop-customer-township">Township</FieldLabel>
                <Input
                  id="shop-customer-township"
                  value={values.township}
                  onChange={(event) => updateValue("township", event.target.value)}
                  aria-invalid={!!getFieldError("township")}
                  placeholder="Hlaing"
                />
                <FieldError>{getFieldError("township")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("address")}>
                <FieldLabel htmlFor="shop-customer-address">Address</FieldLabel>
                <Textarea
                  id="shop-customer-address"
                  value={values.address}
                  onChange={(event) => updateValue("address", event.target.value)}
                  aria-invalid={!!getFieldError("address")}
                  className="min-h-28"
                  placeholder="No. 12, Shwe Taung Gyar St, Hlaing, Yangon"
                />
                <FieldError>{getFieldError("address")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("notes")}>
                <FieldLabel htmlFor="shop-customer-notes">Internal notes</FieldLabel>
                <Textarea
                  id="shop-customer-notes"
                  value={values.notes}
                  onChange={(event) => updateValue("notes", event.target.value)}
                  aria-invalid={!!getFieldError("notes")}
                  className="min-h-28"
                  placeholder="Delivery timing, repeat COD risk, or VIP note"
                />
                <FieldError>{getFieldError("notes")}</FieldError>
              </Field>
            </FieldGroup>

            {isEdit ? (
              <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="text-sm font-semibold text-destructive">Delete customer</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canDelete
                    ? "Remove this customer profile permanently."
                    : "Customers with order history cannot be deleted."}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4"
                  disabled={isPending || !canDelete}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete customer
                </Button>
              </div>
            ) : null}

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
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create customer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete customer</AlertDialogTitle>
          <AlertDialogDescription>
            {customer
              ? `Delete ${customer.name} permanently. This cannot be undone.`
              : "Delete this customer permanently."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {formError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending || !canDelete}>
            {isPending ? "Deleting..." : "Delete permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
