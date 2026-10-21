import { Loader2, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Order } from "@/domain/order"
import {
  actionsForStatus,
  isFinalStatus,
  type OrderAction,
} from "@/domain/order-status"
import { cn } from "@/lib/utils"

import { useConfirmAction } from "./confirm-action"
import { useIsOrderUpdating, useUpdateOrderStatus } from "./mutations"

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
 * Renders exactly the transitions `actionsForStatus` allows for this order's
 * current status — no per-status branching here, so this component and the
 * mock API can never disagree about what's legal. Actions that need a
 * confirmation hand off to the page's shared confirm dialog.
 */
export function OrderActions({ order, variant }: OrderActionsProps) {
  const mutation = useUpdateOrderStatus()
  const requestConfirmation = useConfirmAction()
  const isPending = useIsOrderUpdating(order.id)

  const actions = actionsForStatus(order.status)

  const runAction = (action: OrderAction) => {
    if (action.confirm) {
      requestConfirmation(order, action)
      return
    }
    mutation.mutate({ order, action })
  }

  if (variant === "row") {
    if (isFinalStatus(order.status)) return null

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
