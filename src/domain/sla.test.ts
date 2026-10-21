import { describe, expect, test } from "bun:test"

import { makeOrder, minutesBefore } from "@/test/factories"
import { SERVICES, SLA_TARGET_MINUTES } from "./order"
import {
  isSlaOverdue,
  minutesOverdue,
  minutesSinceOrdered,
  slaTargetMinutes,
} from "./sla"

const now = new Date(2026, 2, 14, 14, 0, 0)

describe("isSlaOverdue", () => {
  test("a New room-service order past its 10-minute target is overdue", () => {
    const order = makeOrder({ orderTime: minutesBefore(now, 11) })
    expect(isSlaOverdue(order, now)).toBe(true)
  })

  test("exactly the target is still within SLA", () => {
    const order = makeOrder({ orderTime: minutesBefore(now, 10) })
    expect(isSlaOverdue(order, now)).toBe(false)
  })

  test("a fresh New order is within SLA", () => {
    const order = makeOrder({ orderTime: minutesBefore(now, 2) })
    expect(isSlaOverdue(order, now)).toBe(false)
  })

  test("each service is measured against its own target", () => {
    const at25 = minutesBefore(now, 25)
    expect(
      isSlaOverdue(makeOrder({ service: "Laundry", orderTime: at25 }), now)
    ).toBe(false)
    expect(
      isSlaOverdue(makeOrder({ service: "Housekeeping", orderTime: at25 }), now)
    ).toBe(true)
  })

  test("only New orders are SLA-tracked", () => {
    const staleTime = minutesBefore(now, 90)
    for (const status of [
      "Pending Approval",
      "Acknowledged",
      "In Progress",
      "Completed",
      "Cancelled",
    ] as const) {
      const order = makeOrder({ status, orderTime: staleTime })
      expect(isSlaOverdue(order, now)).toBe(false)
    }
  })
})

describe("slaTargetMinutes", () => {
  test("every service has a positive target", () => {
    for (const service of SERVICES) {
      expect(slaTargetMinutes({ service })).toBe(SLA_TARGET_MINUTES[service])
      expect(SLA_TARGET_MINUTES[service]).toBeGreaterThan(0)
    }
  })
})

describe("elapsed time helpers", () => {
  test("minutesSinceOrdered floors to whole minutes", () => {
    const order = makeOrder({
      orderTime: new Date(now.getTime() - 90_000).toISOString(),
    })
    expect(minutesSinceOrdered(order, now)).toBe(1)
  })

  test("minutesOverdue reports minutes past the service's target", () => {
    const roomService = makeOrder({ orderTime: minutesBefore(now, 38) })
    expect(minutesOverdue(roomService, now)).toBe(28)

    const laundry = makeOrder({
      service: "Laundry",
      orderTime: minutesBefore(now, 38),
    })
    expect(minutesOverdue(laundry, now)).toBe(8)
  })

  test("minutesOverdue is zero within SLA", () => {
    const order = makeOrder({ orderTime: minutesBefore(now, 5) })
    expect(minutesOverdue(order, now)).toBe(0)
  })
})
