import type { Metrics } from "@/domain/metrics"
import { hotelPath, request } from "@/lib/api-client"

export const metricsApi = {
  get(hotelId: string): Promise<Metrics> {
    return request<Metrics>(`${hotelPath(hotelId)}/metrics`)
  },
}
