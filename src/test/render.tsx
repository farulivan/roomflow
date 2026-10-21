import type { ReactElement } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"

import type { Hotel } from "@/domain/hotel"
import { CurrentHotelContext } from "@/features/hotels/current-hotel"

const testHotel: Hotel = {
  id: "harborline",
  code: "HL",
  name: "Harborline Hotel",
  city: "Portside",
}

/** A QueryClient that fails fast: no retries, nothing refetched behind a test's back. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: "always" },
      mutations: { networkMode: "always" },
    },
  })
}

interface RenderInHotelOptions {
  /** Where the memory router starts, e.g. "/hotels/harborline/orders?status=New". */
  path?: string
  queryClient?: QueryClient
}

/**
 * Renders `ui` the way it runs in the app: under a QueryClient, a data
 * router and a current hotel. The route matches every path below the
 * orders page, so a navigation the test didn't expect changes
 * `router.state.location` without unmounting what's under test.
 */
export function renderInHotel(
  ui: ReactElement,
  {
    path = "/hotels/harborline/orders",
    queryClient = createTestQueryClient(),
  }: RenderInHotelOptions = {}
) {
  const router = createMemoryRouter(
    [
      {
        path: "/hotels/:hotelId/*",
        element: (
          <CurrentHotelContext.Provider value={testHotel}>
            {ui}
          </CurrentHotelContext.Provider>
        ),
      },
    ],
    { initialEntries: [path] }
  )

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )

  return { ...result, router, queryClient }
}
