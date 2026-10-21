import { lazy, Suspense } from "react"

import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton"

// The dashboard is the only page that draws charts, so it and the charting
// library load on first visit instead of in the main bundle.
const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  }))
)

export function DashboardRoute() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  )
}
