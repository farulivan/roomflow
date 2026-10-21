import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"

import { Amount } from "./amount"

describe("Amount", () => {
  test("sets the cents apart but keeps the full figure as its text", () => {
    const { container } = render(<Amount>$1,284.50</Amount>)

    expect(screen.getByText(".50")).toBeInTheDocument()
    expect(container).toHaveTextContent("$1,284.50")
  })

  test.each(["$642", "Included"])("renders %s unchanged", (value) => {
    const { container } = render(<Amount>{value}</Amount>)

    expect(screen.getByText(value)).toBeInTheDocument()
    expect(container.querySelectorAll("span")).toHaveLength(1)
  })
})
