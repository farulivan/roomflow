/**
 * Presentation formatters. Times render in 24-hour clock — the operations
 * convention — and money in USD. Business rules never live here.
 */

const wholeCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const centsCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return Number.isInteger(amount)
    ? wholeCurrency.format(amount)
    : centsCurrency.format(amount)
}

/** An order's price; complimentary services read "Included", not "$0". */
export function formatOrderAmount(amount: number): string {
  return amount === 0 ? "Included" : formatCurrency(amount)
}

const clockTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function formatClockTime(date: Date): string {
  return clockTime.format(date)
}

const weekdayTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const fullDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function formatDateTime(iso: string): string {
  return fullDateTime.format(new Date(iso))
}

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/** Compact relative age for list rows: "just now", "12m", "3h", else weekday + time. */
export function formatRelativeTime(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime()
  if (elapsed < MINUTE_MS) return "just now"
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m`
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h`
  return weekdayTime.format(new Date(iso))
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

export function formatLongDate(date: Date): string {
  return longDate.format(date)
}
