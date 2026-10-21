import { afterEach, describe, expect, test } from "bun:test"
import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"

import type { Order } from "@/domain/order"
import type { OrdersPage } from "@/domain/order-query"
import { actionsForStatus, type OrderAction } from "@/domain/order-status"
import { makeOrder } from "@/test/factories"
import { createTestQueryClient } from "@/test/render"

import { ordersKeys } from "./queries"
import { useUpdateOrderStatus } from "./mutations"

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

/**
 * Stub fetch with a response the test releases when it's ready. Releasing
 * before the request is even sent is fine: the response waits for it.
 */
function holdNextResponse() {
  let release: ((response: Response) => void) | undefined
  let queued: Response | undefined
  globalThis.fetch = (() =>
    new Promise<Response>((resolve) => {
      if (queued) resolve(queued)
      else release = resolve
    })) as unknown as typeof fetch

  const send = (response: Response) => {
    if (release) release(response)
    else queued = response
  }
  return {
    succeed: (body: Order) => send(Response.json(body)),
    fail: () =>
      send(Response.json({ message: "Server down." }, { status: 500 })),
  }
}

function actionTo(order: Order, label: string): OrderAction {
  const action = actionsForStatus(order.status).find((a) => a.label === label)
  if (!action) throw new Error(`${order.status} has no ${label} action`)
  return action
}

function setup() {
  const queryClient = createTestQueryClient()
  const first = makeOrder({ status: "New" })
  const second = makeOrder({ status: "Acknowledged" })
  const listKey = ordersKeys.list(first.hotelId, {})
  queryClient.setQueryData<OrdersPage>(listKey, {
    items: [first, second],
    total: 2,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  })

  const { result } = renderHook(() => useUpdateOrderStatus(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  const statusOf = (id: string) =>
    queryClient
      .getQueryData<OrdersPage>(listKey)
      ?.items.find((item) => item.id === id)?.status

  const setStatus = (id: string, status: Order["status"]) =>
    queryClient.setQueryData<OrdersPage>(
      listKey,
      (page) =>
        page && {
          ...page,
          items: page.items.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        }
    )

  return { result, first, second, statusOf, setStatus }
}

describe("useUpdateOrderStatus", () => {
  test("an optimistic action shows at once and rolls back only its own order", async () => {
    const response = holdNextResponse()
    const { result, first, second, statusOf, setStatus } = setup()

    act(() => {
      result.current.mutate({
        order: first,
        action: actionTo(first, "Acknowledge"),
      })
    })
    await waitFor(() => expect(statusOf(first.id)).toBe("Acknowledged"))

    // Meanwhile another change lands on a different order.
    act(() => {
      setStatus(second.id, "In Progress")
    })

    response.fail()
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(statusOf(first.id)).toBe("New")
    expect(statusOf(second.id)).toBe("In Progress")
  })

  test("a confirmed action leaves the cache alone until the server answers", async () => {
    const response = holdNextResponse()
    const { result, first, statusOf } = setup()

    act(() => {
      result.current.mutate({ order: first, action: actionTo(first, "Cancel") })
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))
    expect(statusOf(first.id)).toBe("New")

    response.succeed({ ...first, status: "Cancelled" })
    await waitFor(() => expect(statusOf(first.id)).toBe("Cancelled"))
  })

  test("a failed confirmed action changes nothing it has to undo", async () => {
    const response = holdNextResponse()
    const { result, first, statusOf } = setup()

    act(() => {
      result.current.mutate({ order: first, action: actionTo(first, "Cancel") })
    })
    response.fail()
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(statusOf(first.id)).toBe("New")
    expect(result.current.error?.message).toBe("Server down.")
  })
})
