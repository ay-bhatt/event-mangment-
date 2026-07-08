import { Link, useRouterState } from '@tanstack/react-router'
import {
  Compass,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Music,
  ScanLine,
  Settings,
  Star,
  Sun,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { CaumasBrand, CaumasLogoMark } from '@/components/CaumasBrand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
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
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex',
        isDark ? 'sidebar-icon-only w-[4.5rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'border-b border-sidebar-border',
          isDark ? 'flex justify-center px-2 py-4' : 'px-4 py-5',
        )}
      >
        {isDark ? (
          <CaumasLogoMark className="h-9 w-9" />
        ) : (
          <CaumasBrand showTagline={false} variant="sidebar" />
        )}
      </div>

      <nav
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          isDark ? 'items-center gap-2 p-2' : 'gap-1 p-3',
        )}
      >
        {navItems.map(({ to, label, icon: Icon }) => {
          const active =
            pathname === to ||
            (to !== '/dashboard' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              title={label}
              aria-label={label}
              className={cn(
                isDark
                  ? cn(
                      'sidebar-icon-link',
                      active && 'sidebar-icon-link-active',
                    )
                  : cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    ),
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isDark && label}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'border-t border-sidebar-border',
          isDark ? 'flex flex-col items-center gap-1 p-2' : 'space-y-1 p-3',
        )}
      >
        <Button
          variant="ghost"
          size={isDark ? 'icon' : 'default'}
          className={cn(
            isDark
              ? 'h-11 w-11 rounded-xl text-sidebar-foreground/90 hover:bg-sidebar-accent'
              : 'w-full justify-start gap-2 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          )}
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!isDark && 'Dark mode'}
        </Button>
        <Button
          variant="ghost"
          size={isDark ? 'icon' : 'default'}
          className={cn(
            isDark
              ? 'h-11 w-11 rounded-xl text-sidebar-foreground/90 hover:bg-sidebar-accent'
              : 'w-full justify-start gap-2 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          )}
          onClick={() => void logout()}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          {!isDark && 'Logout'}
        </Button>
      </div>
    </aside>
  )
}
