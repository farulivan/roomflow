import { cn } from "@/lib/utils"

interface AmountProps {
  /** Already formatted by src/lib/format, e.g. "$1,284.50" or "Included". */
  children: string
  className?: string
}

const TRAILING_CENTS = /^(.*)(\.\d{2})$/

/**
 * A money figure with its cents set smaller and raised, so the whole units
 * carry the number. It formats nothing itself: anything without cents
 * ("$642", "Included") renders exactly as given.
 */
export function Amount({ children, className }: AmountProps) {
  const match = TRAILING_CENTS.exec(children)

  return (
    <span className={cn("tabular-nums", className)}>
      {match ? (
        <>
          {match[1]}
          <span className="align-[0.45em] text-[0.6em]">{match[2]}</span>
        </>
      ) : (
        children
      )}
    </span>
  )
}
