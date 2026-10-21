import { useId } from "react"
import { Area, AreaChart, XAxis } from "recharts"

import { Amount } from "@/components/shared/amount"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { HourBucket } from "@/domain/metrics"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

interface OrdersTodayCardProps {
  ordersByHour: HourBucket[]
  revenueToday: number
  avgOrderValue: number
  className?: string
}

interface HourPoint extends HourBucket {
  label: string
}

const chartConfig = {
  orders: { label: "Orders" },
} satisfies ChartConfig

/**
 * The day at a glance: today's order count, what it earned, and how it was
 * spread over the hours. The count is the sum of the hourly buckets, so the
 * figure and the chart can never disagree.
 */
export function OrdersTodayCard({
  ordersByHour,
  revenueToday,
  avgOrderValue,
  className,
}: OrdersTodayCardProps) {
  const gradientId = useId()
  const ordersToday = ordersByHour.reduce(
    (sum, bucket) => sum + bucket.orders,
    0
  )
  const points: HourPoint[] = ordersByHour.map((bucket) => ({
    ...bucket,
    label: `${String(bucket.hour).padStart(2, "0")}:00`,
  }))
  // Labels every three hours, never on the first or last point: the chart
  // runs edge to edge, so a label there would be cut in half.
  const ticks = points
    .slice(1, -1)
    .filter((point) => point.hour % 3 === 0)
    .map((point) => point.label)

  return (
    <Card className={cn("pb-0", className)}>
      <CardHeader>
        <CardTitle>Orders today</CardTitle>
        <p className="text-figure tabular-nums">{ordersToday}</p>
        <p className="text-sm text-muted-foreground">
          <Amount className="text-foreground">
            {formatCurrency(revenueToday)}
          </Amount>{" "}
          revenue ・{" "}
          <Amount className="text-foreground">
            {formatCurrency(avgOrderValue)}
          </Amount>{" "}
          avg order
        </p>
      </CardHeader>

      <ChartContainer
        config={chartConfig}
        className="mt-auto aspect-auto h-44 w-full"
      >
        <AreaChart
          data={points}
          margin={{ top: 8, right: 0, bottom: 8, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            ticks={ticks}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium tabular-nums">
                      {value} {value === 1 ? "order" : "orders"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
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
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
