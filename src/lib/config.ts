/** App-level configuration. Business rules live in src/domain, not here. */
export const appConfig = {
  apiBaseUrl: "/api",
  /** Poll interval for near-real-time data (orders list, metrics). */
  pollIntervalMs: 30_000,
  /** How long query data stays fresh before background refetch. */
  queryStaleTimeMs: 15_000,
  /** Shared clock tick used to re-evaluate SLA countdowns. */
  clockTickMs: 30_000,
  /** Cadence of simulated incoming orders when auto mode is on. */
  simulatorIntervalMs: 45_000,
  storageKeys: {
    session: "roomflow.session",
    theme: "roomflow.theme",
    demoSettings: "roomflow.demo-settings",
    lastHotel: "roomflow.last-hotel",
  },
} as const
