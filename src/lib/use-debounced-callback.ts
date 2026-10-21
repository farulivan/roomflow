import { useCallback, useEffect, useRef } from "react"

/**
 * Returns a debounced wrapper around `callback`: calls collapse to the last
 * one within `delayMs`. The wrapper's identity is stable for a given delay,
 * and it always invokes the latest `callback` — no stale closures even if
 * the caller passes a new function every render.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  const callbackRef = useRef(callback)
  // Refs are only ever written outside of render (rules-of-hooks requires
  // it); this keeps the ref pointed at the latest callback after commit.
  useEffect(() => {
    callbackRef.current = callback
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return useCallback(
    (...args: Args) => {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(
        () => callbackRef.current(...args),
        delayMs
      )
    },
    [delayMs]
  )
}
