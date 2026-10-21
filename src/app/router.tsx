import { createBrowserRouter, Outlet } from "react-router"

import { LoginPage } from "@/features/auth/login-page"
import { OrderDetailsSheet } from "@/features/orders/order-details-sheet"
import { OrdersPage } from "@/features/orders/orders-page"
import { DemoControls } from "@/features/simulator/demo-controls"

import { AppShell } from "./app-shell"
import { DashboardRoute } from "./dashboard-route"
import { HomeRedirect } from "./home-redirect"
import { HotelScope } from "./hotel-scope"
import { RequireAuth } from "./require-auth"
import { NotFoundPage, RouteErrorPage } from "./route-error"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomeRedirect /> },
      {
        path: "/hotels/:hotelId",
        element: (
          <HotelScope>
            <AppShell headerExtras={<DemoControls />} />
          </HotelScope>
        ),
        children: [
          { index: true, element: <DashboardRoute /> },
          {
            path: "orders",
            element: <OrdersPage />,
            children: [{ path: ":orderId", element: <OrderDetailsSheet /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
