import "server-only"

import { requestApi } from "@/lib/auth/api"

export type MarketingPlanItem = {
  id: string
  code: string
  label: string
  description: string | null
  availability_status: "available" | "unavailable" | string
  sort_order: number
}

export type MarketingPlanLimit = {
  id: string
  code: string
  label: string
  description: string | null
  value: number | null
  sort_order: number
}

export type MarketingPlan = {
  id: string
  code: string
  name: string
  description: string | null
  billing_period: string
  price: number
  currency: string
  is_active: boolean
  sort_order: number
  items: MarketingPlanItem[]
  limits: MarketingPlanLimit[]
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
    sort_order: 0,
    items: [],
    limits: [],
  },
  {
    id: "pro_monthly",
    code: "pro_monthly",
    name: "Shop Monthly",
    description: "Single-shop monthly plan for daily Facebook order operations.",
    billing_period: "monthly",
    price: 15000,
    currency: "MMK",
    is_active: true,
    sort_order: 1,
    items: [],
    limits: [],
  },
  {
    id: "pro_yearly",
    code: "pro_yearly",
    name: "Shop Yearly",
    description: "Discounted yearly plan for shops running the workflow every day.",
    billing_period: "yearly",
    price: 150000,
    currency: "MMK",
    is_active: true,
    sort_order: 2,
    items: [],
    limits: [],
  },
]

export async function getMarketingPlans() {
  try {
    return await requestApi<MarketingPlan[]>("/api/v1/public/plans")
  } catch {
    return fallbackPlans
  }
}
