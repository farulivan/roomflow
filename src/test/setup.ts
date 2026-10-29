import { afterEach, expect } from "bun:test"
import { cleanup } from "@testing-library/react"
import * as matchers from "@testing-library/jest-dom/matchers"
import { toast } from "sonner"

expect.extend(matchers)

afterEach(() => {
  cleanup()
  // Sonner keeps toasts in module state and replays the active ones to
  // the next Toaster that mounts, so one test's toasts would show up in
  // another's.
  toast.dismiss()
})
