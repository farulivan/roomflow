import type { Order } from "./order"

type PaymentInput = Pick<Order, "paymentStatus" | "status" | "amount">

/**
 * A declined payment on an order that still owes money, so someone has to
 * collect it. That stays true after the order is completed; a cancelled
 * order owes nothing, and a complimentary one never did. It's also exactly
 * when staff can mark the payment collected.
 */
export function needsPaymentFollowUp(order: PaymentInput): boolean {
  return (
    order.paymentStatus === "Failed" &&
    order.status !== "Cancelled" &&
    order.amount > 0
  )
}
