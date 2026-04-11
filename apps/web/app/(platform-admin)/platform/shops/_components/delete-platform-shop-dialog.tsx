"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"

import type { PlatformShop } from "@/lib/platform/api"
import { deletePlatformShopAction } from "../actions"
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

type DeletePlatformShopDialogProps = {
  shop: PlatformShop | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: (message: string) => void
}

export function DeletePlatformShopDialog({
  shop,
  open,
  onOpenChange,
  onCompleted,
}: DeletePlatformShopDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!shop) {
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await deletePlatformShopAction(shop.id)

      if (!result.ok) {
        setError(result.message)
        return
      }

      onOpenChange(false)
      onCompleted(result.message)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete shop</AlertDialogTitle>
          <AlertDialogDescription>
            {shop
              ? `Delete ${shop.name} and all of its orders, customers, templates, deliveries, subscriptions, and sessions. This cannot be undone.`
              : "Delete this shop and all of its shop-scoped data."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !shop}
          >
            {isPending ? "Deleting..." : "Delete permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
