import { describe, expect, test } from "bun:test"

import { makeOrder, minutesBefore } from "@/test/factories"
import { computeMetrics } from "./metrics"

const now = new Date(2026, 2, 14, 14, 0, 0)
const yesterday = new Date(2026, 2, 13, 18, 0, 0).toISOString()

const orders = [
  // Paid room-service order from this morning, completed.
  makeOrder({
    id: "HL-3001",
    roomNumber: "611",
    amount: 40,
    status: "Completed",
    orderTime: minutesBefore(now, 300),
  }),
  // Second paid order for the same room today — same guest, counts once.
  makeOrder({
    id: "HL-3002",
    roomNumber: "611",
    amount: 20,
    status: "In Progress",
    orderTime: minutesBefore(now, 60),
  }),
  // Overdue New laundry order (30-minute target), pending payment.
  makeOrder({
    id: "HL-3003",
    roomNumber: "523",
    service: "Laundry",
    amount: 25,
    status: "New",
    paymentStatus: "Pending",
    orderTime: minutesBefore(now, 45),
  }),
  // Cancelled today with failed payment — excluded from guests, revenue
  // and failed-payment follow-up alike.
  makeOrder({
    id: "HL-3004",
    roomNumber: "702",
    amount: 75,
    status: "Cancelled",
    paymentStatus: "Failed",
    orderTime: minutesBefore(now, 90),
  }),
  // Open order with failed payment — needs attention.
  makeOrder({
    id: "HL-3005",
    roomNumber: "117",
    service: "Spa & Massage",
    amount: 75,
    status: "Acknowledged",
    paymentStatus: "Failed",
    orderTime: minutesBefore(now, 30),
  }),
  // Awaiting manager approval.
  makeOrder({
    id: "HL-3006",
    roomNumber: "247",
    service: "Extra Bed",
    quantity: 3,
    amount: 105,
    status: "Pending Approval",
    paymentStatus: "Pending",
    orderTime: minutesBefore(now, 10),
  }),
  // Yesterday's paid order — excluded from all of today's numbers.
  makeOrder({
    id: "HL-3007",
    roomNumber: "222",
    amount: 100,
    status: "Completed",
    orderTime: yesterday,
  }),
  // Complimentary housekeeping — paid at $0, kept out of the average.
  makeOrder({
    id: "HL-3008",
    roomNumber: "330",
    service: "Housekeeping",
    amount: 0,
    status: "Completed",
    orderTime: minutesBefore(now, 120),
  }),
  // Delivered, but the card was declined — still money to collect.
  makeOrder({
    id: "HL-3009",
    roomNumber: "415",
    amount: 30,
    status: "Completed",
    paymentStatus: "Failed",
    orderTime: minutesBefore(now, 200),
  }),
]

const metrics = computeMetrics(orders, now)

describe("computeMetrics", () => {
  test("active guests counts distinct rooms with live orders today", () => {
    // 611 (twice, deduped), 523, 117, 247, 330, 415 — cancelled 702 and
    // yesterday's 222 excluded.
    expect(metrics.activeGuests).toBe(6)
  })

  test("open orders spans every non-final status regardless of day", () => {
    expect(metrics.openOrders).toBe(4)
  })

  test("revenue today sums paid, non-cancelled orders only", () => {
    expect(metrics.revenueToday).toBe(60)
  })

  test("average order value leaves complimentary orders out", () => {
    // $60 over the two charged orders; the $0 housekeeping would make it $20.
    expect(metrics.avgOrderValue).toBe(30)
  })

  test("completed today ignores yesterday's completions", () => {
    expect(metrics.completedToday).toBe(3)
  })

  test("sla breaches count only overdue New orders", () => {
    expect(metrics.slaBreaches).toBe(1)
  })

  test("top services rank today's services by order count", () => {
    expect(metrics.topServices[0]).toEqual({
      service: "Room Service",
      count: 3,
      revenue: 60,
    })
    expect(metrics.topServices.map((s) => s.service)).toContain("Laundry")
  })

  test("orders by hour covers midnight through the current hour", () => {
    expect(metrics.ordersByHour).toHaveLength(now.getHours() + 1)
    const total = metrics.ordersByHour.reduce((sum, b) => sum + b.orders, 0)
    expect(total).toBe(7)
  })

  test("attention lists sla first, then approvals, then failed payments", () => {
    expect(metrics.attention.map((item) => item.reason)).toEqual([
      "sla",
      "approval",
      "payment",
      "payment",
    ])
    expect(metrics.attention[0]?.order.id).toBe("HL-3003")
  })

  test("a failed payment stays in attention after the order is completed", () => {
    const ids = metrics.attention.map((item) => item.order.id)
    expect(ids).toContain("HL-3009")
    expect(ids).not.toContain("HL-3004")
  })

  test("empty input produces zeroed metrics", () => {
    const empty = computeMetrics([], now)
    expect(empty.activeGuests).toBe(0)
    expect(empty.revenueToday).toBe(0)
    expect(empty.avgOrderValue).toBe(0)
    expect(empty.topServices).toHaveLength(0)
    expect(empty.attention).toHaveLength(0)
  })
})
