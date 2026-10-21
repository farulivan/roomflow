/**
 * Lightweight, vendor-free event tracking: every call logs to the console
 * and appends to a bounded in-memory buffer exposed at window.__analytics,
 * so key user actions are observable in dev tools or a test without wiring
 * a real analytics provider. Swapping in one later means changing the body
 * of `track()` — every call site stays the same.
 */
interface AnalyticsEvent {
  name: string
  props?: Record<string, unknown>
  timestamp: number
}

const buffer: AnalyticsEvent[] = []
const BUFFER_LIMIT = 100

export function track(name: string, props?: Record<string, unknown>): void {
  const event: AnalyticsEvent = { name, props, timestamp: Date.now() }
  buffer.push(event)
  if (buffer.length > BUFFER_LIMIT) buffer.shift()
  console.debug("[analytics]", name, props ?? {})
}

declare global {
  interface Window {
    __analytics?: readonly AnalyticsEvent[]
  }
}

// configurable: true so a dev-mode module re-evaluation (HMR) can redefine
// this instead of throwing "Cannot redefine property".
Object.defineProperty(window, "__analytics", {
  get: () => buffer,
  configurable: true,
})
