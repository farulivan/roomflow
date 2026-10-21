import { describe, expect, test } from "bun:test"

import { makeOrder } from "@/test/factories"
import { EXTRA_BED_CAPACITY, ORDER_STATUSES, type OrderStatus } from "./order"
import {
  actionsForOrder,
  actionsForStatus,
  canTransition,
  initialStatusFor,
  isFinalStatus,
  nextStatuses,
} from "./order-status"

const LEGAL: Array<[OrderStatus, OrderStatus]> = [
  ["New", "Acknowledged"],
  ["New", "Cancelled"],
  ["Pending Approval", "Acknowledged"],
  ["Pending Approval", "Cancelled"],
  ["Acknowledged", "In Progress"],
  ["Acknowledged", "Cancelled"],
  ["In Progress", "Completed"],
  ["In Progress", "Cancelled"],
]

describe("canTransition", () => {
  test.each(LEGAL)("allows %s → %s", (from: OrderStatus, to: OrderStatus) => {
    expect(canTransition(from, to)).toBe(true)
  })

  test("rejects every pair outside the lifecycle", () => {
    const legal = new Set(LEGAL.map(([from, to]) => `${from}|${to}`))
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        if (!legal.has(`${from}|${to}`)) {
          expect(canTransition(from, to)).toBe(false)
        }
      }
    }
  })

  test("no status can skip ahead from New to In Progress or Completed", () => {
    expect(canTransition("New", "In Progress")).toBe(false)
    expect(canTransition("New", "Completed")).toBe(false)
  })

  test("final statuses accept no transitions at all", () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition("Completed", to)).toBe(false)
      expect(canTransition("Cancelled", to)).toBe(false)
    }
  })
})

describe("status classification", () => {
  test("only Completed and Cancelled are final", () => {
    const finals = ORDER_STATUSES.filter(isFinalStatus)
    expect(finals).toEqual(["Completed", "Cancelled"])
  })
})

describe("actionsForStatus", () => {
  test("every offered action is a legal transition", () => {
    for (const status of ORDER_STATUSES) {
      for (const action of actionsForStatus(status)) {
        expect(canTransition(status, action.to)).toBe(true)
      }
    }
  })

  test("every legal transition has exactly one action", () => {
    for (const status of ORDER_STATUSES) {
      const targets = actionsForStatus(status).map((action) => action.to)
      expect(targets).toEqual([...nextStatuses(status)])
    }
  })

  test("destructive actions always require confirmation", () => {
    for (const status of ORDER_STATUSES) {
      for (const action of actionsForStatus(status)) {
        if (action.intent === "destructive") {
          expect(action.confirm).toBe(true)
        }
      }
    }
  })

  test("pending approval offers approve and reject wording", () => {
    const labels = actionsForStatus("Pending Approval").map((a) => a.label)
    expect(labels).toEqual(["Approve", "Reject"])
  })

  test("final statuses offer no actions", () => {
    expect(actionsForStatus("Completed")).toHaveLength(0)
    expect(actionsForStatus("Cancelled")).toHaveLength(0)
  })
})

describe("initialStatusFor", () => {
  test("ordinary requests start as New", () => {
    expect(initialStatusFor("Room Service", 3)).toBe("New")
    expect(initialStatusFor("Extra Bed", EXTRA_BED_CAPACITY)).toBe("New")
  })

  test("extra beds beyond room capacity wait for approval", () => {
    expect(initialStatusFor("Extra Bed", EXTRA_BED_CAPACITY + 1)).toBe(
      "Pending Approval"
    )
  })
})

describe("actionsForOrder", () => {
  const declined = { paymentStatus: "Failed", amount: 40 } as const

  test("matches actionsForStatus when the payment is fine", () => {
    const order = makeOrder({ status: "New" })
    expect(actionsForOrder(order)).toEqual(actionsForStatus("New"))
  })

  test("acknowledging an order with a declined payment asks first", () => {
    const [acknowledge, cancel] = actionsForOrder(
      makeOrder({ status: "New", ...declined })
    )
    expect(acknowledge).toMatchObject({
      label: "Acknowledge",
      confirm: true,
      confirmReason: "payment-declined",
    })
    expect(cancel).toEqual(actionsForStatus("New")[1])
  })

  test("so does approving one", () => {
    const [approve] = actionsForOrder(
      makeOrder({ status: "Pending Approval", ...declined })
    )
    expect(approve).toMatchObject({ label: "Approve", confirm: true })
  })

  test("later steps stay one click", () => {
    const [complete] = actionsForOrder(
      makeOrder({ status: "In Progress", ...declined })
    )
    expect(complete).toMatchObject({ label: "Complete", confirm: false })
  })
})
