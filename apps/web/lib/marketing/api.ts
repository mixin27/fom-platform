import "server-only"

import { requestApi } from "@/lib/auth/api"

export type MarketingPlan = {
  id: string
  code: string
  name: string
  description: string | null
  billing_period: string
  price: number
  currency: string
  is_active: boolean
}

const fallbackPlans: MarketingPlan[] = [
  {
    id: "trial",
    code: "trial",
    name: "Free Trial",
    description: "Try the full workflow before moving to a paid subscription.",
    billing_period: "trial",
    price: 0,
    currency: "MMK",
    is_active: true,
  },
  {
    id: "pro_monthly",
    code: "pro_monthly",
    name: "Pro Monthly",
    description: "Flexible month-to-month billing for an active shop.",
    billing_period: "monthly",
    price: 5000,
    currency: "MMK",
    is_active: true,
  },
  {
    id: "pro_yearly",
    code: "pro_yearly",
    name: "Pro Yearly",
    description: "Lower yearly pricing for shops running every day.",
    billing_period: "yearly",
    price: 50000,
    currency: "MMK",
    is_active: true,
  },
]

export async function getMarketingPlans() {
  try {
    return await requestApi<MarketingPlan[]>("/api/v1/public/plans")
  } catch {
    return fallbackPlans
  }
}
