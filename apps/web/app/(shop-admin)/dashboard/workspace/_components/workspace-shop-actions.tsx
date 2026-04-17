"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ArrowRightLeft } from "lucide-react"

import { switchActiveShopAction } from "@/app/actions"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function WorkspaceShopActions({
  shopId,
  shopName,
}: {
  shopId: string
  shopName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSwitch() {
    setError(null)
    startTransition(async () => {
      const result = await switchActiveShopAction(shopId)
      if (!result.ok) {
        setError(result.message)
        return
      }

      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isPending}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleSwitch} disabled={isPending}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Switch to shop
        </DropdownMenuItem>
      </DropdownMenuContent>
      {error && (
        <div className="absolute mt-1 text-xs text-destructive">{error}</div>
      )}
    </DropdownMenu>
  )
}
