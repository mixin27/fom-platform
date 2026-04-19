"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SaveIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react"

import type { ShopPermissionOption, ShopRole } from "@/lib/shop/api"
import {
  createShopRoleAction,
  deleteShopRoleAction,
  updateShopRoleAction,
} from "../../actions"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
  description: string
  permissionCodes: string[]
}

function getInitialValues(
  role: ShopRole | null | undefined,
  availablePermissions: ShopPermissionOption[]
): FormValues {
  return {
    name: role?.name ?? "",
    description: role?.description ?? "",
    permissionCodes:
      role?.permission_codes ?? availablePermissions.slice(0, 1).map((p) => p.code),
  }
}

interface ShopRoleFormProps {
  shopId: string
  availablePermissions: ShopPermissionOption[]
  role?: ShopRole | null
  mode: "create" | "edit"
}

export function ShopRoleForm({
  shopId,
  availablePermissions,
  role,
  mode,
}: ShopRoleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [values, setValues] = useState<FormValues>(getInitialValues(role, availablePermissions))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode === "edit"
  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce<Record<string, ShopPermissionOption[]>>((groups, p) => {
      const category = p.code.split(".")[0] ?? "general"
      groups[category] ??= []
      groups[category].push(p)
      return groups
    }, {})
  }, [availablePermissions])

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function togglePermission(code: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      permissionCodes: checked
        ? [...new Set([...current.permissionCodes, code])]
        : current.permissionCodes.filter((c) => c !== code),
    }))
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        permission_codes: values.permissionCodes,
      }

      const result = isEdit
        ? await updateShopRoleAction(shopId, role!.id, payload)
        : await createShopRoleAction(shopId, payload)

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      router.push("/dashboard/staffs")
      router.refresh()
    })
  }

  function handleDelete() {
    if (!role) return
    setFormError(null)
    startTransition(async () => {
      const result = await deleteShopRoleAction(shopId, role.id)
      if (!result.ok) {
        setFormError(result.message)
        setDeleteDialogOpen(false)
        return
      }
      setDeleteDialogOpen(false)
      router.push("/dashboard/staffs")
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-invalid={!!getFieldError("name")}>
            <FieldLabel>Role Label</FieldLabel>
            <Input
              value={values.name}
              onChange={(e) => setValues((c) => ({ ...c, name: e.target.value }))}
              placeholder="e.g. Sales Associate"
              className="h-11"
            />
            <FieldError>{getFieldError("name")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("description")}>
            <FieldLabel>Purpose Description</FieldLabel>
            <Textarea
              value={values.description}
              onChange={(e) => setValues((c) => ({ ...c, description: e.target.value }))}
              placeholder="What does this role allow?"
              className="min-h-[80px]"
            />
            <FieldError>{getFieldError("description")}</FieldError>
          </Field>

          <div className="flex flex-col gap-4">
            <FieldLabel>Capability Matrix</FieldLabel>
            <div className="grid gap-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] p-4">
                  <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{category}</h4>
                  <div className="grid gap-3">
                    {perms.map((p) => {
                      const checked = values.permissionCodes.includes(p.code)
                      return (
                        <label key={p.code} className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(s) => togglePermission(p.code, s === true)}
                            className="mt-1"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-bold text-foreground">{p.name}</span>
                            <span className="text-[11px] font-medium text-muted-foreground leading-tight">{p.description}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <FieldError>{getFieldError("permission_codes")}</FieldError>
          </div>
        </FieldGroup>

        {formError && (
          <p className="text-[13px] font-bold text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20 text-center">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={handleSubmit} disabled={isPending} className="h-12 font-bold text-[15px]">
            {isPending ? "Processing..." : isEdit ? "Save Configuration" : "Establish Role"}
          </Button>

          {isEdit && role?.deletable && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 font-medium text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Retire Role Permanently
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <ShieldCheckIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Retire custom role?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes "{values.name}" from the catalog. Any members currently assigned this role will lose these permissions immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Retiring..." : "Retire now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
