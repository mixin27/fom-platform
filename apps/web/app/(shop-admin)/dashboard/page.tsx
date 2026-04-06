import { ArrowRight, PackageCheck, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const recentOrders = [
  ["ORD-2403", "Daw Khin Myat", "Silk Longyi x2", "New", "45,000 MMK"],
  ["ORD-2402", "Ko Zaw Lin", "Men Shirt x1", "On the way", "21,500 MMK"],
  ["ORD-2401", "Ma Thin Zar", "Handbag x1", "Confirmed", "32,000 MMK"],
]

export default function ShopDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Run the shop from a focused workspace"
        description="This is the owner-facing entry point after sign in. It is separate from the platform admin console and organized around daily operational work."
        actions={
          <Button asChild className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
            <Link href="/dashboard/orders">
              View orders
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Today's revenue"
          value="485K"
          detail="MMK collected from delivered and confirmed orders."
          delta="+72K vs yesterday"
          icon={TrendingUp}
          accent="sunset"
        />
        <DashboardStatCard
          title="Orders today"
          value="23"
          detail="Across new, confirmed, delivery, and completed."
          delta="+4 vs yesterday"
          icon={PackageCheck}
          accent="teal"
        />
        <DashboardStatCard
          title="Active customers"
          value="89"
          detail="Customers with recent order activity and reachable contact info."
          delta="34% repeat"
          icon={Users}
          accent="ink"
        />
        <DashboardStatCard
          title="Delivery rate"
          value="48%"
          detail="Orders completed today out of all orders created today."
          delta="On track"
          icon={PackageCheck}
          accent="default"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardDescription>Today's pipeline</CardDescription>
            <CardTitle>Order movement by status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              ["New", "4 orders", "Need confirmation or customer follow-up"],
              ["Confirmed", "6 orders", "Ready for packing and dispatch"],
              ["Out for delivery", "2 orders", "Driver has already picked up"],
              ["Delivered", "11 orders", "Counted into today's revenue"],
            ].map((item) => (
              <div key={item[0]} className="rounded-2xl border border-black/6 bg-white p-4">
                <p className="font-semibold text-foreground">{item[0]}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item[1]}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item[2]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Owner actions</CardDescription>
            <CardTitle>What usually matters next</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              "Confirm chat-derived orders before noon dispatch.",
              "Use templates for payment and delivery reminders.",
              "Check customers with repeat COD cancellations.",
              "Review daily summary before closing the day.",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--fom-portal-surface)] p-4 text-sm leading-7 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Recent orders</CardDescription>
          <CardTitle>Latest activity from the shop portal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order[0]}>
                  <TableCell className="px-4 font-medium">{order[0]}</TableCell>
                  <TableCell>{order[1]}</TableCell>
                  <TableCell>{order[2]}</TableCell>
                  <TableCell>{order[3]}</TableCell>
                  <TableCell>{order[4]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
