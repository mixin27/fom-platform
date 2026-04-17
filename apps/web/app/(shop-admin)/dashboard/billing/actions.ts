"use server"

import { revalidatePath } from "next/cache"
import { 
  createInvoiceMmqrSession, 
  createSubscriptionInvoice 
} from "@/lib/shop/api"

export async function initiateSubscriptionAction(planCode: string) {
  const result = await createSubscriptionInvoice(planCode)
  
  if (result.data) {
    revalidatePath("/dashboard/billing")
  }
  
  return result
}

export async function createInvoiceMmqrAction(invoiceId: string) {
  const result = await createInvoiceMmqrSession(invoiceId)
  
  if (result.success) {
    revalidatePath("/dashboard/billing")
    revalidatePath(`/dashboard/billing/${invoiceId}`)
  }
  
  return result
}
