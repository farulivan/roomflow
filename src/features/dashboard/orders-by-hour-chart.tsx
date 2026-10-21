import { useId } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { HourBucket } from "@/domain/metrics"
import { formatCurrency } from "@/lib/format"

interface OrdersByHourChartProps {
  data: HourBucket[]
}

interface HourPoint extends HourBucket {
  label: string
}

const chartConfig = {
  orders: { label: "Orders" },
} satisfies ChartConfig

/** Area chart, one series (order count per hour); revenue rides along in the tooltip. */
export function OrdersByHourChart({ data }: OrdersByHourChartProps) {
  const gradientId = useId()
  const points: HourPoint[] = data.map((bucket) => ({
    ...bucket,
    label: `${String(bucket.hour).padStart(2, "0")}:00`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by hour</CardTitle>
        <CardDescription>Today's activity so far</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={24}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-medium tabular-nums">
                        {value} {value === 1 ? "order" : "orders"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatCurrency((item.payload as HourPoint).revenue)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
