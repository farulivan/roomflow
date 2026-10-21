import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"

import { ORDER_STATUSES } from "@/domain/order"

import { StatusBadge } from "./status-badge"

describe("StatusBadge", () => {
  test.each([...ORDER_STATUSES])("renders the %s status", (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(status)).toBeInTheDocument()
  })
})
