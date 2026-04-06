import { DollarSign, Store, TrendingUp, Users } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const tenantRows = [
  {
    shop: "Ma Aye Shop",
    plan: "Pro",
    orders: "847",
    mrr: "5,000 MMK",
    joined: "Jan 5, 2025",
    active: "2 min ago",
    status: "Active",
  },
  {
    shop: "Aung Beauty Store",
    plan: "Lifetime",
    orders: "1,243",
    mrr: "Lifetime",
    joined: "Dec 20, 2024",
    active: "1 hr ago",
    status: "Active",
  },
  {
    shop: "Ko Zaw Electronics",
    plan: "Trial",
    orders: "34",
    mrr: "Trial",
    joined: "Mar 26, 2025",
    active: "Yesterday",
    status: "Trial",
  },
  {
    shop: "Phyo Cosmetics",
    plan: "Pro",
    orders: "290",
    mrr: "5,000 MMK",
    joined: "Feb 10, 2025",
    active: "2 days ago",
    status: "Overdue",
  },
]

export default function PlatformHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Run the platform, not just a single admin page"
        description="This portal is now structured as a real operator workspace with separate routes for tenant management, subscriptions, support, and settings."
      />

      <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Total registered shops"
            value="89"
            detail="vs 82 last month"
            delta="+7 shops"
            icon={Store}
            accent="sunset"
          />
          <DashboardStatCard
            title="MRR"
            value="260K"
            detail="52 Pro subscribers"
            delta="+18%"
            icon={DollarSign}
            accent="teal"
          />
          <DashboardStatCard
            title="Active today"
            value="61"
            detail="of 89 total shops"
            delta="+12%"
            icon={Users}
            accent="ink"
          />
          <DashboardStatCard
            title="Churn rate"
            value="2.3%"
            detail="Best month so far"
            delta="-0.4%"
            icon={TrendingUp}
            accent="default"
          />
        </div>
      </section>

      <section id="tenants" className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-black/6 bg-white xl:col-span-2">
          <CardHeader>
            <CardDescription>Revenue overview</CardDescription>
            <CardTitle>MMK collected by day this week</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid h-36 grid-cols-7 items-end gap-4">
              {[52, 68, 58, 84, 78, 60, 100].map((height, index) => (
                <div key={height} className="flex flex-col items-center gap-3">
                  <div
                    className={`w-full rounded-t-[5px] ${
                      index === 6
                        ? "bg-[var(--fom-orange)]"
                        : "bg-[rgba(255,107,53,0.2)]"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span
                    className={`text-xs ${
                      index === 6 ? "font-semibold text-[var(--fom-orange)]" : "text-muted-foreground"
                    }`}
                  >
                    {index === 6 ? "Today" : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-black/6 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  This week
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[var(--fom-ink)]">
                  260,000 <span className="text-sm font-medium text-muted-foreground">MMK</span>
                </p>
              </div>
              <div className="ml-auto text-sm font-semibold text-[#16A34A]">
                +18% vs last week
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="revenue" className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/6 bg-white">
          <CardHeader>
            <CardDescription>Plan breakdown</CardDescription>
            <CardTitle>Subscription mix</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: "Pro Monthly", count: "52 shops · 58%", width: "58%", color: "bg-[var(--fom-orange)]" },
              { label: "Lifetime", count: "21 shops · 24%", width: "24%", color: "bg-[var(--fom-teal)]" },
              { label: "Free Trial", count: "16 shops · 18%", width: "18%", color: "bg-[#F59E0B]" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--fom-ink)]">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-[5px] rounded-full bg-[#eef0f4]">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-black/6 bg-white">
          <CardHeader>
            <CardDescription>Platform health</CardDescription>
            <CardTitle>Operational summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              ["Active shops", "61 / 89"],
              ["Trials expiring", "3 this week"],
              ["Overdue payments", "1 shop"],
              ["Avg orders / shop", "34 / day"],
            ].map((row) => (
              <div
                key={row[0]}
                className="flex items-center justify-between rounded-2xl bg-[#f7f8fc] p-4"
              >
                <span className="text-sm text-muted-foreground">{row[0]}</span>
                <span className="text-sm font-semibold text-[var(--fom-ink)]">
                  {row[1]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="reliability" className="grid gap-4">
        <Card className="border border-black/6 bg-white">
          <CardHeader>
            <CardDescription>Recent clients</CardDescription>
            <CardTitle>Latest sign-ups and activity</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#fdfeff] text-left text-xs uppercase tracking-[0.06em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Shop</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">MRR</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody>
                {tenantRows.map((tenant) => (
                  <tr key={tenant.shop} className="border-t border-black/6 text-sm">
                    <td className="px-5 py-4 font-semibold text-[var(--fom-ink)]">
                      {tenant.shop}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline">{tenant.plan}</Badge>
                    </td>
                    <td className="px-5 py-4">{tenant.status}</td>
                    <td className="px-5 py-4">{tenant.orders}</td>
                    <td className="px-5 py-4">{tenant.mrr}</td>
                    <td className="px-5 py-4">{tenant.joined}</td>
                    <td className="px-5 py-4">{tenant.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
