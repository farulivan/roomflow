import { Skeleton } from "@/components/ui/skeleton"

/**
 * Placeholder in the dashboard's final layout. Kept in its own module so
 * the router can show it while the (lazy-loaded) dashboard chunk arrives.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
