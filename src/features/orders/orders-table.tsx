import { Link, useLocation, useNavigate } from "react-router"

import { PaymentBadge } from "@/components/shared/payment-badge"
import { RoomTag } from "@/components/shared/room-tag"
import { SlaBadge } from "@/components/shared/sla-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Order } from "@/domain/order"
import { isSlaOverdue } from "@/domain/sla"
import {
  formatDateTime,
  formatOrderAmount,
  formatRelativeTime,
} from "@/lib/format"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

import { OrderActions } from "./order-actions"

interface OrdersTableProps {
  orders: Order[]
  now: Date
}

/** Row background/rail treatment shared by the default and overdue states. */
const rowTreatment = cn(
  "cursor-pointer border-l-2 border-l-transparent transition-colors hover:bg-muted/50",
  "data-[overdue=true]:border-l-alert data-[overdue=true]:bg-alert/[0.04] data-[overdue=true]:hover:bg-alert/[0.07]"
)

export function OrdersTable({ orders, now }: OrdersTableProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="min-w-[760px]">
        <TableCaption className="sr-only">Guest service orders</TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="w-10 px-2">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const overdue = isSlaOverdue(order, now)
            const detailsHref = paths.order(
              order.hotelId,
              order.id,
              location.search
            )

            return (
              <TableRow
                key={order.id}
                data-overdue={overdue}
                className={rowTreatment}
                onClick={(event) => {
                  // React bubbles events from portals (the row's menu) up
                  // the component tree, not the DOM — so a click can reach
                  // this handler without landing inside the row at all.
                  if (!event.currentTarget.contains(event.target as Node))
                    return
                  if ((event.target as HTMLElement).closest("a,button")) return
                  void navigate(detailsHref)
                }}
              >
                <TableCell className="font-mono">
                  <Link
                    to={detailsHref}
                    data-order-link={order.id}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {order.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className="block max-w-[8rem] truncate"
                    title={order.guestName}
                  >
                    {order.guestName}
                  </span>
                </TableCell>
                <TableCell>
                  <RoomTag room={order.roomNumber} />
                </TableCell>
                <TableCell>
                  <span
                    className="block max-w-[7rem] truncate"
                    title={
                      order.quantity > 1
                        ? `${order.service} × ${order.quantity}`
                        : order.service
                    }
                  >
                    {order.service}
                    {order.quantity > 1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        × {order.quantity}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell title={formatDateTime(order.orderTime)}>
                  {formatRelativeTime(order.orderTime, now)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span
                    className={cn(
                      order.amount === 0 && "text-muted-foreground"
                    )}
                  >
                    {formatOrderAmount(order.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    <SlaBadge order={order} now={now} />
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell className="px-2">
                  <OrderActions order={order} variant="row" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
