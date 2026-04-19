"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MailIcon, SaveIcon } from "lucide-react"

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

type FormValues = {
  name: string
  email: string
  phone: string
  status: "active" | "invited" | "disabled"
  roleIds: string[]
}

function getInitialValues(member: ShopMember | null | undefined, roles: ShopRole[]): FormValues {
  const assignableRoles = roles.filter((role) => role.assignable)
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
    status:
      (member?.status as FormValues["status"] | undefined) === "disabled"
        ? "disabled"
        : (member?.status as FormValues["status"] | undefined) === "invited"
          ? "invited"
          : "active",
    roleIds:
      currentRoleIds.length > 0
        ? currentRoleIds
        : assignableRoles[0]
          ? [assignableRoles[0].id]
          : [],
  }
}

interface ShopMemberFormProps {
  shopId: string
  roles: ShopRole[]
  member?: ShopMember | null
  mode: "create" | "edit"
}

export function ShopMemberForm({
  shopId,
  roles,
  member,
  mode,
}: ShopMemberFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(member, roles))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const assignableRoles = useMemo(() => roles.filter((role) => role.assignable), [roles])
  const isEdit = mode === "edit"
  const canResendInvitation = Boolean(
    member && member.status === "invited" && member.user.email
  )

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

      router.push("/dashboard/staffs")
      router.refresh()
    })
  }

  function handleResendInvitation() {
    if (!member) return
    setFormError(null)
    startTransition(async () => {
      const result = await resendShopMemberInvitationAction(shopId, member.id)
      if (!result.ok) {
        setFormError(result.message)
        return
      }
      setFormError("Invitation email resent.")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!getFieldError("name")}>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            value={values.name}
            onChange={(e) => setValues((c) => ({ ...c, name: e.target.value }))}
            placeholder="Ko Min"
            disabled={isEdit}
            className="h-11"
          />
          <FieldDescription>Required for new account registration.</FieldDescription>
          <FieldError>{getFieldError("name")}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!getFieldError("email")}>
            <FieldLabel>Email Address</FieldLabel>
            <Input
              value={values.email}
              onChange={(e) => setValues((c) => ({ ...c, email: e.target.value }))}
              placeholder="member@example.com"
              disabled={isEdit}
              className="h-11"
            />
            <FieldError>{getFieldError("email")}</FieldError>
          </Field>

          <Field data-invalid={!!getFieldError("phone")}>
            <FieldLabel>Phone Number</FieldLabel>
            <Input
              value={values.phone}
              onChange={(e) => setValues((c) => ({ ...c, phone: e.target.value }))}
              placeholder="09..."
              disabled={isEdit}
              className="h-11 font-mono"
            />
            <FieldError>{getFieldError("phone")}</FieldError>
          </Field>
        </div>

        {isEdit && (
          <Field data-invalid={!!getFieldError("status")}>
            <FieldLabel>Access Status</FieldLabel>
            <select
              value={values.status}
              onChange={(e) => setValues((c) => ({ ...c, status: e.target.value as any }))}
              className="h-11 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 text-sm"
            >
              <option value="active">Active</option>
              {member?.status === "invited" && <option value="invited">Invited</option>}
              <option value="disabled">Disabled / Locked</option>
            </select>
          </Field>
        )}

        {canResendInvitation && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <MailIcon className="size-4" />
              Invitation Pending
            </div>
            <p className="mt-1 text-xs text-amber-700 leading-relaxed font-medium">
              The user has not accepted the invite yet. You can resend the link if they haven't received it.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-[11px] font-bold border-amber-200 bg-white hover:bg-amber-100"
              onClick={handleResendInvitation}
              disabled={isPending}
            >
              Resend Invitation
            </Button>
          </div>
        )}

        <Field>
          <FieldLabel>Capability Assignments</FieldLabel>
          <FieldDescription>Select the roles that define what this member can see and do.</FieldDescription>
          <div className="grid gap-3 pt-2">
            {assignableRoles.map((role) => {
              const checked = values.roleIds.includes(role.id)
              return (
                <label
                  key={role.id}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-portal-surface)] p-4 transition-colors hover:border-[var(--fom-accent)]/50 cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(s) => toggleRole(role.id, s === true)}
                    className="mt-1"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-bold text-foreground">{role.name}</span>
                    <span className="text-[12px] font-medium text-muted-foreground leading-tight">
                      {role.description ?? "Standard functional access set."}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
          <FieldError>{getFieldError("role_ids")}</FieldError>
        </Field>
      </FieldGroup>

      {formError && (
        <p className="text-[13px] font-bold text-destructive bg-destructive/5 p-3 rounded-xl border border-destructive/20 text-center">
          {formError}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={isPending || assignableRoles.length === 0} className="h-12 font-bold text-[15px]">
        {isPending ? "Processing..." : isEdit ? "Update Staff Record" : "Add Staff Member"}
      </Button>
    </div>
  )
}
