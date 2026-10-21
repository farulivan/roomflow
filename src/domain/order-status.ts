import {
  EXTRA_BED_CAPACITY,
  type Order,
  type OrderStatus,
  type ServiceType,
} from "./order"
import { needsPaymentFollowUp } from "./payment"

/**
 * The order lifecycle as a transition map — the single source of truth for
 * which status changes are legal. The UI derives its action buttons from it
 * and the API rejects anything outside it, so the two can never disagree.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  New: ["Acknowledged", "Cancelled"],
  "Pending Approval": ["Acknowledged", "Cancelled"],
  Acknowledged: ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

/**
 * The status a newly placed order starts in. Extra Bed requests beyond room
 * capacity wait for a manager; everything else goes straight to the queue.
 */
export function initialStatusFor(
  service: ServiceType,
  quantity: number
): OrderStatus {
  return service === "Extra Bed" && quantity > EXTRA_BED_CAPACITY
    ? "Pending Approval"
    : "New"
}

/** Final statuses accept no further transitions. */
export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0
}

export interface OrderAction {
  /** Target status this action transitions the order to. */
  to: OrderStatus
  label: string
  /** Past-tense verb for confirmation feedback, e.g. "Order acknowledged". */
  doneLabel: string
  intent: "default" | "success" | "destructive"
  /**
   * Asks for confirmation before running: always for destructive actions,
   * and for some steps depending on the order (see actionsForOrder).
   */
  confirm: boolean
  /** Why a non-destructive step asks first, so the question can say so. */
  confirmReason?: "payment-declined"
}

/** The same Cancel step offered from New, Acknowledged and In Progress. */
const CANCEL: OrderAction = {
  to: "Cancelled",
  label: "Cancel",
  doneLabel: "cancelled",
  intent: "destructive",
  confirm: true,
}

const ACTIONS_BY_STATUS: Record<OrderStatus, readonly OrderAction[]> = {
  New: [
    {
      to: "Acknowledged",
      label: "Acknowledge",
      doneLabel: "acknowledged",
      intent: "default",
      confirm: false,
    },
    CANCEL,
  ],
  "Pending Approval": [
    {
      to: "Acknowledged",
      label: "Approve",
      doneLabel: "approved",
      intent: "default",
      confirm: false,
    },
    {
      to: "Cancelled",
      label: "Reject",
      doneLabel: "rejected",
      intent: "destructive",
      confirm: true,
    },
  ],
  Acknowledged: [
    {
      to: "In Progress",
      label: "Start",
      doneLabel: "started",
      intent: "default",
      confirm: false,
    },
    CANCEL,
  ],
  "In Progress": [
    {
      to: "Completed",
      label: "Complete",
      doneLabel: "completed",
      intent: "success",
      confirm: false,
    },
    CANCEL,
  ],
  Completed: [],
  Cancelled: [],
}

/** Actions staff may take on an order in the given status. */
export function actionsForStatus(status: OrderStatus): readonly OrderAction[] {
  return ACTIONS_BY_STATUS[status]
}

/**
 * The actions for this particular order: those for its status, except that
 * taking on an order whose payment was declined (Acknowledge, or Approve)
 * asks first. Staff can always go ahead; they just do it knowing the front
 * desk still has to collect.
 */
export function actionsForOrder(
  order: Pick<Order, "status" | "paymentStatus" | "amount">
): readonly OrderAction[] {
  const actions = actionsForStatus(order.status)
  if (!needsPaymentFollowUp(order)) return actions
  return actions.map((action) =>
    action.to === "Acknowledged"
      ? { ...action, confirm: true, confirmReason: "payment-declined" }
      : action
  )
}
