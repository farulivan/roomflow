import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/features/auth/auth-context"
import { appConfig } from "@/lib/config"
import { createQueryClient } from "@/lib/query-client"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider storageKey={appConfig.storageKeys.theme}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" closeButton richColors />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
