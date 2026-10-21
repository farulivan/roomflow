import type { Order, OrderStatus } from "@/domain/order"
import {
  serializeOrderQuery,
  type OrderQueryParams,
  type OrdersPage,
} from "@/domain/order-query"
import { hotelPath, request } from "@/lib/api-client"

const ordersPath = (hotelId: string) => `${hotelPath(hotelId)}/orders`

export const ordersApi = {
  list(hotelId: string, params: OrderQueryParams): Promise<OrdersPage> {
    const query = serializeOrderQuery(params).toString()
    return request<OrdersPage>(
      `${ordersPath(hotelId)}${query ? `?${query}` : ""}`
    )
  },

  get(hotelId: string, id: string): Promise<Order> {
    return request<Order>(`${ordersPath(hotelId)}/${encodeURIComponent(id)}`)
  },

  updateStatus(
    hotelId: string,
    id: string,
    status: OrderStatus,
    reason?: string
  ): Promise<Order> {
    return request<Order>(
      `${ordersPath(hotelId)}/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }
    )
  },
}
