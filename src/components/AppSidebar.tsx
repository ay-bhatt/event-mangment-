import { Link, useRouterState } from '@tanstack/react-router'
import {
  Compass,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Music,
  ScanLine,
  Settings,
  Star,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { CaumasBrand } from '@/components/CaumasBrand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/volunteers', label: 'Volunteers', icon: Users },
  { to: '/adventure', label: 'Adventure', icon: Compass },
  { to: '/custom-folder', label: 'Custom Folder', icon: FolderOpen },
  { to: '/cultural', label: 'Cultural', icon: Music },
  { to: '/workshop', label: 'Workshop', icon: Star },
  { to: '/scanner', label: 'QR Scanner', icon: ScanLine },
  { to: '/meal-scanner', label: 'Meal Scanner', icon: UtensilsCrossed },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border px-4 py-5">
        <CaumasBrand showTagline={false} variant="sidebar" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              title={label}
              aria-label={label}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border space-y-1 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => void logout()}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
