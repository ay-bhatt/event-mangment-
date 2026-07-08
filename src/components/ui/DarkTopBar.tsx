import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, Search, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { loadSettings } from '@/lib/settings'
import { cn, getInitials } from '@/lib/utils'

export function DarkTopBar() {
  const settings = loadSettings()

  return (
    <header className="dark-top-bar">
      <div className="dark-search-bar">
        <Search className="h-4 w-4 shrink-0" />
        <span>Search here</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
          <Link to="/settings" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
          <Link to="/settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <div className="ml-1 flex items-center gap-2 rounded-full border border-primary/30 py-1 pl-1 pr-3">
          <Avatar className="h-8 w-8 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
              {getInitials(settings.eventName || 'CAUMAS')}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate text-sm font-medium">
            {settings.eventName || 'Event Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
