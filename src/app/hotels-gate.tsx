import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { BrandMark } from "@/components/shared/brand-mark"
import { Button } from "@/components/ui/button"
import type { Hotel } from "@/domain/hotel"
import { useHotels } from "@/features/hotels/queries"
import { updateDemoSettings } from "@/lib/demo-settings"
import { useDemoSettings } from "@/lib/use-demo-settings"

import { StatusScreen } from "./status-screen"

/**
 * Loads the hotel list every hotel-scoped route depends on, and owns its
 * loading and error screens so the routes below only ever see real data.
 */
export function HotelsGate({
  children,
}: {
  children: (hotels: Hotel[]) => ReactNode
}) {
  const hotels = useHotels()
  const settings = useDemoSettings()

  if (hotels.isPending) {
    return (
      <main
        className="flex min-h-svh flex-col items-center justify-center gap-4"
        aria-busy
      >
        <BrandMark />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading your hotels…
        </p>
      </main>
    )
  }

  if (hotels.isError) {
    // The demo controls live in the app shell, which can't render without
    // hotels, so a stored "fail every request" setting needs a way out here.
    return (
      <StatusScreen
        title="Couldn't load your hotels"
        message={
          settings.failRequests
            ? "Simulated API errors are switched on, so every request fails."
            : "Check your connection and try again."
        }
      >
        {settings.failRequests && (
          <Button
            onClick={() => {
              updateDemoSettings({ failRequests: false })
              void hotels.refetch()
            }}
          >
            Turn off simulated errors
          </Button>
        )}
        <Button variant="outline" onClick={() => void hotels.refetch()}>
          Retry
        </Button>
      </StatusScreen>
    )
  }

  return children(hotels.data)
}
