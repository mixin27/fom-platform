"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react"

import type { PlatformOwnerAccount, PlatformShop } from "@/lib/platform/api"
import {
  createPlatformShopAction,
  searchPlatformOwnerAccountsAction,
  updatePlatformShopAction,
  type PlatformShopFormInput,
} from "../actions"
import { Badge } from "@workspace/ui/components/badge"
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
} from "@workspace/ui/components/sheet"

type PlatformShopFormSheetProps = {
  mode: "create" | "edit"
  shop?: PlatformShop | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: (message: string) => void
}

type FormValues = {
  name: string
  timezone: string
  owner_name: string
  owner_email: string
  owner_phone: string
  owner_password: string
}

type FieldErrors = Record<string, string[]>

function getInitialValues(shop?: PlatformShop | null): FormValues {
  return {
    name: shop?.name ?? "",
    timezone: shop?.timezone ?? "Asia/Yangon",
    owner_name: shop?.owner_name ?? "",
    owner_email: shop?.owner_email ?? "",
    owner_phone: shop?.owner_phone ?? "",
    owner_password: "",
  }
}

function buildUpdatePayload(
  values: FormValues,
  shop: PlatformShop,
  selectedOwner: PlatformOwnerAccount | null
) {
  const payload: Partial<PlatformShopFormInput> = {}

  if (values.name.trim() !== shop.name) {
    payload.name = values.name.trim()
  }

  if (values.timezone.trim() && values.timezone.trim() !== shop.timezone) {
    payload.timezone = values.timezone.trim()
  }

  if (selectedOwner) {
    if (selectedOwner.id !== shop.owner_user_id) {
      payload.owner_user_id = selectedOwner.id
    }

    if (values.owner_password.trim()) {
      payload.owner_password = values.owner_password.trim()
    }

    return payload
  }

  if (values.owner_name.trim() && values.owner_name.trim() !== shop.owner_name) {
    payload.owner_name = values.owner_name.trim()
  }

  if (
    values.owner_email.trim() &&
    values.owner_email.trim().toLowerCase() !== (shop.owner_email ?? "").toLowerCase()
  ) {
    payload.owner_email = values.owner_email.trim().toLowerCase()
  }

  if (
    values.owner_phone.trim() &&
    values.owner_phone.trim() !== (shop.owner_phone ?? "")
  ) {
    payload.owner_phone = values.owner_phone.trim()
  }

  if (values.owner_password.trim()) {
    payload.owner_password = values.owner_password.trim()
  }

  return payload
}

