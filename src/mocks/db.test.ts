import { beforeEach, describe, expect, test } from "bun:test"

import { computeMetrics } from "@/domain/metrics"
import { makeOrder } from "@/test/factories"

import { db } from "./db"

beforeEach(() => {
  db.reset()
})

const [harborline, cedarfall] = db.hotels()

describe("tenant scoping", () => {
  test("each hotel lists only its own orders", () => {
    for (const hotel of db.hotels()) {
      const orders = db.list(hotel.id)
      expect(orders.length).toBeGreaterThan(0)
      expect(orders.every((order) => order.hotelId === hotel.id)).toBe(true)
      expect(
        orders.every((order) => order.id.startsWith(`${hotel.code}-`))
      ).toBe(true)
    }
  })

  test("an order can't be found or changed through another hotel", () => {
    const order = db.list(harborline.id)[0]

    expect(db.find(harborline.id, order.id)).toBe(order)
    expect(db.find(cedarfall.id, order.id)).toBeUndefined()
    expect(db.updateStatus(cedarfall.id, order.id, "Cancelled")).toBe(undefined)
    expect(order.status).not.toBe("Cancelled")
    expect(db.updatePayment(cedarfall.id, order.id, "Paid")).toBeUndefined()
  })

  test("order IDs are unique across the whole table", () => {
    const ids = db
      .hotels()
      .flatMap((hotel) => db.list(hotel.id).map((order) => order.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("nextOrderId", () => {
  test("continues each hotel's own sequence", () => {
    const next = db.nextOrderId(harborline)
    expect(next.startsWith("HL-")).toBe(true)

    db.insert(makeOrder({ id: next, hotelId: harborline.id }))
    const after = db.nextOrderId(harborline)
    expect(Number(after.slice(3))).toBe(Number(next.slice(3)) + 1)

    // Another hotel's sequence is unaffected.
    expect(db.nextOrderId(cedarfall).startsWith("CF-")).toBe(true)
  })
})

describe("seed", () => {
  test("complimentary orders never carry a payment problem", () => {
    for (const hotel of db.hotels()) {
      const free = db.list(hotel.id).filter((order) => order.amount === 0)
      expect(free.length).toBeGreaterThan(0)
      expect(free.every((order) => order.paymentStatus === "Paid")).toBe(true)
    }
  })

  test("every hotel opens with each dashboard story visible", () => {
    for (const hotel of db.hotels()) {
      const metrics = computeMetrics(db.list(hotel.id), new Date())
      const reasons = new Set(metrics.attention.map((item) => item.reason))
      expect(metrics.slaBreaches).toBeGreaterThan(0)
      expect(reasons).toEqual(new Set(["sla", "approval", "payment"]))
    }
  })
})
