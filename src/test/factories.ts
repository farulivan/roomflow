import type { Order } from "@/domain/order"

let sequence = 0

/** Build a valid order for tests, overriding only what the test cares about. */
export function makeOrder(overrides: Partial<Order> = {}): Order {
  sequence += 1
  return {
    id: `HL-${String(sequence).padStart(4, "0")}`,
    hotelId: "harborline",
    guestName: "Alex Guest",
    roomNumber: "101",
    service: "Room Service",
    quantity: 1,
    amount: 25,
    specialRequest: "",
    orderTime: new Date(2026, 2, 14, 12, 0, 0).toISOString(),
    status: "New",
    paymentStatus: "Paid",
    ...overrides,
  }
}

/** Minutes before the given time, as an ISO order timestamp. */
export function minutesBefore(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}
