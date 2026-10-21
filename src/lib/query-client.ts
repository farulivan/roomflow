import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "./api-client"
import { appConfig } from "./config"

/** A 4xx says the request itself was wrong; repeating it cannot help. */
function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: appConfig.queryStaleTimeMs,
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < 1,
        refetchOnWindowFocus: true,
        // This app's API is a service worker inside the page, so there is no
        // network to be offline from. Without "always", a failed request is
        // parked at fetchStatus "paused" instead of settling as an error, and
        // the error state never renders.
        networkMode: "always",
      },
      mutations: {
        networkMode: "always",
      },
    },
  })
}
