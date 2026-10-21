import {
  EXTRA_BED_CAPACITY,
  EXTRA_BED_PRICE,
  SLA_TARGET_MINUTES,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type ServiceType,
} from "@/domain/order"
import { initialStatusFor } from "@/domain/order-status"

import type { HotelProfile } from "./hotels"

/**
 * Deterministic dataset that always looks like a live hotel: timestamps are
 * generated relative to "now", so the dashboard opens with fresh orders,
 * a few SLA breaches, failed payments and pending approvals — whenever it
 * is opened. Each hotel's own PRNG seed produces the same shape every reload.
 */

/** Small, fast, seedable PRNG — deterministic across runs and platforms. */
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rand = () => number

const pick = <T>(rand: Rand, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)]

const randInt = (rand: Rand, min: number, max: number): number =>
  min + Math.floor(rand() * (max - min + 1))

const chance = (rand: Rand, probability: number): boolean =>
  rand() < probability

const GUEST_NAMES = [
  "Maya Chen",
  "Ollie Grant",
  "Priya Nair",
  "Jonas Berg",
  "Ines Moreau",
  "Kofi Asante",
  "Hana Sato",
  "Diego Ramos",
  "Tara Quinn",
  "Malik Brooks",
  "Signe Holm",
  "Rafael Duarte",
  "Anya Volkova",
  "Theo Marsh",
  "Leah Goldberg",
  "Sami Laine",
  "Grace Okoye",
  "Mateus Lima",
  "Ella Hart",
  "Kenji Mori",
  "Noor Aziz",
  "Pablo Ortega",
  "Ruth Abebe",
  "Finn Gallagher",
  "Iris Kowal",
  "Omar Farouk",
  "Zara Mistry",
  "Lars Eklund",
  "Chiara Bellini",
  "Daniel Osei",
  "Mina Park",
  "Ezra Cole",
  "Luisa Ferreira",
  "Arash Karimi",
  "Beth Collins",
  "Tomas Rivera",
  "Yara Nasser",
  "Hugo Lambert",
  "Sun-hee Kang",
  "Patrick Kerr",
  "Amira Saleh",
  "Nils Petersen",
  "Joy Adeyemi",
  "Marco Vitale",
  "Clara Weiss",
  "Ibrahim Diallo",
  "Rosa Jimenez",
  "Felix Brandt",
  "Aiko Fujita",
  "Owen Price",
  "Lucia Mancini",
  "Ahmed Rashid",
  "Saoirse Byrne",
  "Victor Hale",
  "Meera Iyer",
  "Jasper Wells",
  "Elif Demir",
  "Andre Baptiste",
  "Nina Sorensen",
  "Callum Reid",
] as const

const SPECIAL_REQUESTS: Record<ServiceType, readonly string[]> = {
  "Room Service": [
    "No nuts, please. Guest has a severe allergy.",
    "Two sets of cutlery and extra napkins.",
    "Knock softly, a baby is sleeping.",
    "Oat milk with the coffee, please.",
    "Leave the tray outside the door.",
    "Dressing on the side.",
  ],
  Housekeeping: [
    "Fresh towels only, no full clean today.",
    "Extra pillows, two firm ones.",
    "Guest is out until 3 PM; clean any time before.",
    "Please replace the bathrobes.",
    "Hypoallergenic bedding requested.",
  ],
  Laundry: [
    "Suit needs pressing for a 9 AM meeting.",
    "Wool sweater, hand wash only.",
    "Return folded, no hangers.",
    "Wine stain on the white shirt.",
  ],
  "Extra Bed": [
    "A crib instead of a bed, if possible.",
    "Place it away from the air vent.",
    "Two nights, starting tonight.",
  ],
  "Spa & Massage": [
    "Prefers a female therapist.",
    "Sore shoulders after a long flight.",
    "Unscented oils only.",
    "Earliest slot tomorrow morning.",
    "Couples room if one is free.",
  ],
}

/** Service mix weighted the way a busy hotel actually orders. */
const SERVICE_WEIGHTS: ReadonlyArray<[ServiceType, number]> = [
  ["Room Service", 0.34],
  ["Housekeeping", 0.24],
  ["Laundry", 0.17],
  ["Spa & Massage", 0.15],
  ["Extra Bed", 0.1],
]

function weightedService(rand: Rand): ServiceType {
  const roll = rand()
  let cumulative = 0
  for (const [service, weight] of SERVICE_WEIGHTS) {
    cumulative += weight
    if (roll < cumulative) return service
  }
  return "Room Service"
}

function quantityFor(rand: Rand, service: ServiceType): number {
  switch (service) {
    case "Room Service":
      return randInt(rand, 1, 3)
    case "Laundry":
      return randInt(rand, 1, 4)
    case "Extra Bed":
      // Now and then a family asks for more than the room can take.
      return chance(rand, 0.12) ? EXTRA_BED_CAPACITY + 1 : randInt(rand, 1, 2)
    case "Housekeeping":
    case "Spa & Massage":
      return 1
  }
}

function amountFor(rand: Rand, service: ServiceType, quantity: number): number {
  switch (service) {
    case "Room Service":
      return randInt(rand, 16, 72) + (quantity - 1) * randInt(rand, 12, 22)
    case "Housekeeping":
      return 0
    case "Laundry":
      return randInt(rand, 9, 22) * quantity
    case "Extra Bed":
      return EXTRA_BED_PRICE * quantity
    case "Spa & Massage":
      return randInt(rand, 85, 160)
  }
}

