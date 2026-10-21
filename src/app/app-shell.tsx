import { useEffect, useState } from "react"
import { ClipboardList, LayoutDashboard, LogOut, Menu } from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"

import { BrandMark } from "@/components/shared/brand-mark"
import { Credit } from "@/components/shared/credit"
import { HouseClock } from "@/components/shared/house-clock"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/auth-context"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { HotelSwitcher } from "@/features/hotels/hotel-switcher"
import { useOrderSimulator } from "@/features/simulator/use-order-simulator"
import { track } from "@/lib/analytics"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: paths.dashboard, label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: paths.orders, label: "Orders", icon: ClipboardList, end: false },
] as const

/** The signed-in person's initial, in the brand color. */
function UserAvatar({ email }: { email: string }) {
  return (
    <Avatar>
      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
        {email.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

function UserMenu() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  // AppShell only ever renders behind RequireAuth, so session is always set
  // in practice — except for the one render right after logout() clears
  // it and before the navigate below commits. This keeps that tick safe.
  if (!session) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="ml-1 transition-shadow hover:ring-4 hover:ring-foreground/[0.06] aria-expanded:ring-4 aria-expanded:ring-foreground/[0.06]"
        >
          <UserAvatar email={session.email} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2 font-normal">
          <UserAvatar email={session.email} />
          <span className="min-w-0 truncate text-sm text-foreground">
            {session.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            void navigate(paths.login)
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const hotel = useCurrentHotel()

  return (
    <nav aria-label="Main" className="grid gap-0.5 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={label}
          to={to(hotel.id)}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex h-8 items-center gap-2.5 rounded-lg px-2 text-body transition-colors",
              isActive
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )
          }
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Brand, hotel switcher and navigation: the sidebar and mobile sheet share it. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="space-y-4 px-3 pt-5 pb-4">
        <BrandMark className="px-2" />
        <HotelSwitcher onSwitch={onNavigate} />
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-1 border-t px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Demo data ・ resets on reload
        </p>
        <Credit />
      </div>
    </>
  )
}

/**
 * Application frame: fixed sidebar on desktop, sheet navigation on mobile,
 * and a utility header shared by every page. Mounted for as long as a
 * hotel is open, so this is also where the background order simulator
 * runs — it needs to keep ticking regardless of which page is showing.
 */
export function AppShell({ headerExtras }: { headerExtras?: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const hotel = useCurrentHotel()
  useOrderSimulator(hotel.id)

  useEffect(() => {
    track("page_view", { path: location.pathname })
  }, [location.pathname])

  return (
    <div className="flex min-h-svh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-svh w-60 flex-col border-r bg-sidebar lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-background px-3 md:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark />
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              ・ {hotel.name}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <HouseClock />
            {headerExtras}
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pt-4 pb-10 md:px-8 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
