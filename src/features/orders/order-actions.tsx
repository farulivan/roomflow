import { Loader2, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Order } from "@/domain/order"
import { actionsForOrder, type OrderAction } from "@/domain/order-status"
import { needsPaymentFollowUp } from "@/domain/payment"
import { cn } from "@/lib/utils"

import { useConfirmAction } from "./confirm-action"
import {
  useCollectPayment,
  useIsOrderUpdating,
  useUpdateOrderStatus,
} from "./mutations"

interface OrderActionsProps {
  order: Order
  /** "detail": buttons in the sheet footer. "row": a dropdown menu. */
  variant: "detail" | "row"
}

/** Extra styling layered on top of the base button variant, by intent. */
const INTENT_BUTTON_CLASSES: Record<OrderAction["intent"], string> = {
  default: "",
  success: "bg-success text-success-foreground hover:bg-success/90",
  destructive: "border-destructive/40 text-destructive hover:bg-destructive/10",
}

/**
 * Renders exactly the actions `actionsForOrder` allows for this order, with
 * no per-status branching here, so this component and the mock API can
 * never disagree about what's legal. Actions that need a confirmation hand
 * off to the page's shared confirm dialog.
 *
 * The row menu also carries the payment track: an order whose payment is
 * still owed offers "Mark payment collected", even once it's completed,
 * since a delivered-but-unpaid order is exactly when that's needed.
 */
export function OrderActions({ order, variant }: OrderActionsProps) {
  const mutation = useUpdateOrderStatus()
  const collectPayment = useCollectPayment()
  const requestConfirmation = useConfirmAction()
  const isPending = useIsOrderUpdating(order.id)

  const actions = actionsForOrder(order)
  const paymentOwed = needsPaymentFollowUp(order)

  const runAction = (action: OrderAction) => {
    if (action.confirm) {
      requestConfirmation(order, action)
      return
    }
    mutation.mutate({ order, action })
  }

  if (variant === "row") {
    if (actions.length === 0 && !paymentOwed) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${order.id}`}
            disabled={isPending}
            onClick={(event) => event.stopPropagation()}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MoreHorizontal />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // Wide enough for "Mark payment collected" on one line.
          className="min-w-48"
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.to}
              variant={
                action.intent === "destructive" ? "destructive" : "default"
              }
              disabled={isPending}
              onSelect={() => runAction(action)}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
          {paymentOwed && (
            <>
              {actions.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Payment
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled={isPending}
                onSelect={() => collectPayment.mutate({ order })}
              >
                Mark payment collected
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further actions. This order is {order.status}.
      </p>
    )
  }

  return (
    <div className="flex justify-end gap-2">
      {actions.map((action) => (
        <Button
          key={action.to}
          type="button"
          variant={action.intent === "destructive" ? "outline" : "default"}
          disabled={isPending}
          className={cn(INTENT_BUTTON_CLASSES[action.intent])}
          onClick={() => runAction(action)}
        >
          {isPending && <Loader2 className="animate-spin" />}
          {action.label}
        </Button>
      ))}
    </div>
  )
}
