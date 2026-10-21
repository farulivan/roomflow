import { useState } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ORDER_STATUSES, PAYMENT_STATUSES, SERVICES } from "@/domain/order"
import {
  ORDER_SORTS,
  type OrderQueryParams,
  type OrderSort,
} from "@/domain/order-query"
import { track } from "@/lib/analytics"
import { useDebouncedCallback } from "@/lib/use-debounced-callback"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 300

/** Radix Select forbids an empty-string item value, so "All" gets a sentinel. */
const ALL_VALUE = "all"

const SORT_LABELS: Record<OrderSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "amount-high": "Amount: high to low",
  "amount-low": "Amount: low to high",
}

interface FilterSelectProps<T extends string> {
  label: string
  allLabel: string
  value: T | undefined
  options: readonly T[]
  onChange: (value: T | undefined) => void
}

/** One "All …" dropdown over a fixed list of values. */
function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) =>
        onChange(next === ALL_VALUE ? undefined : (next as T))
      }
    >
      <SelectTrigger aria-label={label} className="w-36">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface OrdersToolbarProps {
  params: OrderQueryParams
  onParamsChange: (patch: Partial<OrderQueryParams>) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function OrdersToolbar({
  params,
  onParamsChange,
  onClearFilters,
  activeFilterCount,
}: OrdersToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(params.search ?? "")
  // Tracks the URL value the draft was last synced from, so an external
  // change (back/forward navigation, Clear filters) can be adopted below.
  const [syncedSearch, setSyncedSearch] = useState(params.search)

  // Adjusting state while rendering (instead of in an effect) applies the
  // external change in the same commit, without an extra render pass:
  // https://react.dev/learn/you-might-not-need-an-effect
  // The URL holds the trimmed search, so the draft's own echo coming back
  // ("John " → "John") must not overwrite what the user is still typing.
  if (params.search !== syncedSearch) {
    setSyncedSearch(params.search)
    if ((params.search ?? "") !== searchDraft.trim()) {
      setSearchDraft(params.search ?? "")
    }
  }

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    onParamsChange({ search: value || undefined })
    if (value) track("orders_searched", { query: value })
  }, SEARCH_DEBOUNCE_MS)

  const handleSearchChange = (value: string) => {
    setSearchDraft(value)
    debouncedSetSearch(value)
  }

  const applyFilter = (patch: Partial<OrderQueryParams>) => {
    onParamsChange(patch)
    track("orders_filtered", patch)
  }

  const slaActive = params.sla === "overdue"
  const failedActive = params.payment === "Failed"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={searchDraft}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search guest, order ID, or room…"
          aria-label="Search guest, order ID, or room"
          className="pr-6 pl-8"
        />
        {searchDraft && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => handleSearchChange("")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <FilterSelect
        label="Filter by status"
        allLabel="All statuses"
        value={params.status}
        options={ORDER_STATUSES}
        onChange={(status) => applyFilter({ status })}
      />
      <FilterSelect
        label="Filter by service"
        allLabel="All services"
        value={params.service}
        options={SERVICES}
        onChange={(service) => applyFilter({ service })}
      />
      <FilterSelect
        label="Filter by payment status"
        allLabel="All payments"
        value={params.payment}
        options={PAYMENT_STATUSES}
        onChange={(payment) => applyFilter({ payment })}
      />

      <Select
        value={params.sort ?? "newest"}
        onValueChange={(value) => {
          onParamsChange({ sort: value as OrderSort })
          track("orders_sorted", { sort: value })
        }}
      >
        <SelectTrigger aria-label="Sort orders" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={slaActive}
        onClick={() => applyFilter({ sla: slaActive ? undefined : "overdue" })}
        className={cn(
          slaActive &&
            "border-alert/50 bg-alert/10 text-alert hover:bg-alert/15 hover:text-alert"
        )}
      >
        Overdue SLA
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={failedActive}
        onClick={() =>
          applyFilter({ payment: failedActive ? undefined : "Failed" })
        }
        className={cn(
          failedActive &&
            "border-destructive/40 bg-destructive/8 text-destructive hover:bg-destructive/12 hover:text-destructive"
        )}
      >
        Failed payments
      </Button>

      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={onClearFilters}
        >
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
