import { describe, expect, test } from "bun:test"

import { cn } from "./utils"

describe("cn", () => {
  test.each(["text-body", "text-section", "text-title", "text-figure"])(
    "keeps %s next to a text color, since it sets the size",
    (size) => {
      expect(cn(size, "text-foreground")).toBe(`${size} text-foreground`)
      expect(cn("text-primary-foreground", size)).toBe(
        `text-primary-foreground ${size}`
      )
    }
  )

  test("still lets a later size replace an earlier one", () => {
    expect(cn("text-body", "text-section")).toBe("text-section")
    expect(cn("text-sm", "text-body")).toBe("text-body")
  })
})
