import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { Button } from "@/components/ui/button"
import { paths } from "@/lib/paths"

import { StatusScreen } from "./status-screen"

export function NotFoundPage() {
  return (
    <StatusScreen
      title="Page not found"
      message="This page does not exist. It may have been moved, or the link is wrong."
    >
      <Button asChild>
        <Link to={paths.home}>Go to dashboard</Link>
      </Button>
    </StatusScreen>
  )
}

/** Route-level error boundary: render failures land here, not on a blank page. */
export function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <StatusScreen
      title="Something went wrong"
      message="The page hit an unexpected error. Reload to continue where you left off."
    >
      <Button onClick={() => window.location.reload()}>Reload</Button>
      <Button asChild variant="outline">
        <Link to={paths.home}>Go to dashboard</Link>
      </Button>
    </StatusScreen>
  )
}
