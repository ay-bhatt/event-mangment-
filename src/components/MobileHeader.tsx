import { Link } from '@tanstack/react-router'
import { Bell, Search } from 'lucide-react'
import { loadSettings } from '@/lib/settings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

export function MobileHeader() {
  const settings = loadSettings()

  return (
    <header className="mobile-header md:hidden">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(settings.eventName || 'CAUMAS')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Hello,</p>
          <p className="truncate text-base font-bold leading-tight">
            {settings.eventName || 'Event Admin'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
          <Link to="/volunteers" aria-label="Search volunteers">
            <Search className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  )
}
