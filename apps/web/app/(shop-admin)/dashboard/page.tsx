import { ArrowRight, PackageCheck, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import { Badge } from "@workspace/ui/components/badge"
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
  ["ORD-2398", "Daw Aye Aye", "Summer Dress x3", "Delivered", "54,000 MMK"],
]

export default function ShopDashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        eyebrow="Dashboard"
        title="Operate the shop from one high-signal workspace"
        description="The dashboard is tuned for daily speed: revenue, orders, customer activity, dispatch status, and the next actions all stay visible without a lot of scrolling."
        actions={
          <Button
            asChild
            size="sm"
            className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
          >
            <Link href="/dashboard/orders">
              View orders
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Today</Badge>
        <Badge variant="outline">23 active orders</Badge>
        <Badge variant="outline">2 drivers on route</Badge>
        <Badge variant="outline">34% repeat buyers</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-none">
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
              <div
                key={item[0]}
                className="rounded-2xl border border-black/6 bg-[#fcfbf9] p-4"
              >
                <p className="text-sm font-semibold text-foreground">{item[0]}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{item[1]}</p>
                <p className="mt-2.5 text-[12px] leading-6 text-muted-foreground">
                  {item[2]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
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
              <div
                key={item}
                className="rounded-2xl border border-black/6 bg-[#fcfbf9] p-4 text-[12px] leading-6 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-none">
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

        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Performance snapshot</CardDescription>
            <CardTitle>Today compared with last week</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              ["Revenue pace", "Ahead by 22%"],
              ["Delivery completion", "48% of today's orders"],
              ["Customer response time", "12 min median"],
              ["Best performing channel", "Messenger paste flow"],
            ].map((item) => (
              <div
                key={item[0]}
                className="flex items-center justify-between rounded-2xl border border-black/6 bg-[#fcfbf9] p-4"
              >
                <span className="text-[12px] text-muted-foreground">{item[0]}</span>
                <span className="text-[12px] font-semibold text-foreground">
                  {item[1]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
