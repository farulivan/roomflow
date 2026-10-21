import { Inbox, type LucideIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Typically a "Clear filters" or similar recovery action. */
  action?: React.ReactNode
}

/**
 * Generic "nothing here" surface for any data list. Copy and the optional
 * action always come from the caller, so the same component reads right
 * for "no orders exist yet" and "nothing matches your filters" alike.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
