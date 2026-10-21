import { Check, ChevronsUpDown } from "lucide-react"
import { useMatch, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { track } from "@/lib/analytics"
import { paths } from "@/lib/paths"

import { useCurrentHotel } from "./current-hotel"
import { useHotels } from "./queries"

/**
 * Switches the whole console to another hotel. The section you're in
 * (dashboard or orders) carries over; filters and any open order don't,
 * since they belonged to the hotel you just left.
 */
export function HotelSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const current = useCurrentHotel()
  const hotels = useHotels()
  const navigate = useNavigate()
  const onOrders = useMatch("/hotels/:hotelId/orders/*") !== null

  const switchTo = (hotelId: string) => {
    if (hotelId === current.id) return
    track("hotel_switched", { from: current.id, to: hotelId })
    void navigate(onOrders ? paths.orders(hotelId) : paths.dashboard(hotelId))
    onSwitch?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-between gap-2 px-3 py-2 text-left"
          aria-label={`Hotel: ${current.name}. Switch hotel`}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {current.name}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {current.city}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Hotels
        </DropdownMenuLabel>
        {hotels.data?.map((hotel) => (
          <DropdownMenuItem
            key={hotel.id}
            onSelect={() => switchTo(hotel.id)}
            className="gap-2.5"
          >
            <span className="w-6 font-mono text-xs text-muted-foreground">
              {hotel.code}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{hotel.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {hotel.city}
              </span>
            </span>
            {hotel.id === current.id && (
              <Check className="size-4" aria-label="Current hotel" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
