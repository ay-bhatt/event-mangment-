import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { getStoredPageTitles } from '@/lib/page-titles'

const activityTabs = [
  { to: '/adventure', key: 'adventure' as const },
  { to: '/cultural', key: 'cultural' as const },
  { to: '/workshop', key: 'workshop' as const },
] as const

export function ActivitySwitchTabs({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const pageTitles = getStoredPageTitles()

  return (
    <div className={cn('switch-tabs', className)} role="tablist">
      {activityTabs.map(({ to, key }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`)
        return (
          <Link
            key={to}
            to={to}
            role="tab"
            aria-selected={active}
            className={cn('switch-tab', active && 'switch-tab-active')}
          >
            {pageTitles[key]}
          </Link>
        )
      })}
    </div>
  )
}
