import { describe, expect, test } from "bun:test"
import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NavigationType } from "react-router"

import { renderInHotel } from "@/test/render"

import { OrdersToolbar } from "./orders-toolbar"
import { useOrdersSearchParams } from "./use-orders-search-params"

/** The toolbar wired to the URL exactly as OrdersPage wires it. */
function ToolbarWithUrlState() {
  const { params, setParams, clearFilters, activeFilterCount } =
    useOrdersSearchParams()

  return (
    <>
      <OrdersToolbar
        params={params}
        onParamsChange={setParams}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />
      <button type="button" onClick={() => setParams({ status: "New" })}>
        Only new
      </button>
    </>
  )
}

const searchBox = () =>
  screen.findByRole("textbox", { name: "Search guest, order ID, or room" })

describe("orders search and URL state", () => {
  test("a trailing space survives the debounced URL update", async () => {
    const user = userEvent.setup()
    const { router } = renderInHotel(<ToolbarWithUrlState />)
    const input = await searchBox()

    await user.type(input, "Maya ")
    await waitFor(() =>
      expect(router.state.location.search).toBe("?search=Maya")
    )

    // The URL holds the trimmed term, but the box keeps what was typed,
    // so the next word lands after the space: "Maya Chen", not "MayaChen".
    expect(input).toHaveValue("Maya ")
    await user.type(input, "Chen")
    expect(input).toHaveValue("Maya Chen")
  })

  test("typing replaces the history entry instead of adding one", async () => {
    const user = userEvent.setup()
    const { router } = renderInHotel(<ToolbarWithUrlState />)

    await user.type(await searchBox(), "Ollie")
    await waitFor(() =>
      expect(router.state.location.search).toBe("?search=Ollie")
    )
    expect(router.state.historyAction).toBe(NavigationType.Replace)
  })

  test("a filter change pushes history and resets the page", async () => {
    const user = userEvent.setup()
    const { router } = renderInHotel(<ToolbarWithUrlState />, {
      path: "/hotels/harborline/orders?page=3",
    })

    await user.click(await screen.findByRole("button", { name: "Only new" }))

    expect(router.state.location.search).toBe("?status=New")
    expect(router.state.historyAction).toBe(NavigationType.Push)
  })

  test("an outside URL change, like Back, replaces the search box", async () => {
    const { router } = renderInHotel(<ToolbarWithUrlState />, {
      path: "/hotels/harborline/orders?search=Priya",
    })
    const input = await searchBox()
    expect(input).toHaveValue("Priya")

    await act(() => router.navigate("/hotels/harborline/orders?search=Jonas"))
    expect(input).toHaveValue("Jonas")
  })
})