/** Where an order of this age plausibly is in its lifecycle by now. */
function statusFor(
  rand: Rand,
  ageMinutes: number,
  service: ServiceType
): OrderStatus {
  const roll = rand()
  if (ageMinutes <= SLA_TARGET_MINUTES[service])
    return roll < 0.8 ? "New" : "Acknowledged"
  if (ageMinutes < 60) {
    if (roll < 0.12) return "New" // these are live SLA breaches
    if (roll < 0.5) return "Acknowledged"
    if (roll < 0.9) return "In Progress"
    return "Cancelled"
  }
  if (ageMinutes < 180) {
    if (roll < 0.12) return "Acknowledged"
    if (roll < 0.42) return "In Progress"
    if (roll < 0.9) return "Completed"
    return "Cancelled"
  }
  return roll < 0.82 ? "Completed" : "Cancelled"
}

function paymentFor(rand: Rand, status: OrderStatus): PaymentStatus {
  if (status === "Completed") return chance(rand, 0.88) ? "Paid" : "Pending"
  const roll = rand()
  if (roll < 0.68) return "Paid"
  if (roll < 0.9) return "Pending"
  return "Failed"
}

const minutesAgo = (now: Date, minutes: number): string =>
  new Date(now.getTime() - minutes * 60_000).toISOString()

function roomNumberFor(rand: Rand, profile: HotelProfile): string {
  const floor = randInt(rand, 1, profile.floors)
  const room = randInt(rand, 1, profile.roomsPerFloor)
  return `${floor}${String(room).padStart(2, "0")}`
}

type OrderSeed = Omit<Order, "id">

function baseOrder(
  rand: Rand,
  profile: HotelProfile,
  now: Date,
  ageMinutes: number,
  overrides: Partial<OrderSeed> = {}
): OrderSeed {
  const service = overrides.service ?? weightedService(rand)
  const quantity = overrides.quantity ?? quantityFor(rand, service)
  const progressed = statusFor(rand, ageMinutes, service)
  // An order that hasn't moved yet sits in whatever status it started in,
  // which for an oversized extra-bed request is Pending Approval.
  const status =
    overrides.status ??
    (progressed === "New" ? initialStatusFor(service, quantity) : progressed)
  return {
    hotelId: profile.hotel.id,
    guestName: pick(rand, GUEST_NAMES),
    roomNumber: roomNumberFor(rand, profile),
    service,
    quantity,
    amount: amountFor(rand, service, quantity),
    specialRequest: chance(rand, 0.4)
      ? pick(rand, SPECIAL_REQUESTS[service])
      : "",
    orderTime: minutesAgo(now, ageMinutes),
    paymentStatus: paymentFor(rand, status),
    ...overrides,
    status,
  }
}

/** Hand-placed orders that guarantee every dashboard story is visible. */
function guaranteedOrders(
  rand: Rand,
  profile: HotelProfile,
  now: Date
): OrderSeed[] {
  const order = (ageMinutes: number, overrides: Partial<OrderSeed>) =>
    baseOrder(rand, profile, now, ageMinutes, overrides)
  const oversizedBed = EXTRA_BED_CAPACITY + 1

  return [
    // Just arrived — a fresh New order at the top of the queue.
    order(2, { service: "Room Service", status: "New", paymentStatus: "Paid" }),
    // New orders that have waited past their service's target.
    order(SLA_TARGET_MINUTES["Room Service"] + 8, {
      service: "Room Service",
      status: "New",
    }),
    order(SLA_TARGET_MINUTES.Housekeeping + 14, {
      service: "Housekeeping",
      status: "New",
      paymentStatus: "Pending",
    }),
    // An oversized extra-bed request waiting on a manager decision.
    order(6, {
      service: "Extra Bed",
      quantity: oversizedBed,
      amount: EXTRA_BED_PRICE * oversizedBed,
      status: "Pending Approval",
      paymentStatus: "Pending",
      specialRequest: "Family of five, two of them children.",
    }),
    // Failed payments staff can still act on.
    order(50, {
      service: "Room Service",
      status: "In Progress",
      paymentStatus: "Failed",
    }),
    order(80, {
      service: "Spa & Massage",
      status: "Acknowledged",
      paymentStatus: "Failed",
    }),
  ]
}

const WINDOW_MINUTES = 36 * 60
const FIRST_ORDER_NUMBER = 1201

export function createSeedOrders(profile: HotelProfile, now: Date): Order[] {
  const rand = mulberry32(profile.seed)

  const generated: OrderSeed[] = Array.from(
    { length: profile.orderCount },
    () => {
      // Bias order times toward the recent past so today looks busy.
      const ageMinutes = Math.floor(WINDOW_MINUTES * Math.pow(rand(), 1.7))
      return baseOrder(rand, profile, now, ageMinutes)
    }
  )

  return [...guaranteedOrders(rand, profile, now), ...generated]
    .sort((a, b) => a.orderTime.localeCompare(b.orderTime))
    .map((order, index) => ({
      id: `${profile.hotel.code}-${FIRST_ORDER_NUMBER + index}`,
      ...order,
    }))
}

/** One realistic incoming order, used by the live simulation. */
export function createIncomingOrder(
  profile: HotelProfile,
  id: string,
  now: Date
): Order {
  const rand = mulberry32(now.getTime() % 2147483647)
  const seed = baseOrder(rand, profile, now, 0)
  const status = initialStatusFor(seed.service, seed.quantity)
  return {
    id,
    ...seed,
    status,
    paymentStatus: chance(rand, 0.85) ? "Paid" : "Pending",
  }
}
