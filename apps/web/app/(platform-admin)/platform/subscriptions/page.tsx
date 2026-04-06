import { CreditCard, TrendingUp, WalletCards } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function PlatformSubscriptionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Subscriptions"
        title="Billing and plan health"
        description="This route gives the platform owner a dedicated place to manage plan mix, MRR, renewals, and overdue accounts."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <DashboardStatCard
          title="MRR"
          value="260K"
          detail="Monthly recurring revenue from active Pro shops."
          icon={WalletCards}
          accent="sunset"
        />
        <DashboardStatCard
          title="Active paid shops"
          value="52"
          detail="Paying tenants with an active plan."
          icon={CreditCard}
          accent="teal"
        />
        <DashboardStatCard
          title="Growth"
          value="+18%"
          detail="Recurring revenue change versus the previous window."
          icon={TrendingUp}
          accent="ink"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {[
          ["Starter", "Best for early shops", "Up to 200 orders per month"],
          ["Pro", "Most popular", "Unlimited orders and advanced reporting"],
          ["Enterprise", "Large shops", "Multi-user and operator support"],
        ].map((plan) => (
          <Card key={plan[0]} className="border border-black/6 shadow-none">
            <CardHeader className="pb-3">
              <CardDescription>{plan[1]}</CardDescription>
              <CardTitle>{plan[0]}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
              {plan[2]}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
