"use client"

import { useState } from "react"
import { PencilLineIcon } from "lucide-react"

import type {
  PlatformInvoice,
  PlatformSubscription,
} from "@/lib/platform/api"
import { PlatformInvoiceFormSheet } from "./platform-invoice-form-sheet"
import { Button } from "@workspace/ui/components/button"

type PlatformInvoiceActionCellProps = {
  invoice: PlatformInvoice
  subscriptions: PlatformSubscription[]
}

export function PlatformInvoiceActionCell({
  invoice,
  subscriptions,
}: PlatformInvoiceActionCellProps) {
  const [open, setOpen] = useState(false)

  const subscription =
    subscriptions.find((item) => item.id === invoice.subscription_id) ?? null

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <PencilLineIcon data-icon="inline-start" />
        Edit
      </Button>
      <PlatformInvoiceFormSheet
        mode="edit"
        subscription={subscription}
        invoice={invoice}
        open={open}
        onOpenChange={setOpen}
        onCompleted={() => {
          setOpen(false)
        }}
      />
    </>
  )
}
