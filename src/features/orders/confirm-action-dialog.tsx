import { useState } from "react"
import { CircleAlert, Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Order } from "@/domain/order"
import type { OrderAction } from "@/domain/order-status"
import { ApiError } from "@/lib/api-client"

interface ConfirmActionDialogProps {
  order: Order
  action: OrderAction
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason?: string) => void
  isPending: boolean
  /** The last attempt's failure; the dialog stays open to show it. */
  error: Error | null
}

/**
 * Confirmation step shared by every destructive lifecycle action (Cancel,
 * Reject). Controlled by ConfirmActionProvider — this component only asks
 * the question and reports back what the user decided; it never touches
 * the mutation itself.
 */
export function ConfirmActionDialog({
  order,
  action,
  open,
  onOpenChange,
  onConfirm,
  isPending,
  error,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState("")
  // Clear the draft reason once the dialog has fully closed, so the next
  // confirmation — possibly for a different action — starts blank. Adjusting
  // state while rendering (rather than in an effect) applies it in the same
  // commit: https://react.dev/learn/you-might-not-need-an-effect
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setReason("")
  }

  const isReject = action.label === "Reject"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action.label} order <span className="font-mono">{order.id}</span>?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isReject
              ? "The request will be declined and the guest's booking stays unchanged."
              : "The guest's request will be closed and cannot be reopened."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="action-reason">Reason (optional)</Label>
          <Textarea
            id="action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add a short note for the log…"
            disabled={isPending}
          />
        </div>

        {error && !isPending && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertTitle>
              Couldn't {action.label.toLowerCase()} {order.id}
            </AlertTitle>
            <AlertDescription>
              {error instanceof ApiError
                ? error.message
                : "Check your connection and try again."}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go back</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // AlertDialogAction closes on click by default; hold it open
              // until the server answers so the pending state is visible
              // and a failure can be shown right here.
              event.preventDefault()
              onConfirm(reason.trim() || undefined)
            }}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {error ? "Try again" : action.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
