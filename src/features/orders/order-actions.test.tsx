import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { makeOrder } from "@/test/factories"
import { renderInHotel } from "@/test/render"

import { ConfirmActionProvider } from "./confirm-action"
import { OrderActions } from "./order-actions"

/**
 * These tests prove which actions render for a given status and that a
 * destructive one asks first. Nothing here lets a request through, so no
 * mock API is needed.
 */
function renderActions(ui: React.ReactElement) {
  return renderInHotel(<ConfirmActionProvider>{ui}</ConfirmActionProvider>)
}

describe("OrderActions", () => {
  test("New orders offer exactly Acknowledge and Cancel", async () => {
    renderActions(
      <OrderActions order={makeOrder({ status: "New" })} variant="detail" />
    )

    expect(
      await screen.findByRole("button", { name: "Acknowledge" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(2)
  })

  test("a final status offers no actions, only a status message", async () => {
    renderActions(
      <OrderActions
        order={makeOrder({ status: "Completed" })}
        variant="detail"
      />
    )

    expect(
      await screen.findByText("No further actions. This order is Completed.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  test("Cancel asks for confirmation instead of running", async () => {
    const user = userEvent.setup()
    const order = makeOrder({ status: "New" })
    renderActions(<OrderActions order={order} variant="detail" />)

    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(
      await screen.findByRole("alertdialog", {
        name: new RegExp(`Cancel order ${order.id}`),
      })
    ).toBeInTheDocument()
  })

  test("an order with a declined payment asks before acknowledging", async () => {
    const user = userEvent.setup()
    const order = makeOrder({
      status: "New",
      paymentStatus: "Failed",
      amount: 40,
    })
    renderActions(<OrderActions order={order} variant="detail" />)

    await user.click(await screen.findByRole("button", { name: "Acknowledge" }))

    const dialog = await screen.findByRole("alertdialog", {
      name: new RegExp(`Acknowledge order ${order.id}`),
    })
    expect(dialog).toHaveTextContent("payment was declined")
    // A go-ahead needs no reason; only cancelling and rejecting ask for one.
    expect(screen.queryByLabelText("Reason (optional)")).not.toBeInTheDocument()
  })
})
