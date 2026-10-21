import type { Hotel } from "@/domain/hotel"

/**
 * The mock backend's hotel table, plus the facts the seed needs to make
 * each property feel different: its room layout, how busy it is, and its
 * own PRNG seed. Only `hotel` is ever sent to the client.
 */
export interface HotelProfile {
  hotel: Hotel
  floors: number
  roomsPerFloor: number
  /** Orders generated across the seed window, before the hand-placed ones. */
  orderCount: number
  seed: number
}

export const HOTEL_PROFILES: readonly HotelProfile[] = [
  {
    hotel: {
      id: "harborline",
      code: "HL",
      name: "Harborline Hotel",
      city: "Portside",
    },
    floors: 9,
    roomsPerFloor: 24,
    orderCount: 112,
    seed: 4127,
  },
  {
    hotel: {
      id: "cedarfall",
      code: "CF",
      name: "Cedarfall Lodge",
      city: "Pine Hollow",
    },
    floors: 4,
    roomsPerFloor: 16,
    orderCount: 62,
    seed: 8803,
  },
  {
    hotel: {
      id: "saltmarsh",
      code: "SH",
      name: "Saltmarsh House",
      city: "Old Quay",
    },
    floors: 3,
    roomsPerFloor: 8,
    orderCount: 32,
    seed: 2591,
  },
]
