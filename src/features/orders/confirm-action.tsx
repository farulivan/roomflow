/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import type { Order } from "@/domain/order"
import type { OrderAction } from "@/domain/order-status"

import { ConfirmActionDialog } from "./confirm-action-dialog"
import { useUpdateOrderStatus } from "./mutations"

type RequestConfirmation = (order: Order, action: OrderAction) => void

const ConfirmActionContext = React.createContext<
  RequestConfirmation | undefined
>(undefined)

interface PendingConfirmation {
  order: Order
  action: OrderAction
}

/**
 * Owns the one confirmation dialog for actions that ask first on the
 * orders page. It lives here, above the list, rather than inside each row: a row
 * can unmount at any time (a poll or a new order pushes it to page 2), and
 * a dialog inside it would vanish with a half-typed reason. The dialog
 * keeps its own copy of the order for the same reason.
 */
export function ConfirmActionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const mutation = useUpdateOrderStatus()
  const [pending, setPending] = React.useState<PendingConfirmation | null>(null)
  const [open, setOpen] = React.useState(false)

  const { reset } = mutation
  const requestConfirmation = React.useCallback<RequestConfirmation>(
    (order, action) => {
      reset()
      setPending({ order, action })
      setOpen(true)
    },
    [reset]
  )

  const confirm = (reason?: string) => {
    if (!pending) return
    mutation.mutate({ ...pending, reason }, { onSuccess: () => setOpen(false) })
  }

  return (
    <ConfirmActionContext.Provider value={requestConfirmation}>
      {children}
      {pending && (
        <ConfirmActionDialog
          order={pending.order}
          action={pending.action}
          open={open}
          // While the server is deciding, the answer belongs to this dialog.
          onOpenChange={(next) => !mutation.isPending && setOpen(next)}
          onConfirm={confirm}
          isPending={mutation.isPending}
          error={mutation.error}
        />
      )}
    </ConfirmActionContext.Provider>
  )
}

/** Ask the user to confirm `action` on `order` before it runs. */
export function useConfirmAction(): RequestConfirmation {
  const context = React.useContext(ConfirmActionContext)

  if (context === undefined) {
    throw new Error(
      "useConfirmAction must be used within ConfirmActionProvider"
    )
  }

  return context
}
