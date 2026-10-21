import { AlarmClock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Order } from "@/domain/order"
import { isSlaOverdue, minutesOverdue } from "@/domain/sla"
import { cn } from "@/lib/utils"

interface SlaBadgeProps {
  order: Order
  now: Date
  className?: string
}

/** Renders nothing unless the order is currently breaching its SLA. */
export function SlaBadge({ order, now, className }: SlaBadgeProps) {
  if (!isSlaOverdue(order, now)) return null

  const overdueMinutes = minutesOverdue(order, now)

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-alert/40 bg-alert/10 text-alert", className)}
      aria-label={`${overdueMinutes} minutes past SLA`}
    >
      <AlarmClock className="size-3" aria-hidden />
      <span className="font-mono tabular-nums" aria-hidden>
        +{overdueMinutes}m
      </span>
    </Badge>
  )
}
