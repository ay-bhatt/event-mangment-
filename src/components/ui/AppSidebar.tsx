import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChevronDown,
  Compass,
  FolderOpen,
  LayoutDashboard,
  LogIn,
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
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  getStoredPageTitle,
  getStoredPageTitles,
  saveStoredPageTitle,
  subscribeStoredPageTitles,
  type PageTitleKey,
} from '@/lib/page-titles'

const renameablePages: Array<{ to: string; key: PageTitleKey }> = [
  { to: '/volunteers', key: 'volunteers' },
  { to: '/adventure', key: 'adventure' },
  { to: '/custom-folder', key: 'custom-folder' },
  { to: '/cultural', key: 'cultural' },
  { to: '/workshop', key: 'workshop' },
]

const staticNavSections = [
  {
    title: 'Entry',
    items: [
      { to: '/entry', label: 'In', icon: LogIn },
      { to: '/exit', label: 'Out', icon: LogOut },
    ],
  },
  {
    title: null,
    items: [
      { to: '/scanner', label: 'QR Scanner', icon: ScanLine },
      { to: '/meal-scanner', label: 'Meal Scanner', icon: UtensilsCrossed },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
] as const

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout } = useAuth()
  const [pageTitles, setPageTitles] = useState<Record<PageTitleKey, string>>(() => getStoredPageTitles())
  const [editingKey, setEditingKey] = useState<PageTitleKey | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => ({ 0: false }))

  useEffect(() => {
    const unsubscribe = subscribeStoredPageTitles(() => {
      setPageTitles(getStoredPageTitles())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const activeEntrySection = staticNavSections[0].items.some(
      ({ to }) => pathname === to || pathname.startsWith(to),
    )
    if (activeEntrySection) {
      setExpandedSections((prev) => ({ ...prev, 0: true }))
    }
  }, [pathname])

  const setRenameTitle = (key: PageTitleKey) => {
    setEditingKey(key)
    setEditingTitle(pageTitles[key])
  }

  const saveRenameTitle = () => {
    if (!editingKey) return
    saveStoredPageTitle(editingKey, editingTitle)
    setPageTitles((prev) => ({ ...prev, [editingKey]: editingTitle.trim() || getStoredPageTitle(editingKey) }))
    setEditingKey(null)
  }

  type NavItem = {
    to: string
    label: string
    icon: typeof LayoutDashboard
    key?: PageTitleKey
  }

  const topNavItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...renameablePages.map(({ to, key }) => ({
      to,
      label: pageTitles[key],
      icon:
        key === 'volunteers'
          ? Users
          : key === 'adventure'
          ? Compass
          : key === 'cultural'
          ? Music
          : key === 'workshop'
          ? Star
          : FolderOpen,
      key,
    })),
  ]

  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border px-4 py-5">
        <CaumasBrand showTagline={false} variant="sidebar" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {topNavItems.map(({ to, label, icon: Icon, key }) => {
          const active = pathname === to || pathname.startsWith(to)
          return (
            <div key={to} className="relative">
              {key && editingKey === key ? (
                <div className="flex items-center gap-2 rounded-xl border border-border p-2 bg-sidebar-accent">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="min-w-0 flex-1 rounded-md bg-white px-2 py-1 text-sm text-slate-900"
                  />
                  <Button size="sm" onClick={saveRenameTitle}>
                    Save
                  </Button>
                </div>
              ) : (
                <Link
                  to={to}
                  title={label}
                  aria-label={label}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                  onDoubleClick={(event) => {
                    if (!key) return
                    event.preventDefault()
                    event.stopPropagation()
                    setRenameTitle(key)
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )}
            </div>
          )
        })}

        {staticNavSections.map((section, sectionIndex) => {
          const sectionExpanded = expandedSections[sectionIndex] ?? true
          const sectionHasActiveItem = section.items.some(
            ({ to }) => pathname === to || pathname.startsWith(to),
          )

          return (
            <div key={sectionIndex} className="pt-3">
              {section.title ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      [sectionIndex]: !sectionExpanded,
                    }))
                  }
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    sectionHasActiveItem || sectionExpanded
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      sectionExpanded ? 'rotate-180' : 'rotate-0',
                    )}
                  />
                </button>
              ) : null}

              {(section.title === null || sectionExpanded) && (
                <div className="mt-2 flex flex-col gap-1">
                  {section.items.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to || pathname.startsWith(to)
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
                </div>
              )}
            </div>
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
