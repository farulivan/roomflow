import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StaleDataNotice } from "@/components/shared/stale-data-notice"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { formatLongDate } from "@/lib/format"
import { useNow } from "@/lib/use-now"

import { AttentionList } from "./attention-list"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { OrdersTodayCard } from "./orders-today-card"
import { useMetrics } from "./queries"
import { TodayCard } from "./today-card"
import { TopServices } from "./top-services"

/**
 * A single `useMetrics()` call drives the whole page: the day's figures,
 * the chart, the attention queue and the top services all read from the
 * same snapshot, so nothing on screen can disagree with anything else on
 * screen.
 */
export function DashboardPage() {
  const hotel = useCurrentHotel()
  const now = useNow()
  const query = useMetrics(hotel.id)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
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
        <div className="space-y-10">
          {query.isError && (
            <StaleDataNotice
              updatedAt={query.dataUpdatedAt}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-5">
            <OrdersTodayCard
              ordersByHour={query.data.ordersByHour}
              revenueToday={query.data.revenueToday}
              avgOrderValue={query.data.avgOrderValue}
              className="lg:col-span-3"
            />
            <TodayCard
              metrics={query.data}
              hotelId={hotel.id}
              className="lg:col-span-2"
            />
          </div>

          <AttentionList items={query.data.attention} now={now} />
          <TopServices data={query.data.topServices} />
        </div>
      )}
    </div>
  )
}
