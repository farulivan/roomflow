import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { useAuth } from "@/features/auth/auth-context"

interface RequireAuthProps {
  children: ReactNode
}

/**
 * Gates its children behind a session. Redirects to /login with the full
 * current location (path + search) tucked into route state, so the login
 * page can send the visitor right back to what they were trying to reach.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
