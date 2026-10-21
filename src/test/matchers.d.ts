import { expect } from "bun:test"
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"

// Declaration merging: an empty body plus `extends` is how TypeScript adds
// jest-dom's matcher types (toBeInTheDocument, etc.) to bun:test's own
// Matchers interface. There is no alternative shape for this — the rule
// below exists to catch accidental no-op types, not intentional merges.
declare module "bun:test" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T> extends TestingLibraryMatchers<
    ReturnType<typeof expect.stringContaining>,
    T
  > {}
}
