import { useQuery } from "@tanstack/react-query"

import { appConfig } from "@/lib/config"

import { metricsApi } from "./api"

export const metricsKeys = {
  root: ["metrics"] as const,
  all: (hotelId: string) => [...metricsKeys.root, hotelId] as const,
}

export function useMetrics(hotelId: string) {
  return useQuery({
    queryKey: metricsKeys.all(hotelId),
    queryFn: () => metricsApi.get(hotelId),
    refetchInterval: appConfig.pollIntervalMs,
  })
}
