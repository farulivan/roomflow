import { Button } from "@/components/ui/button"

import { StatusScreen } from "./status-screen"

/**
 * Rendered when the in-browser mock backend can't start. Service workers
 * only run in a secure context, so the usual cause is opening the dev
 * server over plain http on a LAN address (e.g. a phone on 192.168.x.x).
 */
export function BootError() {
  return (
    <StatusScreen
      title="The demo backend couldn't start"
      message="This app's API runs in a service worker, which browsers only allow over HTTPS or on localhost. Open it from one of those and reload."
    >
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </StatusScreen>
  )
}
