"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown } from "lucide-react"

import { switchActiveShopAction } from "@/app/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

type ShopSwitcherProps = {
  shops: Array<{
    id: string
    name: string
    timezone: string
    membership: {
      role: string | null
      roles: string[]
      permissions: string[]
    }
  }>
  activeShopId: string | null
}

function formatRoleLabel(role: string | null) {
  if (role === "owner") {
    return "Owner"
  }

  if (role === "staff") {
    return "Staff"
  }

  if (!role) {
    return "Member"
  }

  return role
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getShopAvatarLabel(name: string | null | undefined) {
  const normalized = name?.trim()

  if (!normalized) {
    return "S"
  }

  return normalized.charAt(0).toUpperCase()
}

export function ShopSwitcher({ shops, activeShopId }: ShopSwitcherProps) {
  const router = useRouter()
  const [selectedShopId, setSelectedShopId] = useState(
    activeShopId ?? shops[0]?.id ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setSelectedShopId(activeShopId ?? shops[0]?.id ?? "")
  }, [activeShopId, shops])

  const activeShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) ?? shops[0] ?? null,
    [selectedShopId, shops]
  )

  const hasMultipleShops = shops.length > 1
  const roleLabel = formatRoleLabel(activeShop?.membership.role ?? null)
  const permissionCount = activeShop?.membership.permissions.length ?? 0
  const triggerMeta = `${roleLabel} · ${permissionCount} permission${
    permissionCount === 1 ? "" : "s"
  }`
  const shopCountLabel = `${shops.length} shop${
    shops.length === 1 ? "" : "s"
  } linked to this account.`

  function handleChange(nextShopId: string) {
    if (!nextShopId || nextShopId === selectedShopId) {
      return
    }

    setSelectedShopId(nextShopId)
    setError(null)

    startTransition(async () => {
      const result = await switchActiveShopAction(nextShopId)

      if (!result.ok) {
        setError(result.message)
        setSelectedShopId(activeShopId ?? shops[0]?.id ?? "")
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="mt-3">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] px-3 py-3 text-left shadow-none transition-colors hover:bg-muted/5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fom-orange)]/10 text-sm font-semibold text-[var(--fom-orange)]">
              {getShopAvatarLabel(activeShop?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {activeShop?.name ?? "No shop selected"}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {triggerMeta}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-center self-stretch pl-1 text-muted-foreground">
              <ChevronsUpDown className="size-4" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="rounded-2xl border border-[var(--fom-border-strong)] bg-[var(--fom-portal-surface)] p-2 text-[var(--fom-ink)] shadow-xl"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuLabel className="px-2 pt-1 pb-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Switch shop
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedShopId}
            onValueChange={handleChange}
          >
            <DropdownMenuGroup className="space-y-1">
              {shops.map((shop) => {
                const shopRoleLabel = formatRoleLabel(shop.membership.role)
                const metadata = `${shopRoleLabel} · ${
                  shop.membership.permissions.length
                } permission${
                  shop.membership.permissions.length === 1 ? "" : "s"
                } · ${shop.timezone}`

                return (
                  <DropdownMenuRadioItem
                    key={shop.id}
                    value={shop.id}
                    disabled={isPending}
                    className="min-w-0 rounded-xl px-2 py-2.5 text-[var(--fom-ink)] focus:bg-muted/10! focus:text-[var(--fom-ink)]! data-[highlighted]:bg-muted/10! data-[highlighted]:text-[var(--fom-ink)]! data-[state=checked]:bg-[var(--fom-orange)]/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--fom-portal-bg)] text-xs font-semibold !text-[var(--fom-ink)]">
                        {getShopAvatarLabel(shop.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium !text-[var(--fom-ink)]">
                          {shop.name}
                        </p>
                        <p className="mt-1 truncate text-xs !text-muted-foreground">
                          {metadata}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="my-2" />

          <div className="rounded-xl bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-[var(--fom-ink)]">
              {shopCountLabel}
            </p>
            <p className="mt-1.5 leading-5">
              One subscription belongs to one shop. Switching workspace changes
              the active shop context only.
            </p>
            {!hasMultipleShops ? (
              <p className="mt-1.5 leading-5">
                This account currently has access to one shop in the active
                session.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="px-2 pt-2 text-xs text-destructive">{error}</div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
