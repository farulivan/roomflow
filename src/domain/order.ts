export const SERVICES = [
  "Room Service",
  "Housekeeping",
  "Laundry",
  "Extra Bed",
  "Spa & Massage",
] as const

export type ServiceType = (typeof SERVICES)[number]

export const ORDER_STATUSES = [
  "New",
  "Pending Approval",
  "Acknowledged",
  "In Progress",
  "Completed",
  "Cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ["Paid", "Pending", "Failed"] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export interface Order {
  /** Human-readable identifier, prefixed with the hotel code, e.g. "HL-1042". */
  id: string
  /** The hotel this order belongs to (`Hotel.id`). */
  hotelId: string
  guestName: string
  roomNumber: string
  service: ServiceType
  quantity: number
  /** Order total in USD. Complimentary services are 0. */
  amount: number
  specialRequest: string
  /** ISO 8601 timestamp of when the guest placed the request. */
  orderTime: string
  status: OrderStatus
  paymentStatus: PaymentStatus
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  )
}

/**
 * How long an order of each service may wait in "New" before it breaches
 * its SLA. A room-service tray goes cold fast; a laundry pickup can wait.
 */
export const SLA_TARGET_MINUTES: Record<ServiceType, number> = {
  "Room Service": 10,
  "Spa & Massage": 15,
  Housekeeping: 20,
  "Extra Bed": 20,
  Laundry: 30,
}

/**
 * Extra Bed requests above this quantity exceed standard room capacity and
 * require a manager decision before staff may act on them.
 */
export const EXTRA_BED_CAPACITY = 2

/** Price of one extra bed for the night, in USD. */
export const EXTRA_BED_PRICE = 35
