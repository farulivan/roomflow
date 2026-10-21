import type { ReactNode } from "react"

import { BrandMark } from "@/components/shared/brand-mark"

interface StatusScreenProps {
  title: string
  message: string
  children?: ReactNode
}

/**
 * Full-page message for states where the app shell can't render: route
 * errors, not-found pages, and the hotel list failing to load.
 */
export function StatusScreen({ title, message, children }: StatusScreenProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center">
      <BrandMark />
      <div className="space-y-1">
        <h1 className="text-section font-normal">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {children && (
        <div className="flex flex-wrap justify-center gap-2">{children}</div>
      )}
    </main>
  )
}
