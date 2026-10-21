import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import "./index.css"
import { AppProviders } from "@/app/providers"
import { router } from "@/app/router"
import { BootError } from "@/app/boot-error"

/**
 * The mock backend intercepts fetch at the service-worker level, in dev and
 * in the deployed build alike. It must be running before the first query
 * fires, hence the async bootstrap.
 */
async function enableMocking() {
  const { worker } = await import("./mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass", quiet: true })
}

const root = createRoot(document.getElementById("root")!)

enableMocking()
  .then(() => {
    root.render(
      <StrictMode>
        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
      </StrictMode>
    )
  })
  .catch((error: unknown) => {
    // Without the worker, every request would fail; say why instead of
    // showing a blank page.
    console.error("[roomflow] the demo backend failed to start", error)
    root.render(<BootError />)
  })
