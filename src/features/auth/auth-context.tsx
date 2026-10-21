/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { track } from "@/lib/analytics"
import { appConfig } from "@/lib/config"

import type { LoginFormValues } from "./schema"

/** A signed-in visitor. Mock session — no token, nothing server-verified. */
const sessionSchema = z.object({ email: z.email() })

type Session = z.infer<typeof sessionSchema>

interface AuthContextValue {
  session: Session | null
  login: (values: LoginFormValues) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

/** Simulated request latency so the sign-in button has something to show. */
const LOGIN_DELAY_MS = 600

/** The stored session, or null if it's missing or not one we wrote. */
function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(appConfig.storageKeys.session)
    if (!raw) return null
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(appConfig.storageKeys.session, JSON.stringify(session))
  } else {
    localStorage.removeItem(appConfig.storageKeys.session)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  // Lazy initializer, not an effect: the first render already reflects any
  // stored session, so there's no flash of a logged-out route on load.
  const [session, setSession] = React.useState<Session | null>(readSession)
  const [isLoading, setIsLoading] = React.useState(false)

  const login = React.useCallback(async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      // Mock only: the schema already guarantees a well-formed email and a
      // 6+ character password, and that's all this "backend" requires — it
      // always succeeds. Swapping in a real authentication request is the
      // obvious next step for a production deployment.
      await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS))
      const nextSession: Session = { email: values.email }
      writeSession(nextSession)
      setSession(nextSession)
      track("login", {})
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(() => {
    writeSession(null)
    setSession(null)
    // The next person to sign in on this browser starts from the server,
    // not from what the last one had loaded.
    queryClient.clear()
    track("logout", {})
  }, [queryClient])

  const value = React.useMemo(
    () => ({ session, login, logout, isLoading }),
    [session, login, logout, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
