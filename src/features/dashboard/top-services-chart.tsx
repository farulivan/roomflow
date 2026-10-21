import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

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
import type { ServiceStat } from "@/domain/metrics"
import { formatCurrency } from "@/lib/format"

interface TopServicesChartProps {
  data: ServiceStat[]
}

const chartConfig = {
  count: { label: "Orders" },
} satisfies ChartConfig

/** Horizontal bar chart, one series (order count); revenue rides along in the tooltip. */
export function TopServicesChart({ data }: TopServicesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top services today</CardTitle>
        <CardDescription>Ranked by order count</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No orders yet today.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="service"
                width={110}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-medium tabular-nums">
                          {value} {value === 1 ? "order" : "orders"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(
                            (item.payload as ServiceStat).revenue
                          )}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                barSize={18}
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-muted-foreground font-mono text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
