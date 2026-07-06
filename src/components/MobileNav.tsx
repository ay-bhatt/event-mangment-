import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ScanLine,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/volunteers', label: 'People', icon: Users },
  { to: '/scanner', label: 'Scan', icon: ScanLine },
  { to: '/meal-scanner', label: 'Meals', icon: UtensilsCrossed },
  { to: '/settings', label: 'More', icon: Settings },
] as const

const activityRoutes = ['/adventure', '/cultural', '/workshop'] as const

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (to: string) => {
    if (to === '/settings') {
      return (
        pathname === '/settings' ||
        activityRoutes.some((route) => pathname.startsWith(route))
      )
    }
    return pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = isActive(to)
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn('mobile-nav-item', active && 'mobile-nav-item-active')}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
          </Link>
        )
      })}
    </nav>
  )
}
