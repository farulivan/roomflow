import { useQuery } from "@tanstack/react-query"

import { hotelsApi } from "./api"

export const hotelsKeys = {
  all: ["hotels"] as const,
}

export function useHotels() {
  return useQuery({
    queryKey: hotelsKeys.all,
    queryFn: () => hotelsApi.list(),
    // The list of properties doesn't change during a shift; fetch it once.
    staleTime: Infinity,
  })
}
