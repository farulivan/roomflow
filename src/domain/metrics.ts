import type { Order, ServiceType } from "./order"
import { isFinalStatus } from "./order-status"
import { needsPaymentFollowUp } from "./payment"
import { isSlaOverdue } from "./sla"

export interface ServiceStat {
  service: ServiceType
  count: number
  revenue: number
}

export interface HourBucket {
  /** Hour of the local day, 0–23. */
  hour: number
  orders: number
  revenue: number
}

export type AttentionReason = "sla" | "approval" | "payment"

export interface AttentionItem {
  order: Order
  reason: AttentionReason
}

export interface Metrics {
  /** Distinct rooms with a non-cancelled order today. */
  activeGuests: number
  /** Orders that have not reached a final status, regardless of age. */
  openOrders: number
  /** Paid, non-cancelled revenue for the local calendar day. */
  revenueToday: number
  completedToday: number
  /**
   * Revenue today divided by the paid orders behind it. Complimentary ($0)
   * services are left out so they don't drag the average down.
   */
  avgOrderValue: number
  slaBreaches: number
  /** Today's services ranked by order count, top five. */
  topServices: ServiceStat[]
  /** Today's activity per hour, from midnight through the current hour. */
  ordersByHour: HourBucket[]
  /** Orders needing staff attention right now, most urgent first. */
  attention: AttentionItem[]
}

const TOP_SERVICES_LIMIT = 5
const ATTENTION_LIMIT = 8

function isSameLocalDay(iso: string, now: Date): boolean {
  const date = new Date(iso)
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function computeMetrics(orders: readonly Order[], now: Date): Metrics {
  const today = orders.filter((order) => isSameLocalDay(order.orderTime, now))
  const todayActive = today.filter((order) => order.status !== "Cancelled")

  const paidToday = todayActive.filter(
    (order) => order.paymentStatus === "Paid"
  )
  const revenueToday = paidToday.reduce((sum, order) => sum + order.amount, 0)
  const chargedToday = paidToday.filter((order) => order.amount > 0)

  const serviceStats = new Map<ServiceType, ServiceStat>()
  for (const order of todayActive) {
    const stat = serviceStats.get(order.service) ?? {
      service: order.service,
      count: 0,
      revenue: 0,
    }
    stat.count += 1
    if (order.paymentStatus === "Paid") stat.revenue += order.amount
    serviceStats.set(order.service, stat)
  }

  const ordersByHour: HourBucket[] = Array.from(
    { length: now.getHours() + 1 },
    (_, hour) => ({ hour, orders: 0, revenue: 0 })
  )
  for (const order of todayActive) {
    const bucket = ordersByHour[new Date(order.orderTime).getHours()]
    if (bucket) {
      bucket.orders += 1
      if (order.paymentStatus === "Paid") bucket.revenue += order.amount
    }
  }

  const slaOverdue = orders.filter((order) => isSlaOverdue(order, now))
  const pendingApproval = orders.filter(
    (order) => order.status === "Pending Approval"
  )
  const failedPayments = orders.filter(needsPaymentFollowUp)

  const attention: AttentionItem[] = []
  const seen = new Set<string>()
  const addAttention = (order: Order, reason: AttentionReason) => {
    if (seen.has(order.id)) return
    seen.add(order.id)
    attention.push({ order, reason })
  }
  const oldestFirst = (a: Order, b: Order) =>
    a.orderTime.localeCompare(b.orderTime)
  for (const order of [...slaOverdue].sort(oldestFirst))
    addAttention(order, "sla")
  for (const order of [...pendingApproval].sort(oldestFirst))
    addAttention(order, "approval")
  for (const order of failedPayments) addAttention(order, "payment")

  return {
    activeGuests: new Set(todayActive.map((order) => order.roomNumber)).size,
    openOrders: orders.filter((order) => !isFinalStatus(order.status)).length,
    revenueToday,
    completedToday: today.filter((order) => order.status === "Completed")
      .length,
    avgOrderValue:
      chargedToday.length === 0
        ? 0
        : Math.round((revenueToday / chargedToday.length) * 100) / 100,
    slaBreaches: slaOverdue.length,
    topServices: [...serviceStats.values()]
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, TOP_SERVICES_LIMIT),
    ordersByHour,
    attention: attention.slice(0, ATTENTION_LIMIT),
  }
}
