import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { EmptyState } from "./empty-state"

describe("EmptyState", () => {
  test("fires the action's callback when clicked", async () => {
    let called = false
    const user = userEvent.setup()

    render(
      <EmptyState
        title="No orders yet"
        action={<button onClick={() => (called = true)}>Clear filters</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Clear filters" }))

    expect(called).toBe(true)
  })
})
