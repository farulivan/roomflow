import { useEffect, type ReactNode } from "react"
import { useParams } from "react-router"

import {
  CurrentHotelContext,
  rememberHotel,
} from "@/features/hotels/current-hotel"

import { HotelsGate } from "./hotels-gate"
import { NotFoundPage } from "./route-error"

function RememberHotel({ hotelId }: { hotelId: string }) {
  useEffect(() => rememberHotel(hotelId), [hotelId])
  return null
}

/**
 * Scopes everything under /hotels/:hotelId to that hotel: an unknown ID is
 * a not-found page, a known one is provided to the tree via
 * useCurrentHotel() and remembered as the hotel to reopen next time.
 */
export function HotelScope({ children }: { children: ReactNode }) {
  const { hotelId } = useParams<{ hotelId: string }>()

  return (
    <HotelsGate>
      {(hotels) => {
        const hotel = hotels.find((candidate) => candidate.id === hotelId)
        if (!hotel) return <NotFoundPage />

        return (
          <CurrentHotelContext.Provider value={hotel}>
            <RememberHotel hotelId={hotel.id} />
            {children}
          </CurrentHotelContext.Provider>
        )
      }}
    </HotelsGate>
  )
}
