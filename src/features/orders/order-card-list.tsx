import { Link, useLocation } from "react-router"

import { PaymentBadge } from "@/components/shared/payment-badge"
import { RoomTag } from "@/components/shared/room-tag"
import { SlaBadge } from "@/components/shared/sla-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Order } from "@/domain/order"
import { isSlaOverdue } from "@/domain/sla"
import { formatOrderAmount, formatRelativeTime } from "@/lib/format"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

import { OrderActions } from "./order-actions"

interface OrderCardListProps {
  orders: Order[]
  now: Date
}

const cardTreatment = cn(
  "relative rounded-lg border border-l-2 border-l-transparent bg-card p-3 transition-colors",
  "hover:bg-muted/50 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
  "data-[overdue=true]:border-l-alert data-[overdue=true]:bg-alert/[0.04]"
)

/**
 * Mobile counterpart to OrdersTable: same data, one card per order. The
 * whole card is clickable through a stretched link (the order ID's ::after
 * covers the card), which keeps the actions menu a sibling of the link
 * rather than an interactive element nested inside it.
 */
export function OrderCardList({ orders, now }: OrderCardListProps) {
  const location = useLocation()

  return (
    <ul className="flex flex-col gap-2">
      {orders.map((order) => {
        const overdue = isSlaOverdue(order, now)

        return (
          <li key={order.id} data-overdue={overdue} className={cardTreatment}>
            <div className="flex items-center justify-between gap-2">
              <Link
                to={paths.order(order.hotelId, order.id, location.search)}
                data-order-link={order.id}
                className="font-mono text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
              >
                {order.id}
              </Link>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={order.status} />
                <SlaBadge order={order} now={now} />
                <div className="relative z-10">
                  <OrderActions order={order} variant="row" />
                </div>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="font-medium">{order.guestName}</span>
              <RoomTag room={order.roomNumber} />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {order.service}
                {order.quantity > 1 && ` × ${order.quantity}`}
              </span>
              <span
                className={cn(
                  "font-mono",
                  order.amount === 0
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {formatOrderAmount(order.amount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(order.orderTime, now)}
              </span>
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