export function PlatformShopFormSheet({
  mode,
  shop,
  open,
  onOpenChange,
  onCompleted,
}: PlatformShopFormSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSearchingOwners, startOwnerSearchTransition] = useTransition()
  const [values, setValues] = useState<FormValues>(getInitialValues(shop))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("")
  const [ownerSearchResults, setOwnerSearchResults] = useState<PlatformOwnerAccount[]>(
    []
  )
  const [ownerSearchError, setOwnerSearchError] = useState<string | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<PlatformOwnerAccount | null>(null)
  const ownerSearchRequestId = useRef(0)

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(getInitialValues(shop))
    setFieldErrors({})
    setFormError(null)
    setOwnerSearchQuery("")
    setOwnerSearchResults([])
    setOwnerSearchError(null)
    setSelectedOwner(null)
  }, [open, shop])

  useEffect(() => {
    if (!open) {
      return
    }

    const normalizedQuery = ownerSearchQuery.trim()

    if (normalizedQuery.length < 2 || selectedOwner) {
      setOwnerSearchResults([])
      setOwnerSearchError(null)
      return
    }

    const requestId = ownerSearchRequestId.current + 1
    ownerSearchRequestId.current = requestId

    const timer = window.setTimeout(() => {
      startOwnerSearchTransition(async () => {
        const result = await searchPlatformOwnerAccountsAction(normalizedQuery)

        if (ownerSearchRequestId.current !== requestId) {
          return
        }

        if (!result.ok) {
          setOwnerSearchResults([])
          setOwnerSearchError(result.message)
          return
        }

        setOwnerSearchError(null)
        setOwnerSearchResults(result.accounts)
      })
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [open, ownerSearchQuery, selectedOwner])

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null
  }

  function selectExistingOwner(owner: PlatformOwnerAccount) {
    setSelectedOwner(owner)
    setOwnerSearchQuery(owner.email ?? owner.phone ?? owner.name)
    setOwnerSearchResults([])
    setOwnerSearchError(null)
    setFormError(null)
    setFieldErrors((current) => {
      const nextErrors = { ...current }
      delete nextErrors.owner_user_id
      delete nextErrors.owner_name
      delete nextErrors.owner_email
      delete nextErrors.owner_phone
      return nextErrors
    })
    setValues((current) => ({
      ...current,
      owner_name: owner.name,
      owner_email: owner.email ?? "",
      owner_phone: owner.phone ?? "",
    }))
  }

  function clearSelectedOwner() {
    setSelectedOwner(null)
    setOwnerSearchQuery("")
    setOwnerSearchResults([])
    setOwnerSearchError(null)
    setValues((current) => ({
      ...current,
      owner_name: shop?.owner_name ?? "",
      owner_email: shop?.owner_email ?? "",
      owner_phone: shop?.owner_phone ?? "",
    }))
  }

  function handleSubmit() {
    setFormError(null)
    setFieldErrors({})

    startTransition(async () => {
      const trimmedValues: FormValues = {
        name: values.name.trim(),
        timezone: values.timezone.trim() || "Asia/Yangon",
        owner_name: values.owner_name.trim(),
        owner_email: values.owner_email.trim().toLowerCase(),
        owner_phone: values.owner_phone?.trim() ?? "",
        owner_password: values.owner_password?.trim() ?? "",
      }

      const createPayload: PlatformShopFormInput = selectedOwner
        ? {
            name: trimmedValues.name,
            timezone: trimmedValues.timezone,
            owner_user_id: selectedOwner.id,
            ...(trimmedValues.owner_name
              ? { owner_name: trimmedValues.owner_name }
              : {}),
            ...(trimmedValues.owner_email
              ? { owner_email: trimmedValues.owner_email }
              : {}),
            ...(trimmedValues.owner_phone
              ? { owner_phone: trimmedValues.owner_phone }
              : {}),
            ...(trimmedValues.owner_password
              ? { owner_password: trimmedValues.owner_password }
              : {}),
          }
        : {
            name: trimmedValues.name,
            timezone: trimmedValues.timezone,
            owner_name: trimmedValues.owner_name,
            owner_email: trimmedValues.owner_email,
            ...(trimmedValues.owner_phone
              ? { owner_phone: trimmedValues.owner_phone }
              : {}),
            ...(trimmedValues.owner_password
              ? { owner_password: trimmedValues.owner_password }
              : {}),
          }

      const updatePayload = shop
        ? buildUpdatePayload(trimmedValues, shop, selectedOwner)
        : {}

      if (mode === "edit" && Object.keys(updatePayload).length === 0) {
        setFormError("No changes to save.")
        return
      }

      const result =
        mode === "create"
          ? await createPlatformShopAction(createPayload)
          : shop
            ? await updatePlatformShopAction(shop.id, updatePayload)
            : {
                ok: false as const,
                message: "Shop context is missing.",
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

  const title = mode === "create" ? "Create shop" : "Edit shop"
  const description =
    mode === "create"
      ? "Create a tenant workspace and its initial owner account."
      : "Update shop identity and owner access details."

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l bg-white sm:max-w-xl">
        <SheetHeader className="border-b border-black/6 pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <FieldGroup>
            <Field data-invalid={!!getFieldError("name")}>
              <FieldLabel htmlFor="platform-shop-name">Shop name</FieldLabel>
              <Input
                id="platform-shop-name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                aria-invalid={!!getFieldError("name")}
                placeholder="Ma Aye Shop"
              />
              <FieldDescription>
                This is the primary tenant name shown across the platform and owner
                dashboard.
              </FieldDescription>
              <FieldError>{getFieldError("name")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("timezone")}>
              <FieldLabel htmlFor="platform-shop-timezone">Timezone</FieldLabel>
              <Input
                id="platform-shop-timezone"
                value={values.timezone}
                onChange={(event) => updateValue("timezone", event.target.value)}
                aria-invalid={!!getFieldError("timezone")}
                placeholder="Asia/Yangon"
              />
              <FieldDescription>
                Use an IANA timezone such as <code>Asia/Yangon</code>.
              </FieldDescription>
              <FieldError>{getFieldError("timezone")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("owner_user_id")}>
              <FieldLabel htmlFor="platform-owner-account-search">
                Existing owner account
              </FieldLabel>
              <Input
                id="platform-owner-account-search"
                value={ownerSearchQuery}
                onChange={(event) => setOwnerSearchQuery(event.target.value)}
                aria-invalid={!!getFieldError("owner_user_id")}
                placeholder="Search by name, email, or phone"
                disabled={selectedOwner !== null}
              />
              <FieldDescription>
                Select an existing account when this shop should belong to a user who
                already has platform access.
              </FieldDescription>
              <FieldError>{getFieldError("owner_user_id")}</FieldError>
            </Field>

            {selectedOwner ? (
              <div className="rounded-2xl border border-black/8 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedOwner.name}
                      </p>
                      <Badge variant="outline">Existing account</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedOwner.email ?? "No email on file"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedOwner.phone ?? "No phone on file"} ·{" "}
                      {selectedOwner.active_shop_count} active shop
                      {selectedOwner.active_shop_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={clearSelectedOwner}
                    disabled={isPending}
                    aria-label="Clear selected owner account"
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
            ) : null}

            {!selectedOwner && ownerSearchQuery.trim().length >= 2 ? (
              <div className="rounded-2xl border border-black/8 bg-white">
                {isSearchingOwners ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Searching owner accounts...
                  </div>
                ) : ownerSearchError ? (
                  <div className="px-3 py-3 text-sm text-destructive">
                    {ownerSearchError}
                  </div>
                ) : ownerSearchResults.length > 0 ? (
                  <div className="divide-y divide-black/6">
                    {ownerSearchResults.map((owner) => (
                      <button
                        key={owner.id}
                        type="button"
                        className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-muted/30"
                        onClick={() => selectExistingOwner(owner)}
                      >
                        <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                          <SearchIcon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {owner.name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {owner.email ?? owner.phone ?? "No email or phone on file"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {owner.active_shop_count} active shop
                            {owner.active_shop_count === 1 ? "" : "s"} ·{" "}
                            {owner.has_password_credential
                              ? "Password ready"
                              : "No password credential"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No matching existing account found. Leave this blank to create or
                    update the owner from the fields below.
                  </div>
                )}
              </div>
            ) : null}

            <Field data-invalid={!!getFieldError("owner_name")}>
              <FieldLabel htmlFor="platform-owner-name">Owner name</FieldLabel>
              <Input
                id="platform-owner-name"
                value={values.owner_name}
                onChange={(event) => updateValue("owner_name", event.target.value)}
                aria-invalid={!!getFieldError("owner_name")}
                placeholder="Ma Aye"
                disabled={selectedOwner !== null}
              />
              {selectedOwner ? (
                <FieldDescription>
                  This shop is linked to an existing account. Clear the selection to
                  edit owner identity fields manually.
                </FieldDescription>
              ) : null}
              <FieldError>{getFieldError("owner_name")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("owner_email")}>
              <FieldLabel htmlFor="platform-owner-email">Owner email</FieldLabel>
              <Input
                id="platform-owner-email"
                type="email"
                value={values.owner_email}
                onChange={(event) => updateValue("owner_email", event.target.value)}
                aria-invalid={!!getFieldError("owner_email")}
                placeholder="owner@example.com"
                disabled={selectedOwner !== null}
              />
              <FieldDescription>
                This is the current primary sign-in identifier for email/password auth.
              </FieldDescription>
              <FieldError>{getFieldError("owner_email")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("owner_phone")}>
              <FieldLabel htmlFor="platform-owner-phone">Owner phone</FieldLabel>
              <Input
                id="platform-owner-phone"
                value={values.owner_phone ?? ""}
                onChange={(event) => updateValue("owner_phone", event.target.value)}
                aria-invalid={!!getFieldError("owner_phone")}
                placeholder="09 7800 1111"
                disabled={selectedOwner !== null}
              />
              <FieldError>{getFieldError("owner_phone")}</FieldError>
            </Field>

            <Field data-invalid={!!getFieldError("owner_password")}>
              <FieldLabel htmlFor="platform-owner-password">
                {mode === "create" ? "Owner password" : "Reset owner password"}
              </FieldLabel>
              <Input
                id="platform-owner-password"
                type="password"
                value={values.owner_password ?? ""}
                onChange={(event) => updateValue("owner_password", event.target.value)}
                aria-invalid={!!getFieldError("owner_password")}
                placeholder={
                  mode === "create"
                    ? "At least 8 characters"
                    : "Leave blank to keep the current password"
                }
              />
              <FieldDescription>
                {selectedOwner
                  ? "Optional. Set this only if the selected existing account needs a new password."
                  : mode === "create"
                    ? "Required for creating a new owner account."
                    : "Optional. Set this only when the owner needs a new password."}
              </FieldDescription>
              <FieldError>{getFieldError("owner_password")}</FieldError>
            </Field>
          </FieldGroup>

          {formError ? (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-black/6 bg-muted/20">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button className="sm:flex-1" onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create shop"
                  : "Save changes"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
