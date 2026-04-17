"use client"

import { useEffect, useRef } from "react"
import { createInvoiceMmqrAction } from "@/app/(shop-admin)/dashboard/billing/actions"

interface MmqrAutoActivatorProps {
  invoiceId: string
  active: boolean
}

/**
 * MmqrAutoActivator is a client component that automatically triggers 
 * the MMQR session generation action when the invoice is in a state 
 * that requires a fresh session but doesn't have one active.
 */
export function MmqrAutoActivator({ invoiceId, active }: MmqrAutoActivatorProps) {
  const initiatedRef = useRef(false)

  useEffect(() => {
    if (active && !initiatedRef.current) {
      initiatedRef.current = true
      
      // We don't need to handle the result here because the server action 
      // will revalidate the page, causing a UI update once the QR is ready.
      createInvoiceMmqrAction(invoiceId).catch((error) => {
        console.error("Failed to auto-activate MMQR session:", error)
      })
    }
  }, [active, invoiceId])

  return null
}
