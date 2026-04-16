"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, PencilLine, Plus } from "lucide-react"

import type { ShopMember, ShopRole } from "@/lib/shop/api"
import {
  createShopMemberAction,
  resendShopMemberInvitationAction,
  updateShopMemberAction,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

type ShopMemberSheetProps = {
  shopId: string
  roles: ShopRole[]
  member?: ShopMember | null
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
}

type FormValues = {
  name: string
  email: string
  phone: string
  status: "active" | "invited" | "disabled"
  roleIds: string[]
}

type FieldErrors = Record<string, string[]>

function getAssignableRoles(roles: ShopRole[]) {
  return roles.filter((role) => role.assignable)
}

function getInitialValues(member: ShopMember | null | undefined, roles: ShopRole[]): FormValues {
  const assignableRoles = getAssignableRoles(roles)
  const currentRoleIds =
    member?.role_ids?.filter((roleId) => assignableRoles.some((role) => role.id === roleId)) ??
    member?.roles
      .map((role) => role.id)
      .filter((roleId) => assignableRoles.some((role) => role.id === roleId)) ??
    []

  return {
    name: member?.user.name ?? "",
    email: member?.user.email ?? "",
    phone: member?.user.phone ?? "",
    status: (member?.status as FormValues["status"] | undefined) ?? "active",
    roleIds:
      currentRoleIds.length > 0
        ? currentRoleIds
        : assignableRoles[0]
          ? [assignableRoles[0].id]
          : [],
  }
}

export function ShopMemberSheet({
  shopId,
  roles,
  member,
  triggerLabel,
  triggerVariant = "outline",
}: ShopMemberSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(member, roles))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const assignableRoles = useMemo(() => getAssignableRoles(roles), [roles])
  const isEdit = Boolean(member)
  const canResendInvitation = Boolean(
    member && member.status === "invited" && member.user.email
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(member, roles))
    setFieldErrors({})
    setFormError(null)
  }, [member, open, roles])

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function toggleRole(roleId: string, checked: boolean) {
    setValues((current) => {
      const nextRoleIds = checked
        ? [...new Set([...current.roleIds, roleId])]
        : current.roleIds.filter((value) => value !== roleId)

      return {
        ...current,
        roleIds: nextRoleIds,
      }
    })
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const payload = {
        ...(values.name.trim() ? { name: values.name.trim() } : {}),
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        role_ids: values.roleIds,
      }

      const result = isEdit
        ? await updateShopMemberAction(shopId, member!.id, {
            status: values.status,
            role_ids: values.roleIds,
          })
        : await createShopMemberAction(shopId, payload)

      if (!result.ok) {
        setFormError(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  function handleResendInvitation() {
    if (!member) {
      return
    }

    setFormError(null)

    startTransition(async () => {
      const result = await resendShopMemberInvitationAction(shopId, member.id)

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      setFormError("Invitation email sent.")
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant={triggerVariant}>
          {isEdit ? <PencilLine data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {triggerLabel ?? (isEdit ? "Edit member" : "Invite member")}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] sm:max-w-xl"
      >
        <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <SheetTitle>{isEdit ? "Edit member access" : "Invite member"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update member status and role assignments for this shop."
              : "Add a new operator and assign the roles they should use in this shop."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <FieldGroup>
            <Field data-invalid={!!getFieldError("name")}>
              <FieldLabel htmlFor="shop-member-name">Member name</FieldLabel>
              <Input
                id="shop-member-name"
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                aria-invalid={!!getFieldError("name")}
                placeholder="Ko Min"
                disabled={isEdit}
              />
              <FieldDescription>
                Required only when creating a brand new user from this shop.
              </FieldDescription>
              <FieldError>{getFieldError("name")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("email")}>
              <FieldLabel htmlFor="shop-member-email">Email</FieldLabel>
              <Input
                id="shop-member-email"
                value={values.email}
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                aria-invalid={!!getFieldError("email")}
                placeholder="member@example.com"
                disabled={isEdit}
              />
              <FieldError>{getFieldError("email")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("phone")}>
              <FieldLabel htmlFor="shop-member-phone">Phone</FieldLabel>
              <Input
                id="shop-member-phone"
                value={values.phone}
                onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
                aria-invalid={!!getFieldError("phone")}
                placeholder="09 7800 2222"
                disabled={isEdit}
              />
              <FieldDescription>
                Provide email or phone so the member can be matched to an existing user.
              </FieldDescription>
              <FieldError>{getFieldError("phone")}</FieldError>
            </Field>

            {isEdit ? (
              <Field data-invalid={!!getFieldError("status")}>
                <FieldLabel htmlFor="shop-member-status">Membership status</FieldLabel>
                <select
                  id="shop-member-status"
                  value={values.status}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      status: event.target.value as FormValues["status"],
                    }))
                  }
                  className="h-10 rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="disabled">Disabled</option>
                </select>
                <FieldError>{getFieldError("status")}</FieldError>
              </Field>
            ) : null}

            {canResendInvitation ? (
              <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-background px-3 py-3">
                <div className="text-sm font-semibold text-foreground">Invitation pending</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  This member still needs to open the email link and set a password before access becomes active.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleResendInvitation}
                  disabled={isPending}
                >
                  <Mail data-icon="inline-start" />
                  Resend invitation
                </Button>
              </div>
            ) : null}

            <Field data-invalid={!!getFieldError("role_ids") || !!getFieldError("role_codes")}>
              <FieldLabel>Assigned roles</FieldLabel>
              <FieldDescription>
                Roles combine into the final permission set for this member.
              </FieldDescription>
              <div className="grid gap-2">
                {assignableRoles.map((role) => {
                  const checked = values.roleIds.includes(role.id)

                  return (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--fom-border-subtle)] bg-background px-3 py-3"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(state) => toggleRole(role.id, state === true)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {role.name}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {role.description ?? `${role.permissions.length} permissions`}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <FieldError>{getFieldError("role_ids") ?? getFieldError("role_codes")}</FieldError>
            </Field>
          </FieldGroup>

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
          <Button type="button" onClick={handleSubmit} disabled={isPending || assignableRoles.length === 0}>
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Invite member"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
