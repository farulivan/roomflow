import { describe, expect, test } from "bun:test"

import { makeOrder, minutesBefore } from "@/test/factories"
import {
  applyOrderQuery,
  parseOrderQuery,
  serializeOrderQuery,
  type OrderQueryParams,
} from "./order-query"

const now = new Date(2026, 2, 14, 14, 0, 0)

const orders = [
  makeOrder({
    id: "HL-2001",
    guestName: "Maya Chen",
    roomNumber: "611",
    status: "New",
    amount: 48,
    orderTime: minutesBefore(now, 30),
  }),
  makeOrder({
    id: "HL-2002",
    guestName: "Ollie Grant",
    roomNumber: "523",
    service: "Housekeeping",
    status: "In Progress",
    amount: 0,
    orderTime: minutesBefore(now, 120),
  }),
  makeOrder({
    id: "HL-2003",
    guestName: "Priya Nair",
    roomNumber: "117",
    service: "Laundry",
    status: "Completed",
    amount: 22,
    orderTime: minutesBefore(now, 240),
  }),
  makeOrder({
    id: "HL-2004",
    guestName: "Jonas Berg",
    roomNumber: "247",
    service: "Extra Bed",
    status: "New",
    amount: 35,
    paymentStatus: "Pending",
    orderTime: minutesBefore(now, 5),
  }),
]

describe("search", () => {
  test("matches room number, e.g. 611", () => {
    const result = applyOrderQuery(orders, { search: "611" }, now)
    expect(result.items.map((o) => o.id)).toEqual(["HL-2001"])
  })

  test("matches guest name case-insensitively", () => {
    const result = applyOrderQuery(orders, { search: "ollie" }, now)
    expect(result.items.map((o) => o.id)).toEqual(["HL-2002"])
  })

  test("matches order id fragments", () => {
    const result = applyOrderQuery(orders, { search: "2003" }, now)
    expect(result.items.map((o) => o.id)).toEqual(["HL-2003"])
  })

  test("whitespace-only search matches everything", () => {
    const result = applyOrderQuery(orders, { search: "   " }, now)
    expect(result.total).toBe(orders.length)
  })
})

describe("filters", () => {
  test("search and status combine", () => {
    const mayaNew = applyOrderQuery(
      orders,
      { search: "maya", status: "New" },
      now
    )
    expect(mayaNew.items.map((o) => o.id)).toEqual(["HL-2001"])

    const ollieNew = applyOrderQuery(
      orders,
      { search: "ollie", status: "New" },
      now
    )
    expect(ollieNew.total).toBe(0)
  })

  test("service and payment filters narrow the list", () => {
    const extraBeds = applyOrderQuery(orders, { service: "Extra Bed" }, now)
    expect(extraBeds.items.map((o) => o.id)).toEqual(["HL-2004"])

    const pending = applyOrderQuery(orders, { payment: "Pending" }, now)
    expect(pending.items.map((o) => o.id)).toEqual(["HL-2004"])
  })

  test("sla filter returns only overdue New orders", () => {
    const overdue = applyOrderQuery(orders, { sla: "overdue" }, now)
    expect(overdue.items.map((o) => o.id)).toEqual(["HL-2001"])
  })
})

describe("sorting", () => {
  test("newest first by default", () => {
    const result = applyOrderQuery(orders, {}, now)
    expect(result.items.map((o) => o.id)).toEqual([
      "HL-2004",
      "HL-2001",
      "HL-2002",
      "HL-2003",
    ])
  })

  test("oldest first when requested", () => {
    const result = applyOrderQuery(orders, { sort: "oldest" }, now)
    expect(result.items[0]?.id).toBe("HL-2003")
  })

  test("amount-high puts the priciest order first", () => {
    const result = applyOrderQuery(orders, { sort: "amount-high" }, now)
    expect(result.items[0]?.id).toBe("HL-2001")
    expect(result.items.at(-1)?.id).toBe("HL-2002")
  })
})

describe("pagination", () => {
  test("slices pages and reports totals", () => {
    const page1 = applyOrderQuery(orders, { pageSize: 3, page: 1 }, now)
    expect(page1.items).toHaveLength(3)
    expect(page1.total).toBe(4)
    expect(page1.totalPages).toBe(2)

    const page2 = applyOrderQuery(orders, { pageSize: 3, page: 2 }, now)
    expect(page2.items).toHaveLength(1)
  })

  test("clamps out-of-range pages instead of returning nothing", () => {
    const tooFar = applyOrderQuery(orders, { pageSize: 3, page: 99 }, now)
    expect(tooFar.page).toBe(2)
    expect(tooFar.items).toHaveLength(1)

    const tooLow = applyOrderQuery(orders, { page: 0 }, now)
    expect(tooLow.page).toBe(1)
  })

  test("empty result still reports one page", () => {
    const none = applyOrderQuery(orders, { search: "zzzz" }, now)
    expect(none.total).toBe(0)
    expect(none.totalPages).toBe(1)
    expect(none.page).toBe(1)
  })
})

describe("query param codec", () => {
  test("round-trips a fully specified query", () => {
    const params: OrderQueryParams = {
      search: "maya",
      status: "New",
      service: "Room Service",
      payment: "Failed",
      sla: "overdue",
      sort: "oldest",
      page: 3,
      pageSize: 25,
    }
    expect(parseOrderQuery(serializeOrderQuery(params))).toEqual(params)
  })

  test("serializes defaults to an empty query string", () => {
    const serialized = serializeOrderQuery({ sort: "newest", page: 1 })
    expect(serialized.toString()).toBe("")
  })

  test("parsing drops invalid values instead of failing", () => {
    const parsed = parseOrderQuery(
      new URLSearchParams(
        "status=Bogus&service=Nope&sort=sideways&page=-2&pageSize=abc&sla=nah"
      )
    )
    expect(parsed).toEqual({})
  })
})
