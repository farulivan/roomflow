import { createContext, useContext } from "react"

import type { Hotel } from "@/domain/hotel"
import { appConfig } from "@/lib/config"

export const CurrentHotelContext = createContext<Hotel | undefined>(undefined)

/** The hotel the current route is scoped to. Only valid under HotelScope. */
export function useCurrentHotel(): Hotel {
  const hotel = useContext(CurrentHotelContext)
  if (hotel === undefined) {
    throw new Error("useCurrentHotel must be used within a HotelScope")
  }
  return hotel
}

/**
 * The hotel this browser last worked in, so "/" can reopen it. Callers
 * check it against the real hotel list, so any stored string is safe.
 */
export function readLastHotelId(): string | undefined {
  try {
    return localStorage.getItem(appConfig.storageKeys.lastHotel) ?? undefined
  } catch {
    return undefined
  }
}

export function rememberHotel(hotelId: string): void {
  try {
    localStorage.setItem(appConfig.storageKeys.lastHotel, hotelId)
  } catch {
    // Storage can be unavailable (private mode); this is only a convenience.
  }
}
