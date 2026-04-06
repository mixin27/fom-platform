import { BarChart3, CalendarRange, NotebookTabs } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Reports"
        title="Daily, weekly, and monthly summaries"
        description="This route is separated from the dashboard so reporting can grow without bloating the main operational workspace."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Daily summary"
          value="824K"
          detail="Revenue snapshot with pending and delivered counts."
          icon={NotebookTabs}
          accent="sunset"
        />
        <DashboardStatCard
          title="Weekly trend"
          value="+14.2%"
          detail="Compared with the previous weekly reporting window."
          icon={CalendarRange}
          accent="teal"
        />
        <DashboardStatCard
          title="Monthly view"
          value="3.9M"
          detail="Revenue and order trend for the current month."
          icon={BarChart3}
          accent="ink"
        />
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Report notes</CardDescription>
          <CardTitle>What the owner should review regularly</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            "Daily: watch delivery completion and unresolved new orders.",
            "Weekly: compare order volume against staffing and driver capacity.",
            "Monthly: identify recurring customers, high-value products, and margin pressure.",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-black/6 bg-white p-4 text-sm leading-7 text-muted-foreground">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
