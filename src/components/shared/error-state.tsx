import { CircleAlert, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry: () => void
}

/** Generic data-surface error panel: what broke, and a way to try again. */
export function ErrorState({
  title = "Unable to load orders.",
  description = "Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Empty className="bg-card py-12 ring-1 ring-foreground/10">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-10 rounded-full bg-destructive/10 text-destructive"
        >
          <CircleAlert aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
      </EmptyContent>
    </Empty>
  )
}
