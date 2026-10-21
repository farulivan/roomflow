import { useSyncExternalStore } from "react"

import { appConfig } from "./config"

/**
 * One clock for all time-relative UI — SLA countdowns, relative timestamps.
 * Every caller reads the same `Date` and re-renders on the same tick, so
 * the list and the details sheet can never disagree about an SLA, and a
 * page of rows costs one timer, not one per row. The timer only runs
 * while something is subscribed.
 */
let now = new Date()
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    // Catch up on time that passed while nothing was listening.
    now = new Date()
    timer = setInterval(() => {
      now = new Date()
      for (const notify of listeners) notify()
    }, appConfig.clockTickMs)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getSnapshot = () => now

export function useNow(): Date {
  return useSyncExternalStore(subscribe, getSnapshot)
}
