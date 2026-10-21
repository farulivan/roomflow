import { cva } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/domain/order"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva("border font-medium", {
  variants: {
    status: {
      // The only solid status: New is the queue staff work from.
      New: "border-transparent bg-primary text-primary-foreground",
      Acknowledged:
        "border-status-acknowledged/30 bg-status-acknowledged/10 text-status-acknowledged",
      "In Progress":
        "border-status-progress/30 bg-status-progress/10 text-status-progress",
      "Pending Approval":
        "border-status-approval/30 bg-status-approval/10 text-status-approval",
      Completed: "border-status-done/25 bg-status-done/8 text-status-done",
      Cancelled: "border-border bg-transparent text-muted-foreground",
    } satisfies Record<OrderStatus, string>,
  },
})

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

/** Color-coded order status chip; color always pairs with the status text. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusBadgeVariants({ status }), className)}
    >
      {status}
    </Badge>
  )
}
