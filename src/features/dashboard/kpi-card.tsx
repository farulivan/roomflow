import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  /** "warning" flags a metric that needs attention (SLA breaches > 0). */
  tone?: "default" | "warning"
  /** When set, the whole card links to a pre-filtered view. */
  to?: string
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  to,
}: KpiCardProps) {
  const isWarning = tone === "warning"

  const card = (
    <Card className={cn(isWarning && "ring-1 ring-alert/40")}>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon
            className={cn(
              "size-4 text-muted-foreground",
              isWarning && "text-alert"
            )}
            aria-hidden
          />
        </div>
        <div
          className={cn(
            "font-mono text-2xl leading-tight font-semibold tabular-nums",
            isWarning && "text-alert"
          )}
        >
          {value}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )

  if (!to) return card

  return (
    <Link
      to={to}
      className="block rounded-xl border border-transparent transition-colors hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {card}
    </Link>
  )
}
