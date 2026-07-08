import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  LayoutDashboard,
  ScanLine,
  Users,
  UtensilsCrossed,
  BadgeCheck,
} from 'lucide-react'
import { ActivitySwitchTabs } from '@/components/ActivitySwitchTabs'
import { IntegrationBanner } from '@/components/IntegrationBanner'
import { SwitchTabs } from '@/components/SwitchTabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BRAND } from '@/lib/brand'
import {
  fetchEventStats,
  entryRate,
  type EventStats,
} from '@/lib/dashboard-stats'
import { loadSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

type DashboardView = 'overview' | 'activities' | 'meals'

const viewTabs = [
  { value: 'overview' as const, label: 'Overview' },
  { value: 'activities' as const, label: 'Activities' },
  { value: 'meals' as const, label: 'Meals' },
]

function DashboardPage() {
  const settings = loadSettings()
  const [stats, setStats] = useState<EventStats | null>(null)
  const [view, setView] = useState<DashboardView>('overview')

  const refreshStats = useCallback(async () => {
    const data = await fetchEventStats()
    setStats(data)
  }, [])

  useEffect(() => {
    void refreshStats()
    const interval = setInterval(() => void refreshStats(), 30000)
    return () => clearInterval(interval)
  }, [refreshStats])

  const rate = stats ? entryRate(stats) : 0
  const s = stats ?? {
    totalVolunteers: 0,
    entryVerified: 0,
    kitReceived: 0,
    mealsServed: 0,
    totalRegistrations: 0,
    totalAttendees: 0,
    checkedInUsers: 0,
    pendingMeals: 0,
    qrScans: 0,
    volunteerActivity: 0,
    certificateReceived: 0,
  }

  const tiles = [
    {
      label: 'Registrations',
      value: s.totalRegistrations,
      icon: Users,
      hint: 'Total registered',
      pastel: 'pastel-card-pink',
    },
    {
      label: 'Checked in',
      value: s.checkedInUsers,
      icon: BadgeCheck,
      hint: `${rate}% entry verified`,
      pastel: 'pastel-card-peach',
    },
    {
      label: 'Meals served',
      value: s.mealsServed,
      icon: UtensilsCrossed,
      hint: `${s.pendingMeals} pending / denied`,
      pastel: 'pastel-card-mint',
    },
    {
      label: 'QR scans',
      value: s.qrScans,
      icon: ScanLine,
      hint: `${s.volunteerActivity} volunteer actions`,
      pastel: 'pastel-card-blue',
    },
  ] as const

  const quickLinks = [
    {
      title: 'Daily meal scanner',
      desc: 'Breakfast, lunch, dinner passes',
      to: '/meal-scanner',
      color: 'pastel-card-mint',
    },
    {
      title: 'Activity passes',
      desc: 'Adventure, cultural, workshop',
      to: '/adventure',
      color: 'pastel-card-lavender',
    },
    {
      title: 'Custom folder',
      desc: 'Participant QR and details page',
      to: '/custom-folder',
      color: 'pastel-card-slate',
    },
    {
      title: 'Event settings',
      desc: 'Name, QR prefix, email template',
      to: '/settings',
      color: 'pastel-card-blue',
    },
  ] as const

  const activityBoxes = [
    { label: 'Adventure', count: 'Passes', to: '/adventure', color: 'pastel-card-peach' },
    { label: 'Cultural', count: 'Passes', to: '/cultural', color: 'pastel-card-pink' },
    { label: 'Workshop', count: 'Passes', to: '/workshop', color: 'pastel-card-lavender' },
  ] as const

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="caumas-hero p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {BRAND.name} · {settings.eventName}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Event Management Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {BRAND.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="caumas-btn-gradient gap-2 rounded-full shadow-md">
              <Link to="/scanner">
                <ScanLine className="h-4 w-4" />
                Open scanner
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/volunteers">
                <Users className="h-4 w-4" />
                Volunteers
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <SwitchTabs items={viewTabs} value={view} onChange={setView} />

      {view === 'activities' && <ActivitySwitchTabs />}

      <IntegrationBanner />

      {(view === 'overview' || view === 'meals') && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ label, value, icon: Icon, hint, pastel }) => (
            <div key={label} className={cn('pastel-card', pastel)}>
              <div className="mb-3 flex items-center gap-2">
                <div className="pastel-card-icon">
                  <Icon className="h-4 w-4 text-foreground/80" />
                </div>
                <p className="text-sm font-semibold text-foreground/80">{label}</p>
              </div>
              <p className="text-3xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 flex-1 text-xs text-foreground/55">{hint}</p>
              <Link
                to={
                  label === 'Meals served'
                    ? '/meal-scanner'
                    : label === 'Registrations'
                      ? '/volunteers'
                      : '/scanner'
                }
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground/65 transition-colors hover:text-foreground"
              >
                Check
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {view === 'overview' && (
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map(({ title, desc, to, color }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'little-box group !flex-row !items-center !justify-between dark:!bg-card',
                  color,
                )}
              >
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-foreground/60 dark:text-muted-foreground">
                    {desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground/50 transition-transform group-hover:translate-x-0.5 dark:text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <Card className="rounded-3xl border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Custom Folder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Open the Custom Folder page to view participant QR codes and full participant details.
                </p>
                <Button asChild className="w-full justify-center">
                  <Link to="/custom-folder">Go to Custom Folder</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="rounded-3xl border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                Use this panel to add fast actions for selected participants, download bulk QR codes, or navigate to the registration flow.
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'activities' && (
        <div className="grid gap-3 sm:grid-cols-3">
          {activityBoxes.map(({ label, count, to, color }, i) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'little-box little-box-row dark:!bg-card',
                color,
                i === 0 && 'dark:little-box-active',
              )}
            >
              <span className="font-semibold">{label}</span>
              <span className="text-sm font-bold tabular-nums">{count}</span>
            </Link>
          ))}
        </div>
      )}

      {view === 'meals' && (
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="pastel-card-icon !h-14 !w-14">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Meal scanning</p>
              <p className="text-sm text-muted-foreground">
                Track breakfast, lunch, and dinner passes on site.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/meal-scanner">Open meal scanner</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
