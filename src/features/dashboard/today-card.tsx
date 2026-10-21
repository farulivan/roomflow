import { ChevronRight } from "lucide-react"
import { Link } from "react-router"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Metrics } from "@/domain/metrics"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

interface TodayCardProps {
  metrics: Metrics
  hotelId: string
  className?: string
}

interface SummaryRowProps {
  label: string
  value: number
  /** "warning" flags a count that needs attention (SLA breaches > 0). */
  tone?: "default" | "warning"
  /** When set, the row links to a pre-filtered view. */
  to?: string
}

function SummaryRow({ label, value, tone = "default", to }: SummaryRowProps) {
  const content = (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "ml-auto tabular-nums",
          tone === "warning" && "text-alert"
        )}
      >
        {value}
      </span>
      {/* Every row keeps the chevron's slot, so the values line up. */}
      <span className="size-4 shrink-0">
        {to && (
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        )}
      </span>
    </>
  )
  const rowClass = "-mx-2 flex h-10 items-center gap-2 rounded-lg px-2"

  return (
    <li>
      {to ? (
        <Link
          to={to}
          className={cn(
            rowClass,
            "transition-colors hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
        >
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  )
}

/** Today's counts as one short list, with a way into the orders behind them. */
export function TodayCard({ metrics, hotelId, className }: TodayCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="text-body">
          <SummaryRow label="Open orders" value={metrics.openOrders} />
          <SummaryRow
            label="SLA breaches"
            value={metrics.slaBreaches}
            tone={metrics.slaBreaches > 0 ? "warning" : "default"}
            to={paths.orders(hotelId, "?sla=overdue")}
          />
          <SummaryRow label="Active guests" value={metrics.activeGuests} />
          <SummaryRow label="Completed" value={metrics.completedToday} />
        </ul>
      </CardContent>
      <CardFooter className="bg-transparent py-3">
        <Link
          to={paths.orders(hotelId)}
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          View all orders
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </CardFooter>
    </Card>
  )
}
