import { Outlet } from "react-router"

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StaleDataNotice } from "@/components/shared/stale-data-notice"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { useNow } from "@/lib/use-now"
import { cn } from "@/lib/utils"

import { ConfirmActionProvider } from "./confirm-action"
import { OrderCardList } from "./order-card-list"
import { OrdersPagination } from "./orders-pagination"
import { OrdersTable } from "./orders-table"
import { OrdersToolbar } from "./orders-toolbar"
import { useOrders } from "./queries"
import { useOrdersSearchParams } from "./use-orders-search-params"

function OrdersListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-12 rounded-lg" />
      ))}
    </div>
  )
}

export function OrdersPage() {
  const hotel = useCurrentHotel()
  const { params, setParams, clearFilters, activeFilterCount } =
    useOrdersSearchParams()
  const now = useNow()
  const query = useOrders(hotel.id, params)

  return (
    <ConfirmActionProvider>
      <div className="space-y-4">
        <PageHeader
          title="Orders"
          description={`Guest service requests at ${hotel.name}`}
        >
          {query.data && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {query.data.total} total
            </span>
          )}
        </PageHeader>

        {/* The toolbar stays mounted in every state: a search that matches
            nothing still has to be editable, and a filter change is the
            natural way to recover from a failed load. */}
        <OrdersToolbar
          params={params}
          onParamsChange={setParams}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
        />

        {query.isPending ? (
          <OrdersListSkeleton />
        ) : !query.data ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : (
          <div
            className={cn(
              "space-y-4 transition-opacity",
              query.isFetching && !query.isError && "opacity-60"
            )}
          >
            {query.isError && (
              <StaleDataNotice
                updatedAt={query.dataUpdatedAt}
                onRetry={() => void query.refetch()}
                isRetrying={query.isFetching}
              />
            )}

            {query.data.total === 0 ? (
              <EmptyState
                title={
                  activeFilterCount > 0
                    ? "No orders match your filters"
                    : "No orders yet"
                }
                description={
                  activeFilterCount > 0
                    ? undefined
                    : "New guest requests will appear here."
                }
                action={
                  activeFilterCount > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <OrdersTable orders={query.data.items} now={now} />
                </div>
                <div className="md:hidden">
                  <OrderCardList orders={query.data.items} now={now} />
                </div>
                <OrdersPagination
                  page={query.data.page}
                  totalPages={query.data.totalPages}
                  total={query.data.total}
                  pageSize={query.data.pageSize}
                  onPageChange={(page) => setParams({ page })}
                />
              </>
            )}
          </div>
        )}

        <Outlet />
      </div>
    </ConfirmActionProvider>
  )
}
