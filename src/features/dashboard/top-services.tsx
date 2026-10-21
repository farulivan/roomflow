import {
  BedDouble,
  ConciergeBell,
  Flower2,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { Amount } from "@/components/shared/amount"
import { Card } from "@/components/ui/card"
import type { ServiceStat } from "@/domain/metrics"
import type { ServiceType } from "@/domain/order"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

interface TopServicesProps {
  data: ServiceStat[]
}

const SERVICE_ICON: Record<ServiceType, LucideIcon> = {
  "Room Service": ConciergeBell,
  Housekeeping: Sparkles,
  Laundry: Shirt,
  "Extra Bed": BedDouble,
  "Spa & Massage": Flower2,
}

/** Today's services ranked by order count, with the revenue each brought in. */
export function TopServices({ data }: TopServicesProps) {
  return (
    <section aria-labelledby="top-services-heading" className="space-y-3">
      <h2 id="top-services-heading" className="text-section">
        Top services today
      </h2>
      <Card className="py-1">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No orders yet today.
          </p>
        ) : (
          <ol className="divide-y">
            {data.map(({ service, count, revenue }) => {
              const Icon = SERVICE_ICON[service]

              return (
                <li key={service} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body">
                    {service}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {count} {count === 1 ? "order" : "orders"}
                  </span>
                  <Amount
                    className={cn(
                      "w-24 text-right text-body",
                      revenue === 0 && "text-muted-foreground"
                    )}
                  >
                    {formatCurrency(revenue)}
                  </Amount>
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </section>
  )
}
