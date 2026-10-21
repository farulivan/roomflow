import type { Hotel } from "@/domain/hotel"
import { request } from "@/lib/api-client"

export const hotelsApi = {
  /** The hotels this staff account can work in. */
  list(): Promise<Hotel[]> {
    return request<Hotel[]>("/hotels")
  },
}
