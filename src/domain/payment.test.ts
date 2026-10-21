import { describe, expect, test } from "bun:test"

import { makeOrder } from "@/test/factories"
import { needsPaymentFollowUp } from "./payment"

describe("needsPaymentFollowUp", () => {
  test("a declined payment on an open order needs collecting", () => {
    expect(
      needsPaymentFollowUp(makeOrder({ paymentStatus: "Failed", amount: 40 }))
    ).toBe(true)
  })

  test("it still does once the order is completed", () => {
    const order = makeOrder({
      status: "Completed",
      paymentStatus: "Failed",
      amount: 40,
    })
    expect(needsPaymentFollowUp(order)).toBe(true)
  })

  test("a cancelled or complimentary order owes nothing", () => {
    const cancelled = makeOrder({
      status: "Cancelled",
      paymentStatus: "Failed",
    })
    const free = makeOrder({ paymentStatus: "Failed", amount: 0 })
    expect(needsPaymentFollowUp(cancelled)).toBe(false)
    expect(needsPaymentFollowUp(free)).toBe(false)
  })

  test("paid and pending payments need no follow-up", () => {
    for (const paymentStatus of ["Paid", "Pending"] as const) {
      expect(needsPaymentFollowUp(makeOrder({ paymentStatus }))).toBe(false)
    }
  })
})
