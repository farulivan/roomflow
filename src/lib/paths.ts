/**
 * Every in-app URL, built in one place so a link can never forget which
 * hotel it belongs to. `search` is an optional "?…" string to carry along,
 * e.g. the orders list's current filters.
 */
export const paths = {
  home: "/",
  login: "/login",
  dashboard: (hotelId: string) => `/hotels/${hotelId}`,
  orders: (hotelId: string, search = "") =>
    `/hotels/${hotelId}/orders${search}`,
  order: (hotelId: string, orderId: string, search = "") =>
    `/hotels/${hotelId}/orders/${orderId}${search}`,
}
