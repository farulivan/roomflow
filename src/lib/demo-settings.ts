import { z } from "zod"

import { appConfig } from "./config"

/**
 * Runtime demo controls. The mock API reads these to simulate network
 * conditions; the header popover writes them. Persisted in localStorage so
 * a chosen scenario survives navigation.
 */
export interface DemoSettings {
  /** "slow" adds multi-second latency to every request. */
  network: "normal" | "slow"
  /** When on, every API request fails with HTTP 500. */
  failRequests: boolean
  /** When on, a new order arrives automatically at a fixed cadence. */
  autoOrders: boolean
}

const defaultDemoSettings: DemoSettings = {
  network: "normal",
  failRequests: false,
  autoOrders: true,
}

// Each field falls back to its default on its own, so one bad or missing
// value in storage doesn't throw away the others.
const storedSettingsSchema = z.object({
  network: z.enum(["normal", "slow"]).catch(defaultDemoSettings.network),
  failRequests: z.boolean().catch(defaultDemoSettings.failRequests),
  autoOrders: z.boolean().catch(defaultDemoSettings.autoOrders),
})

const CHANGE_EVENT = "demo-settings-change"

function parseSettings(raw: string | null): DemoSettings {
  if (!raw) return defaultDemoSettings
  try {
    const parsed = storedSettingsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : defaultDemoSettings
  } catch {
    return defaultDemoSettings
  }
}

let cached: { raw: string | null; settings: DemoSettings } | undefined

/**
 * The current settings. The parsed result is cached against the stored
 * string, so reads return the same object until the settings change —
 * which is what useSyncExternalStore needs from a snapshot, and spares
 * the mock API a parse on every request.
 */
export function getDemoSettings(): DemoSettings {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(appConfig.storageKeys.demoSettings)
  } catch {
    // Storage unavailable (e.g. blocked); fall back to the defaults.
  }
  if (cached?.raw !== raw) cached = { raw, settings: parseSettings(raw) }
  return cached.settings
}

export function updateDemoSettings(patch: Partial<DemoSettings>): void {
  const next = { ...getDemoSettings(), ...patch }
  localStorage.setItem(appConfig.storageKeys.demoSettings, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

/** Subscribe to changes; returns an unsubscribe. For useSyncExternalStore. */
export function subscribeDemoSettings(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}
