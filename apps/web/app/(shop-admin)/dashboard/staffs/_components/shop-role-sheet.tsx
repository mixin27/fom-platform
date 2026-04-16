"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine, Plus, ShieldCheck, Trash2 } from "lucide-react"

import type { ShopPermissionOption, ShopRole } from "@/lib/shop/api"
import {
  createShopRoleAction,
  deleteShopRoleAction,
  updateShopRoleAction,
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
import { Checkbox } from "@workspace/ui/components/checkbox"
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

type ShopRoleSheetProps = {
  shopId: string
  availablePermissions: ShopPermissionOption[]
  role?: ShopRole | null
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type FormValues = {
  name: string
  description: string
  permissionCodes: string[]
}

type FieldErrors = Record<string, string[]>

function getInitialValues(
  role: ShopRole | null | undefined,
  availablePermissions: ShopPermissionOption[]
): FormValues {
  return {
    name: role?.name ?? "",
    description: role?.description ?? "",
    permissionCodes:
      role?.permission_codes ?? availablePermissions.slice(0, 1).map((permission) => permission.code),
  }
}

export function ShopRoleSheet({
  shopId,
  availablePermissions,
  role,
  triggerLabel,
  triggerVariant = "outline",
}: ShopRoleSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(
    getInitialValues(role, availablePermissions)
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = Boolean(role)
  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce<Record<string, ShopPermissionOption[]>>((groups, permission) => {
      const category = permission.code.split(".")[0] ?? "shop"
      groups[category] ??= []
      groups[category].push(permission)
      return groups
    }, {})
  }, [availablePermissions])

  useEffect(() => {
    if (!open) {
      setDeleteDialogOpen(false)
      return
    }

    setValues(getInitialValues(role, availablePermissions))
    setFieldErrors({})
    setFormError(null)
  }, [availablePermissions, open, role])

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function togglePermission(permissionCode: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      permissionCodes: checked
        ? [...new Set([...current.permissionCodes, permissionCode])]
        : current.permissionCodes.filter((value) => value !== permissionCode),
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

      setDeleteDialogOpen(false)
      setOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!role) {
      return
    }

    startTransition(async () => {
      const result = await deleteShopRoleAction(shopId, role.id)

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
            {triggerLabel ?? (isEdit ? "Edit role" : "Create role")}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] sm:max-w-xl"
        >
          <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
            <SheetTitle>{isEdit ? "Edit custom role" : "Create custom role"}</SheetTitle>
            <SheetDescription>
              Define a named permission bundle for operators in this shop.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <FieldGroup>
              <Field data-invalid={!!getFieldError("name")}>
                <FieldLabel htmlFor="shop-role-name">Role name</FieldLabel>
                <Input
                  id="shop-role-name"
                  value={values.name}
                  onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                  aria-invalid={!!getFieldError("name")}
                  placeholder="Operations manager"
                />
                <FieldError>{getFieldError("name")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("description")}>
                <FieldLabel htmlFor="shop-role-description">Description</FieldLabel>
                <Textarea
                  id="shop-role-description"
                  value={values.description}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, description: event.target.value }))
                  }
                  aria-invalid={!!getFieldError("description")}
                  className="min-h-24"
                  placeholder="Used by operators who own dispatch and order follow-up."
                />
                <FieldDescription>
                  Keep this short so role purpose is obvious when assigning members.
                </FieldDescription>
                <FieldError>{getFieldError("description")}</FieldError>
              </Field>

              <Field data-invalid={!!getFieldError("permission_codes")}>
                <FieldLabel>Permissions</FieldLabel>
                <FieldDescription>
                  Choose the exact operational actions this role should unlock.
                </FieldDescription>
                <div className="grid gap-3">
                  {Object.entries(groupedPermissions).map(([group, permissions]) => (
                    <div
                      key={group}
                      className="rounded-2xl border border-[var(--fom-border-subtle)] bg-background px-3 py-3"
                    >
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {group}
                      </div>
                      <div className="grid gap-2">
                        {permissions.map((permission) => {
                          const checked = values.permissionCodes.includes(permission.code)

                          return (
                            <label key={permission.code} className="flex items-start gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) =>
                                  togglePermission(permission.code, state === true)
                                }
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-foreground">
                                  {permission.name}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  {permission.description}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError>{getFieldError("permission_codes")}</FieldError>
              </Field>
            </FieldGroup>

            {isEdit ? (
              <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="text-sm font-semibold text-destructive">Delete custom role</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role?.deletable
                    ? "Remove this custom role permanently."
                    : "Remove this role from all members before deleting it."}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4"
                  disabled={isPending || !role?.deletable}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete role
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save role" : "Create role"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <ShieldCheck className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete custom role</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the role from the shop catalog permanently. Members must be reassigned first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete role"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
