import { CloudOff, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatClockTime } from "@/lib/format"

interface StaleDataNoticeProps {
  /** `dataUpdatedAt` of the query whose background refresh failed. */
  updatedAt: number
  onRetry: () => void
  isRetrying: boolean
}

/**
 * Shown above data that is still on screen after a background refresh
 * failed. Staff keep working with what they have and see how old it is,
 * instead of losing the whole view to an error panel.
 */
export function StaleDataNotice({
  updatedAt,
  onRetry,
  isRetrying,
}: StaleDataNoticeProps) {
  return (
    <Alert className="flex items-center gap-3 border-alert/40 bg-alert/[0.06]">
      <CloudOff className="size-4 shrink-0 text-alert" aria-hidden />
      <div className="min-w-0 flex-1">
        <AlertTitle>Couldn't refresh</AlertTitle>
        <AlertDescription>
          Showing data from {formatClockTime(new Date(updatedAt))}.
        </AlertDescription>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw className={isRetrying ? "animate-spin" : ""} aria-hidden />
        Retry
      </Button>
    </Alert>
  )
}
