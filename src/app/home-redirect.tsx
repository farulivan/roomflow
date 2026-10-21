import { Navigate } from "react-router"

import { readLastHotelId } from "@/features/hotels/current-hotel"
import { paths } from "@/lib/paths"

import { HotelsGate } from "./hotels-gate"
import { StatusScreen } from "./status-screen"

/** "/" has no hotel of its own: reopen the last one used, else the first. */
export function HomeRedirect() {
  return (
    <HotelsGate>
      {(hotels) => {
        const lastId = readLastHotelId()
        const target = hotels.find((hotel) => hotel.id === lastId) ?? hotels[0]

        if (!target) {
          return (
            <StatusScreen
              title="No hotels yet"
              message="This account doesn't have access to any hotel."
            />
          )
        }

        return <Navigate to={paths.dashboard(target.id)} replace />
      }}
    </HotelsGate>
  )
}
