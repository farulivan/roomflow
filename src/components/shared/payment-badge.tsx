import { cva } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import type { PaymentStatus } from "@/domain/order"
import { cn } from "@/lib/utils"

const paymentBadgeVariants = cva("gap-1.5 border", {
  variants: {
    status: {
      Paid: "border-status-done/30 bg-status-done/8 text-status-done",
      Pending: "border-brass/40 bg-brass/10 text-brass-ink",
      // Solid, not subtle: a failed payment is a problem to act on, not
      // just informational.
      Failed:
        "border-transparent bg-destructive text-white dark:text-background",
    } satisfies Record<PaymentStatus, string>,
  },
})

interface PaymentBadgeProps {
  status: PaymentStatus
  className?: string
}

export function PaymentBadge({ status, className }: PaymentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(paymentBadgeVariants({ status }), className)}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {status}
    </Badge>
  )
}
