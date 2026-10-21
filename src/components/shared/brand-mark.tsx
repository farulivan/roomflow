import { cn } from "@/lib/utils"

/**
 * The Roomflow mark: a room key tag with a brass ring, and two brass lines
 * for the requests flowing through it. Same drawing as public/favicon.svg.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <path
        d="M16 2.5 26.5 9.5v17a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3v-17Z"
        className="fill-primary"
      />
      <circle
        cx="16"
        cy="10.5"
        r="3.4"
        fill="none"
        strokeWidth="1.6"
        className="stroke-brass"
      />
      <circle cx="16" cy="10.5" r="1.6" className="fill-background" />
      <path
        d="M10.5 18.5h11M10.5 23.5h7"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="stroke-brass"
      />
    </svg>
  )
}

/** Logo mark + wordmark, shared by the app shell, login and status pages. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">Roomflow</span>
    </div>
  )
}
