"use client"

import { Bar, BarChart, XAxis } from "recharts"

import { formatCurrency } from "@/lib/platform/format"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"

type ShopReportChartProps = {
  data: Array<{
    label: string
    revenue: number
  }>
  colorVar?: string
}

export function ShopReportChart({
  data,
  colorVar = "var(--fom-teal)",
}: ShopReportChartProps) {
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: colorVar,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="mt-4 h-36 w-full">
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
              hideLabel
              formatter={(value) => (
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
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
          fillOpacity={0.8}
        />
      </BarChart>
    </ChartContainer>
  )
}
