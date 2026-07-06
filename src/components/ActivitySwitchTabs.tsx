import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const activityTabs = [
  { to: '/adventure', label: 'Adventure' },
  { to: '/cultural', label: 'Cultural' },
  { to: '/workshop', label: 'Workshop' },
] as const

export function ActivitySwitchTabs({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className={cn('switch-tabs', className)} role="tablist">
      {activityTabs.map(({ to, label }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`)
        return (
          <Link
            key={to}
            to={to}
            role="tab"
            aria-selected={active}
            className={cn('switch-tab', active && 'switch-tab-active')}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
