/** A property the console manages. Every order belongs to exactly one. */
export interface Hotel {
  /** URL-safe identifier used in routes and API paths, e.g. "harborline". */
  id: string
  /** Short prefix for this hotel's order IDs, e.g. "HL" in "HL-1042". */
  code: string
  name: string
  city: string
}
