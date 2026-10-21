import { useEffect, useState } from "react"

import { formatClockTime } from "@/lib/format"

function useTickingClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return now
}

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" })

/**
 * The house clock. A hotel runs on minutes — SLA countdowns, delivery
 * promises — so the current time is always one glance away. Hidden from
 * screen readers: the OS already announces time on demand.
 */
export function HouseClock() {
  const now = useTickingClock()

  return (
    <div
      aria-hidden
      className="hidden items-baseline gap-1.5 px-2 font-mono text-sm tabular-nums sm:flex"
    >
      <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {weekday.format(now)}
      </span>
      <span className="font-medium">{formatClockTime(now)}</span>
    </div>
  )
}
