import type { Order } from "@/domain/order"
import { hotelPath, request } from "@/lib/api-client"

export const demoApi = {
  /** Ask the mock backend to receive one new guest order right now. */
  createIncomingOrder(hotelId: string): Promise<Order> {
    return request<Order>(`${hotelPath(hotelId)}/demo/orders`, {
      method: "POST",
    })
  },

  /** Reseed every hotel's demo dataset. */
  reset(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>("/demo/reset", { method: "POST" })
  },
}
