"use client"

import { Bar, BarChart, XAxis } from "recharts"

import { formatCurrency } from "@/lib/platform/format"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"

const chartConfig = {
  amount: {
    label: "Revenue",
    color: "var(--fom-orange)",
  },
} satisfies ChartConfig

type DashboardRevenueChartProps = {
  data: Array<{
    date: string
    label: string
    amount: number
  }>
}

export function DashboardRevenueChart({ data }: DashboardRevenueChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-36 w-full pt-2">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="label"
          tickLine={false}
          tickMargin={8}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--fom-ink)" }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel // Hides the top "label" (weekday name) since it repeats
              formatter={(value, name) => (
                <div className="flex min-w-[120px] items-center justify-between text-xs">
                  <span className="text-muted-foreground mr-4">Revenue</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="amount"
          fill="var(--color-amount)"
          radius={[4, 4, 0, 0]}
          fillOpacity={0.8}
        />
      </BarChart>
    </ChartContainer>
  )
}
