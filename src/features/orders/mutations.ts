import {
  useIsMutating,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { Order } from "@/domain/order"
import type { OrdersPage } from "@/domain/order-query"
import type { OrderAction } from "@/domain/order-status"
import { metricsKeys } from "@/features/dashboard/queries"
import { track } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"

import { ordersApi } from "./api"
import { ordersKeys } from "./queries"

interface UpdateOrderStatusInput {
  order: Order
  action: OrderAction
  reason?: string
}

const updateStatusKey = ["orders", "update-status"] as const

/** The toast line for a change that failed and was put back. */
function revertedDescription(error: Error): string {
  return error instanceof ApiError
    ? `${error.message} The change was reverted.`
    : "The change was reverted. Check your connection and try again."
}

/** Reloads everything that shows this hotel's orders. */
function refreshHotel(queryClient: QueryClient, hotelId: string): void {
  void queryClient.invalidateQueries({ queryKey: ordersKeys.all(hotelId) })
  void queryClient.invalidateQueries({ queryKey: metricsKeys.all(hotelId) })
}

/** Writes one order into every cached list page and its detail entry. */
function writeOrder(queryClient: QueryClient, next: Order): void {
  queryClient.setQueriesData<OrdersPage>(
    { queryKey: ordersKeys.lists(next.hotelId) },
    (page) =>
      page && {
        ...page,
        items: page.items.map((item) => (item.id === next.id ? next : item)),
      }
  )
  queryClient.setQueryData<Order>(
    ordersKeys.detail(next.hotelId, next.id),
    (current) => current && next
  )
}

/**
 * Moves an order through its lifecycle. Quick, reversible steps
 * (Acknowledge, Approve, Start, Complete) are optimistic: the new status
 * shows at once, and on failure only that order is put back, so a change
 * to another order made meanwhile survives. Confirmed steps (Cancel,
 * Reject) are not: the dialog that asked stays open and pending until the
 * server answers, and reports a failure itself.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: updateStatusKey,
    mutationFn: ({ order, action, reason }: UpdateOrderStatusInput) =>
      ordersApi.updateStatus(order.hotelId, order.id, action.to, reason),

    onMutate: async ({ order, action }) => {
      if (action.confirm) return
      await queryClient.cancelQueries({
        queryKey: ordersKeys.all(order.hotelId),
      })
      writeOrder(queryClient, { ...order, status: action.to })
    },

    onError: (error, { order, action }) => {
      track("order_action", {
        orderId: order.id,
        from: order.status,
        to: action.to,
        outcome: "error",
      })
      if (action.confirm) return

      writeOrder(queryClient, order)
      toast.error(`Couldn't ${action.label.toLowerCase()} ${order.id}`, {
        description: revertedDescription(error),
      })
    },

    onSuccess: (updated, { order, action }) => {
      writeOrder(queryClient, updated)
      toast.success(`Order ${updated.id} ${action.doneLabel}`)
      track("order_action", {
        orderId: updated.id,
        from: order.status,
        to: action.to,
        outcome: "success",
      })
    },

    onSettled: (_updated, _error, { order }) =>
      refreshHotel(queryClient, order.hotelId),
  })
}

/**
 * Records that a declined payment was collected. Optimistic, like the
 * quick lifecycle steps: it's easy to retry, and on failure only this
 * order is put back.
 */
export function useCollectPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: Order) =>
      ordersApi.collectPayment(order.hotelId, order.id),

    onMutate: async (order) => {
      await queryClient.cancelQueries({
        queryKey: ordersKeys.all(order.hotelId),
      })
      writeOrder(queryClient, { ...order, paymentStatus: "Paid" })
    },

    onError: (error, order) => {
      writeOrder(queryClient, order)
      toast.error(`Couldn't record the payment for ${order.id}`, {
        description: revertedDescription(error),
      })
      track("payment_collected", { orderId: order.id, outcome: "error" })
    },

    onSuccess: (updated) => {
      writeOrder(queryClient, updated)
      toast.success(`Payment for ${updated.id} collected`)
      track("payment_collected", { orderId: updated.id, outcome: "success" })
    },

    onSettled: (_updated, _error, order) =>
      refreshHotel(queryClient, order.hotelId),
  })
}

/**
 * Whether a status change for this order is in flight, from any component.
 * The row menu, the details sheet and the confirm dialog each hold their
 * own mutation hook, so they ask the shared mutation cache instead.
 */
export function useIsOrderUpdating(orderId: string): boolean {
  return (
    useIsMutating({
      mutationKey: updateStatusKey,
      predicate: (mutation) =>
        (mutation.state.variables as UpdateOrderStatusInput | undefined)?.order
          .id === orderId,
    }) > 0
  )
}
