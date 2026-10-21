import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SERVICES,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type ServiceType,
} from "./order"
import { isSlaOverdue } from "./sla"

export const ORDER_SORTS = [
  "newest",
  "oldest",
  "amount-high",
  "amount-low",
] as const

export type OrderSort = (typeof ORDER_SORTS)[number]

const DEFAULT_PAGE_SIZE = 10

export interface OrderQueryParams {
  /** Case-insensitive match against order ID, guest name and room number. */
  search?: string
  status?: OrderStatus
  service?: ServiceType
  payment?: PaymentStatus
  /** "overdue" narrows to orders currently breaching their SLA. */
  sla?: "overdue"
  sort?: OrderSort
  page?: number
  pageSize?: number
}

export interface OrdersPage {
  items: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function isOneOf<T extends string>(
  value: string | null,
  options: readonly T[]
): value is T {
  return value !== null && (options as readonly string[]).includes(value)
}

function toPositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Read query params from a URL, dropping anything invalid. Shared by the
 * API (parsing requests) and the orders page (parsing the browser URL),
 * so both sides always speak the same dialect.
 */
export function parseOrderQuery(
  searchParams: URLSearchParams
): OrderQueryParams {
  const params: OrderQueryParams = {}
  const search = searchParams.get("search")
  if (search) params.search = search

  const status = searchParams.get("status")
  if (isOneOf(status, ORDER_STATUSES)) params.status = status

  const service = searchParams.get("service")
  if (isOneOf(service, SERVICES)) params.service = service

  const payment = searchParams.get("payment")
  if (isOneOf(payment, PAYMENT_STATUSES)) params.payment = payment

  if (searchParams.get("sla") === "overdue") params.sla = "overdue"

  const sort = searchParams.get("sort")
  if (isOneOf(sort, ORDER_SORTS)) params.sort = sort

  const page = toPositiveInt(searchParams.get("page"))
  if (page !== undefined) params.page = page

  const pageSize = toPositiveInt(searchParams.get("pageSize"))
  if (pageSize !== undefined) params.pageSize = pageSize

  return params
}

/** Write query params to a URL, omitting defaults to keep URLs clean. */
export function serializeOrderQuery(params: OrderQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (params.search?.trim()) searchParams.set("search", params.search.trim())
  if (params.status) searchParams.set("status", params.status)
  if (params.service) searchParams.set("service", params.service)
  if (params.payment) searchParams.set("payment", params.payment)
  if (params.sla) searchParams.set("sla", params.sla)
  if (params.sort && params.sort !== "newest")
    searchParams.set("sort", params.sort)
  if (params.page !== undefined && params.page > 1)
    searchParams.set("page", String(params.page))
  if (params.pageSize !== undefined && params.pageSize !== DEFAULT_PAGE_SIZE)
    searchParams.set("pageSize", String(params.pageSize))
  return searchParams
}

function matchesSearch(order: Order, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term === "") return true
  return (
    order.id.toLowerCase().includes(term) ||
    order.guestName.toLowerCase().includes(term) ||
    order.roomNumber.toLowerCase().includes(term)
  )
}

const comparators: Record<OrderSort, (a: Order, b: Order) => number> = {
  newest: (a, b) => b.orderTime.localeCompare(a.orderTime),
  oldest: (a, b) => a.orderTime.localeCompare(b.orderTime),
  "amount-high": (a, b) => b.amount - a.amount,
  "amount-low": (a, b) => a.amount - b.amount,
}

/**
 * Search, filter, sort and paginate orders the way a backend would.
 * Pure and deterministic for a given `now`, which is only consulted for
 * the SLA filter. Ties sort by ID so pagination is stable.
 */
export function applyOrderQuery(
  orders: readonly Order[],
  params: OrderQueryParams,
  now: Date
): OrdersPage {
  const {
    search = "",
    status,
    service,
    payment,
    sla,
    sort = "newest",
    pageSize = DEFAULT_PAGE_SIZE,
  } = params

  const filtered = orders.filter(
    (order) =>
      matchesSearch(order, search) &&
      (status === undefined || order.status === status) &&
      (service === undefined || order.service === service) &&
      (payment === undefined || order.paymentStatus === payment) &&
      (sla === undefined || isSlaOverdue(order, now))
  )

  const compare = comparators[sort]
  const sorted = [...filtered].sort(
    (a, b) => compare(a, b) || a.id.localeCompare(b.id)
  )

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  }
}
