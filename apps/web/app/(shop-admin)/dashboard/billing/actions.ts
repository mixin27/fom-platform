"use server"

import { revalidatePath } from "next/cache"
import { createSubscriptionInvoice } from "@/lib/shop/api"

export async function initiateSubscriptionAction(planCode: string) {
  const result = await createSubscriptionInvoice(planCode)
  
  if (result.data) {
    revalidatePath("/dashboard/billing")
  }
  
  return result
}
