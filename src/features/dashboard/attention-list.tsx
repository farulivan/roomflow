import { cva } from "class-variance-authority"
import {
  AlarmClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ShieldQuestion,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router"

import { RoomTag } from "@/components/shared/room-tag"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Order } from "@/domain/order"
import type { AttentionItem, AttentionReason } from "@/domain/metrics"
import { minutesOverdue } from "@/domain/sla"
import { formatRelativeTime } from "@/lib/format"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

interface AttentionListProps {
  items: AttentionItem[]
  now: Date
}

const reasonBadgeVariants = cva("gap-1 border font-medium", {
  variants: {
    reason: {
      sla: "border-alert/40 bg-alert/10 text-alert",
      approval:
        "border-status-approval/30 bg-status-approval/10 text-status-approval",
      payment: "border-destructive/30 bg-destructive/8 text-destructive",
    } satisfies Record<AttentionReason, string>,
  },
})

const REASON_ICON: Record<AttentionReason, LucideIcon> = {
  sla: AlarmClock,
  approval: ShieldQuestion,
  payment: CreditCard,
}

function reasonLabel(reason: AttentionReason, order: Order, now: Date): string {
  switch (reason) {
    case "sla":
      return `Overdue ${minutesOverdue(order, now)}m`
    case "approval":
      return "Approval"
    case "payment":
      return "Payment failed"
  }
}

/**
 * The day's most urgent orders — same triage order `computeMetrics` already
 * produced (SLA breaches, then pending approval, then failed payments).
 */
export function AttentionList({ items, now }: AttentionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          Overdue, awaiting approval, or payment issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-status-done" aria-hidden />
            All clear. Nothing needs attention right now.
          </div>
        ) : (
          <div className="divide-y">
            {items.map(({ order, reason }) => {
              const Icon = REASON_ICON[reason]

              return (
                <Link
                  key={order.id}
                  to={paths.order(order.hotelId, order.id)}
                  className="-mx-2 flex items-center justify-between gap-3 rounded px-2 py-2 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(reasonBadgeVariants({ reason }))}
                    >
                      <Icon className="size-3" aria-hidden />
                      {reasonLabel(reason, order, now)}
                    </Badge>
                    <span className="shrink-0 font-mono text-sm">
                      {order.id}
                    </span>
                    <span className="truncate text-sm">{order.guestName}</span>
                    <RoomTag
                      room={order.roomNumber}
                      className="hidden shrink-0 sm:inline-flex"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {formatRelativeTime(order.orderTime, now)}
                    <ChevronRight className="size-4" aria-hidden />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
