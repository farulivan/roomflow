import { SLA_TARGET_MINUTES, type Order } from "./order"

const MS_PER_MINUTE = 60_000

type SlaInput = Pick<Order, "status" | "orderTime" | "service">

/** Minutes this order's service may wait in "New" before breaching. */
export function slaTargetMinutes(order: Pick<Order, "service">): number {
  return SLA_TARGET_MINUTES[order.service]
}

/**
 * An order breaches its SLA when it has been waiting in "New" for longer
 * than its service's target. Later stages are considered in-hand by staff.
 */
export function isSlaOverdue(order: SlaInput, now: Date): boolean {
  if (order.status !== "New") return false
  return minutesSinceOrdered(order, now) > slaTargetMinutes(order)
}

/** Whole minutes elapsed since the guest placed the order. */
export function minutesSinceOrdered(
  order: Pick<Order, "orderTime">,
  now: Date
): number {
  const elapsed = now.getTime() - new Date(order.orderTime).getTime()
  return Math.floor(elapsed / MS_PER_MINUTE)
}

/** Whole minutes past the service's SLA target; 0 when not overdue. */
export function minutesOverdue(order: SlaInput, now: Date): number {
  if (!isSlaOverdue(order, now)) return 0
  return minutesSinceOrdered(order, now) - slaTargetMinutes(order)
}
