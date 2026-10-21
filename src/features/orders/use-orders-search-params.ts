import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import {
  parseOrderQuery,
  serializeOrderQuery,
  type OrderQueryParams,
} from "@/domain/order-query"

/** Filters counted for the "N active filters" affordance; sort is not one. */
const FILTER_KEYS = ["search", "status", "service", "payment", "sla"] as const

/** Changing any of these means "the list changed" — page 1 is the only sane page. */
const FIELDS_THAT_RESET_PAGE: readonly string[] = [...FILTER_KEYS, "sort"]

interface UseOrdersSearchParamsResult {
  params: OrderQueryParams
  /** Merges a patch into the URL; `undefined` values remove that key. */
  setParams: (patch: Partial<OrderQueryParams>) => void
  /** Drops every filter and the search text; keeps a non-default sort. */
  clearFilters: () => void
  activeFilterCount: number
}

/**
 * The orders list keeps no state of its own — search text, filters, sort
 * and page all live in the URL, parsed and written through the same domain
 * codec the mock API uses. That makes every list view shareable and
 * refresh-safe, and keeps this hook as the single seam other components
 * talk through instead of touching `useSearchParams` directly.
 */
export function useOrdersSearchParams(): UseOrdersSearchParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => parseOrderQuery(searchParams), [searchParams])

  const setParams = useCallback(
    (patch: Partial<OrderQueryParams>) => {
      const keys = Object.keys(patch)
      // Typing in the search box shouldn't spam browser history; every
      // other change (a filter, a sort, a page) gets its own entry.
      const isSearchTextOnly = keys.length === 1 && keys[0] === "search"
      const resetsPage = keys.some((key) =>
        FIELDS_THAT_RESET_PAGE.includes(key)
      )

      setSearchParams(
        // Undefined values drop out: serializeOrderQuery skips them.
        (previous) =>
          serializeOrderQuery({
            ...parseOrderQuery(previous),
            ...patch,
            ...(resetsPage && { page: undefined }),
          }),
        { replace: isSearchTextOnly }
      )
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams((previous) => {
      const { sort } = parseOrderQuery(previous)
      return serializeOrderQuery({ sort })
    })
  }, [setSearchParams])

  const activeFilterCount = FILTER_KEYS.filter(
    (key) => params[key] !== undefined
  ).length

  return { params, setParams, clearFilters, activeFilterCount }
}
