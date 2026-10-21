import type { Hotel } from "@/domain/hotel"
import type { Order, OrderStatus } from "@/domain/order"

import { HOTEL_PROFILES, type HotelProfile } from "./hotels"
import { createSeedOrders } from "./seed"

function seedAll(now: Date): Order[] {
  return HOTEL_PROFILES.flatMap((profile) => createSeedOrders(profile, now))
}

/**
 * In-memory "database" behind the mock API: one orders table with a
 * `hotelId` column, the way a multi-tenant backend would store it. Every
 * read is scoped to a hotel, so one hotel's order is simply not found from
 * another. Seeded fresh on every full page load (timestamps stay relative
 * to now), mutated in place during the session, deliberately not persisted.
 */
let orders: Order[] = seedAll(new Date())

export const db = {
  hotels(): Hotel[] {
    return HOTEL_PROFILES.map((profile) => profile.hotel)
  },

  profile(hotelId: string): HotelProfile | undefined {
    return HOTEL_PROFILES.find((profile) => profile.hotel.id === hotelId)
  },

  list(hotelId: string): Order[] {
    return orders.filter((order) => order.hotelId === hotelId)
  },

  find(hotelId: string, id: string): Order | undefined {
    return orders.find((order) => order.hotelId === hotelId && order.id === id)
  },

  updateStatus(
    hotelId: string,
    id: string,
    status: OrderStatus
  ): Order | undefined {
    const order = db.find(hotelId, id)
    if (!order) return undefined
    order.status = status
    return order
  },

  insert(order: Order): Order {
    orders.push(order)
    return order
  },

  /** The next ID in this hotel's own sequence, e.g. "HL-1319". */
  nextOrderId(hotel: Hotel): string {
    const prefix = `${hotel.code}-`
    const max = db.list(hotel.id).reduce((highest, order) => {
      const numeric = Number.parseInt(order.id.slice(prefix.length), 10)
      return Number.isNaN(numeric) ? highest : Math.max(highest, numeric)
    }, 0)
    return `${prefix}${max + 1}`
  },

  reset(): void {
    orders = seedAll(new Date())
  },
}
