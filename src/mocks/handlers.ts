import { delay, http, HttpResponse } from "msw"

import { computeMetrics } from "@/domain/metrics"
import { isOrderStatus } from "@/domain/order"
import { applyOrderQuery, parseOrderQuery } from "@/domain/order-query"
import { canTransition } from "@/domain/order-status"
import { needsPaymentFollowUp } from "@/domain/payment"
import { getDemoSettings } from "@/lib/demo-settings"

import { db } from "./db"
import { createIncomingOrder } from "./seed"

const notFound = (message: string) =>
  HttpResponse.json({ message }, { status: 404 })

// An order that belongs to a different hotel gets the same 404 as one that
// doesn't exist, so the API never confirms what another tenant holds.
const orderNotFound = (orderId: string) =>
  notFound(`Order ${orderId} was not found.`)

/**
 * The first two handlers run for every request they match. A handler that
 * returns nothing passes the request on to the next one that matches, so
 * these act as middleware: no endpoint below can skip them.
 */
export const handlers = [
  // Demo network conditions: realistic latency, a slow mode, and a failure
  // mode that turns every request into an HTTP 500.
  http.all("/api/*", async () => {
    const settings = getDemoSettings()
    const [min, max] = settings.network === "slow" ? [1800, 2600] : [250, 600]
    await delay(min + Math.random() * (max - min))
    if (settings.failRequests) {
      return HttpResponse.json(
        { message: "Something went wrong on the server. Please try again." },
        { status: 500 }
      )
    }
  }),

  // Every hotel-scoped route needs a hotel that exists.
  http.all("/api/hotels/:hotelId/*", ({ params }) => {
    const hotelId = String(params.hotelId)
    if (!db.profile(hotelId))
      return notFound(`Hotel "${hotelId}" was not found.`)
  }),

  http.get("/api/hotels", () => HttpResponse.json(db.hotels())),

  http.get("/api/hotels/:hotelId/orders", ({ request, params }) => {
    const query = parseOrderQuery(new URL(request.url).searchParams)
    return HttpResponse.json(
      applyOrderQuery(db.list(String(params.hotelId)), query, new Date())
    )
  }),

  http.get("/api/hotels/:hotelId/orders/:orderId", ({ params }) => {
    const orderId = String(params.orderId)
    const order = db.find(String(params.hotelId), orderId)
    return order ? HttpResponse.json(order) : orderNotFound(orderId)
  }),

  http.patch(
    "/api/hotels/:hotelId/orders/:orderId/status",
    async ({ request, params }) => {
      const hotelId = String(params.hotelId)
      const orderId = String(params.orderId)
      const order = db.find(hotelId, orderId)
      if (!order) return orderNotFound(orderId)

      const body = (await request.json()) as { status?: unknown }
      if (!isOrderStatus(body.status)) {
        return HttpResponse.json(
          { message: "A valid target status is required." },
          { status: 400 }
        )
      }

      // The same transition rules the UI uses — illegal moves are rejected
      // even if a stale client asks for them.
      if (!canTransition(order.status, body.status)) {
        return HttpResponse.json(
          {
            message: `An order in "${order.status}" cannot move to "${body.status}".`,
          },
          { status: 422 }
        )
      }

      return HttpResponse.json(db.updateStatus(hotelId, orderId, body.status))
    }
  ),

  http.patch(
    "/api/hotels/:hotelId/orders/:orderId/payment",
    async ({ request, params }) => {
      const hotelId = String(params.hotelId)
      const orderId = String(params.orderId)
      const order = db.find(hotelId, orderId)
      if (!order) return orderNotFound(orderId)

      // Staff can only record that a payment was collected; refunds and
      // charges belong to a payment system, not to this console.
      const body = (await request.json()) as { status?: unknown }
      if (body.status !== "Paid") {
        return HttpResponse.json(
          { message: "Only collecting a payment is supported." },
          { status: 400 }
        )
      }

      if (!needsPaymentFollowUp(order)) {
        return HttpResponse.json(
          { message: `Order ${orderId} has no payment to collect.` },
          { status: 422 }
        )
      }

      return HttpResponse.json(db.updatePayment(hotelId, orderId, "Paid"))
    }
  ),

  http.get("/api/hotels/:hotelId/metrics", ({ params }) =>
    HttpResponse.json(
      computeMetrics(db.list(String(params.hotelId)), new Date())
    )
  ),

  http.post("/api/hotels/:hotelId/demo/orders", ({ params }) => {
    // The hotel check above guarantees the profile exists.
    const profile = db.profile(String(params.hotelId))!
    const order = db.insert(
      createIncomingOrder(profile, db.nextOrderId(profile.hotel), new Date())
    )
    return HttpResponse.json(order, { status: 201 })
  }),

  http.post("/api/demo/reset", () => {
    db.reset()
    return HttpResponse.json({ ok: true })
  }),
]
