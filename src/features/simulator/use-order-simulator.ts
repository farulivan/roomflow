import { useEffect, useRef } from "react"

import { appConfig } from "@/lib/config"
import { useDemoSettings } from "@/lib/use-demo-settings"

import { useCreateIncomingOrder } from "./mutations"

/**
 * Runs for the whole app lifetime, entirely in the background: while "New
 * orders" demo mode is on, one realistic incoming order arrives at the
 * hotel being viewed every `simulatorIntervalMs`. Mount once near the app
 * root — this hook returns nothing, callers only need its effect.
 */
export function useOrderSimulator(hotelId: string): void {
  const settings = useDemoSettings()
  const createIncomingOrder = useCreateIncomingOrder()

  // Keep a ref to the latest mutate function so the interval effect below
  // doesn't need it as a dependency — it only ever needs to restart when
  // autoOrders itself changes, not when the mutation object is recreated.
  const mutateRef = useRef(createIncomingOrder.mutate)
  useEffect(() => {
    mutateRef.current = createIncomingOrder.mutate
  })

  useEffect(() => {
    if (!settings.autoOrders) return

    const timer = setInterval(() => {
      mutateRef.current(hotelId)
    }, appConfig.simulatorIntervalMs)

    return () => clearInterval(timer)
  }, [settings.autoOrders, hotelId])
}
