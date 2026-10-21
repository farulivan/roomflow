import {
  AlarmClock,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Receipt,
  Users,
} from "lucide-react"

import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StaleDataNotice } from "@/components/shared/stale-data-notice"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { formatCurrency, formatLongDate } from "@/lib/format"
import { paths } from "@/lib/paths"
import { useNow } from "@/lib/use-now"

import { AttentionList } from "./attention-list"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { KpiCard } from "./kpi-card"
import { OrdersByHourChart } from "./orders-by-hour-chart"
import { useMetrics } from "./queries"
import { TopServicesChart } from "./top-services-chart"

/**
 * A single `useMetrics()` call drives the whole page — KPI tiles, both
 * charts, and the attention queue all read from the same snapshot, so
 * nothing on screen can disagree with anything else on screen.
 */
export function DashboardPage() {
  const hotel = useCurrentHotel()
  const now = useNow()
  const query = useMetrics(hotel.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${hotel.name} ・ ${formatLongDate(now)}`}
      />

      {query.isPending ? (
        <DashboardSkeleton />
      ) : !query.data ? (
        <ErrorState
          title="Unable to load dashboard data."
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="space-y-6">
          {query.isError && (
            <StaleDataNotice
              updatedAt={query.dataUpdatedAt}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Active guests"
              value={query.data.activeGuests}
              icon={Users}
              hint="Rooms with orders today"
            />
            <KpiCard
              label="Open orders"
              value={query.data.openOrders}
              icon={ClipboardList}
              hint="Not yet completed or cancelled"
              to={paths.orders(hotel.id)}
            />
            <KpiCard
              label="Revenue today"
              value={formatCurrency(query.data.revenueToday)}
              icon={Banknote}
              hint="Paid, non-cancelled orders"
            />
            <KpiCard
              label="Completed today"
              value={query.data.completedToday}
              icon={CheckCircle2}
              hint="Since midnight"
            />
            <KpiCard
              label="Avg order value"
              value={formatCurrency(query.data.avgOrderValue)}
              icon={Receipt}
              hint="Per paid order today, excluding complimentary"
            />
            <KpiCard
              label="SLA breaches"
              value={query.data.slaBreaches}
              icon={AlarmClock}
              tone={query.data.slaBreaches > 0 ? "warning" : "default"}
              hint={
                query.data.slaBreaches > 0
                  ? "New orders waiting past their service's target"
                  : "Every new order is within its target"
              }
              to={paths.orders(hotel.id, "?sla=overdue")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopServicesChart data={query.data.topServices} />
            <OrdersByHourChart data={query.data.ordersByHour} />
          </div>

          <AttentionList items={query.data.attention} now={now} />
        </div>
      )}
    </div>
  )
}
