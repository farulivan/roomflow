import { Amount } from "@/components/shared/amount"
import type { Order } from "@/domain/order"
import { formatOrderAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

interface OrderAmountProps {
  order: Pick<Order, "amount" | "status">
  className?: string
}

/**
 * An order's price as the list, cards and drawer show it: muted when
 * nothing is charged, and struck through when a priced order was cancelled.
 */
export function OrderAmount({ order, className }: OrderAmountProps) {
  const cancelled = order.status === "Cancelled"

  return (
    <Amount
      className={cn(
        order.amount === 0 || cancelled
          ? "text-muted-foreground"
          : "text-foreground",
        cancelled && order.amount > 0 && "line-through",
        className
      )}
    >
      {formatOrderAmount(order.amount)}
    </Amount>
  )
}
