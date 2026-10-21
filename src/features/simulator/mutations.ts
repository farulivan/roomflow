import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { metricsKeys } from "@/features/dashboard/queries"
import { ordersKeys } from "@/features/orders/queries"
import { track } from "@/lib/analytics"
import { formatOrderAmount } from "@/lib/format"
import { paths } from "@/lib/paths"

import { demoApi } from "./api"

/**
 * Generates one realistic incoming order, refreshes the caches that display
 * it, and surfaces an actionable toast. Shared by the automatic interval
 * (useOrderSimulator) and the manual "Send order now" control, so there is
 * exactly one definition of what "a new order arrived" does to the UI.
 */
export function useCreateIncomingOrder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (hotelId: string) => demoApi.createIncomingOrder(hotelId),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({
        queryKey: ordersKeys.all(order.hotelId),
      })
      void queryClient.invalidateQueries({
        queryKey: metricsKeys.all(order.hotelId),
      })
      track("demo_order_created", {
        orderId: order.id,
        service: order.service,
        status: order.status,
      })

      toast.info(`New order: ${order.service}, Room ${order.roomNumber}`, {
        description:
          order.status === "Pending Approval"
            ? "Needs approval: more extra beds than the room allows."
            : `${order.guestName} ・ ${formatOrderAmount(order.amount)}`,
        action: {
          label: "View",
          onClick: () => void navigate(paths.order(order.hotelId, order.id)),
        },
      })
    },
    onError: (error) => {
      // A background simulator erroring shouldn't toast at the user —
      // especially since "Simulate API errors" makes this the expected
      // outcome on every tick. The manual "Send order now" button adds its
      // own toast per call, because there the user is waiting on it.
      console.debug("[simulator] failed to create an incoming order", error)
    },
  })
}

/** Reseeds the demo dataset; a deliberate user action, so failures do toast. */
export function useResetDemoData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => demoApi.reset(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.root })
      void queryClient.invalidateQueries({ queryKey: metricsKeys.root })
      toast.success("Demo data reset")
    },
    onError: () => {
      toast.error("Couldn't reset demo data", {
        description: "Check your connection and try again.",
      })
    },
  })
}
