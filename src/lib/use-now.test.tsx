import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { render } from "@testing-library/react"

import { useNow } from "./use-now"

const seen: Date[] = []

function Clock() {
  seen.push(useNow())
  return null
}

afterEach(() => {
  seen.length = 0
})

describe("useNow", () => {
  test("every caller reads the same clock from a single timer", () => {
    const setIntervalSpy = spyOn(globalThis, "setInterval")
    const clearIntervalSpy = spyOn(globalThis, "clearInterval")

    const { unmount } = render(
      <>
        <Clock />
        <Clock />
        <Clock />
      </>
    )

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    const latest = seen.slice(-3)
    expect(new Set(latest).size).toBe(1)

    unmount()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })
})
