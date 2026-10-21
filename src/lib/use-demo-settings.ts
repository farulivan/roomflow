import { useSyncExternalStore } from "react"

import {
  getDemoSettings,
  subscribeDemoSettings,
  type DemoSettings,
} from "./demo-settings"

/** Live view of the demo settings; re-renders whenever they change. */
export function useDemoSettings(): DemoSettings {
  return useSyncExternalStore(subscribeDemoSettings, getDemoSettings)
}
