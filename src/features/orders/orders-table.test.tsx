import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { makeOrder } from "@/test/factories"
import { renderInHotel } from "@/test/render"

import { ConfirmActionProvider } from "./confirm-action"
import { OrdersTable } from "./orders-table"

const now = new Date(2026, 2, 14, 12, 5, 0)

function renderTable() {
  const order = makeOrder({ status: "New", guestName: "Maya Chen" })
  const view = renderInHotel(
    <ConfirmActionProvider>
      <OrdersTable orders={[order]} now={now} />
    </ConfirmActionProvider>
  )
  return { order, ...view }
}

describe("OrdersTable row", () => {
  test("clicking a row opens that order's details", async () => {
    const user = userEvent.setup()
    const { order, router } = renderTable()

    await user.click(await screen.findByText("Maya Chen"))

    expect(router.state.location.pathname).toBe(
      `/hotels/harborline/orders/${order.id}`
    )
  })

  test("typing a cancel reason from the row menu stays on the list", async () => {
    // Radix marks the page behind an open menu or dialog with
    // pointer-events: none; happy-dom can't resolve the overrides on top.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { order, router } = renderTable()

    await user.click(
      await screen.findByRole("button", { name: `Actions for ${order.id}` })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Cancel" }))

    const reason = await screen.findByLabelText("Reason (optional)")
    await user.click(reason)
    await user.type(reason, "Guest changed plans")

    expect(reason).toHaveValue("Guest changed plans")
    expect(router.state.location.pathname).toBe("/hotels/harborline/orders")
  })
})
