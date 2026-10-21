import { useEffect, type ReactNode } from "react"
import { AlarmClock, Loader2, SearchX, TriangleAlert } from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router"

import { ErrorState } from "@/components/shared/error-state"
import { PaymentBadge } from "@/components/shared/payment-badge"
import { RoomTag } from "@/components/shared/room-tag"
import { SlaBadge } from "@/components/shared/sla-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import type { Order } from "@/domain/order"
import { needsPaymentFollowUp } from "@/domain/payment"
import {
  isSlaOverdue,
  minutesOverdue,
  minutesSinceOrdered,
  slaTargetMinutes,
} from "@/domain/sla"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { track } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import {
  formatDateTime,
  formatOrderAmount,
  formatRelativeTime,
} from "@/lib/format"
import { paths } from "@/lib/paths"
import { useNow } from "@/lib/use-now"

import { useCollectPayment } from "./mutations"
import { OrderActions } from "./order-actions"
import { useOrder } from "./queries"

interface DetailRowProps {
  label: string
  children: ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/**
 * A declined payment that still has to be collected, and the button the
 * front desk uses once it has been. Collecting it also takes the order off
 * the dashboard's "Needs attention" list.
 */
function PaymentFollowUp({ order }: { order: Order }) {
  const collectPayment = useCollectPayment()

  return (
    <Alert variant="destructive" className="mb-3 border-destructive/30">
      <TriangleAlert />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        <p>
          {order.status === "Completed"
            ? "Delivered, but the payment still needs collecting."
            : "The card was declined. Staff can go ahead; the front desk collects it before checkout."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2"
          disabled={collectPayment.isPending}
          onClick={() => collectPayment.mutate(order)}
        >
          {collectPayment.isPending && <Loader2 className="animate-spin" />}
          Mark payment collected
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Full order detail with lifecycle actions, routed at
 * /hotels/:hotelId/orders/:orderId.
 * Mounting this component IS the open signal — React Router only renders it
 * when the path matches — so closing means navigating back to the list
 * rather than flipping local state. A successful action updates the cache
 * in place, so the sheet stays open and staff can chain actions (Acknowledge
 * then Start) without reopening it.
 */
export function OrderDetailsSheet() {
  const hotel = useCurrentHotel()
  const { orderId = "" } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const now = useNow()
  const query = useOrder(hotel.id, orderId)
  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404

  // Keyed on the id, not the data object itself, so this fires once per
  // order opened rather than on every poll or optimistic status update
  // (both produce a new object with the same id).
  useEffect(() => {
    if (query.data) {
      track("order_opened", {
        orderId: query.data.id,
        status: query.data.status,
      })
    }
    // Deliberately excludes query.data: re-firing on every poll or
    // optimistic status update would track the same "open" repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.id])

  const close = () => void navigate(paths.orders(hotel.id, location.search))

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent
        className="w-full sm:max-w-md"
        // An in-flight action disables the button that triggered it; the
        // browser then drops focus to <body>, which Radix's dismissable
        // layer reads as "focus left the sheet" and closes it. Escape and
        // overlay-click dismissal are untouched — only this specific
        // focus-outside trigger is suppressed.
        onFocusOutside={(event) => event.preventDefault()}
        // The sheet is opened by a route, not by a Radix trigger, so Radix
        // has nothing to hand focus back to and drops it on <body>. Return
        // it to this order's link in the list (the visible one: the table
        // and the mobile cards are both rendered), when it's on the page.
        onCloseAutoFocus={(event) => {
          const link = [
            ...document.querySelectorAll<HTMLElement>(
              `[data-order-link="${CSS.escape(orderId)}"]`
            ),
          ].find((element) => element.offsetParent !== null)
          if (!link) return
          event.preventDefault()
          link.focus()
        }}
      >
        <SheetHeader>
          <SheetTitle className="font-mono">{orderId}</SheetTitle>
          <SheetDescription>Order details</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {query.isPending && (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          )}

          {isNotFound && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <SearchX className="size-6 text-muted-foreground" aria-hidden />
              <p className="font-medium">
                Order {orderId} isn't in {hotel.name}
              </p>
              <p className="text-sm text-muted-foreground">
                It may belong to another hotel, or the link is wrong.
              </p>
            </div>
          )}

          {query.isError && !isNotFound && (
            <ErrorState
              title="Unable to load this order."
              onRetry={() => void query.refetch()}
            />
          )}

          {query.data && isSlaOverdue(query.data, now) && (
            <Alert className="mb-3 border-alert/40 bg-alert/[0.06]">
              <AlarmClock className="text-alert" />
              <AlertTitle>Past SLA</AlertTitle>
              <AlertDescription>
                Waiting {minutesSinceOrdered(query.data, now)}m,{" "}
                {minutesOverdue(query.data, now)}m over the{" "}
                {slaTargetMinutes(query.data)}-minute{" "}
                {query.data.service.toLowerCase()} target.
              </AlertDescription>
            </Alert>
          )}

          {query.data && needsPaymentFollowUp(query.data) && (
            <PaymentFollowUp order={query.data} />
          )}

          {query.data && (
            <dl className="divide-y">
              <DetailRow label="Order ID">
                <span className="font-mono">{query.data.id}</span>
              </DetailRow>
              <DetailRow label="Guest">{query.data.guestName}</DetailRow>
              <DetailRow label="Room">
                <RoomTag room={query.data.roomNumber} />
              </DetailRow>
              <DetailRow label="Service">
                {query.data.service}
                {query.data.quantity > 1 && ` × ${query.data.quantity}`}
              </DetailRow>
              <DetailRow label="Amount">
                <span className="font-mono">
                  {formatOrderAmount(query.data.amount)}
                </span>
              </DetailRow>
              <DetailRow label="Special request">
                {query.data.specialRequest || (
                  <em className="text-muted-foreground">None</em>
                )}
              </DetailRow>
              <DetailRow label="Placed">
                {formatDateTime(query.data.orderTime)}{" "}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(query.data.orderTime, now)})
                </span>
              </DetailRow>
              <DetailRow label="Status">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={query.data.status} />
                  <SlaBadge order={query.data} now={now} />
                </div>
              </DetailRow>
              <DetailRow label="Payment">
                <PaymentBadge status={query.data.paymentStatus} />
              </DetailRow>
            </dl>
          )}
        </div>

        {query.data && (
          <SheetFooter className="border-t">
            <OrderActions order={query.data} variant="detail" />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
