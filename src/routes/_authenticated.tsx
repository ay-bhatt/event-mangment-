import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { DarkTopBar } from '@/components/DarkTopBar'
import { MobileHeader } from '@/components/MobileHeader'
import { MobileNav } from '@/components/MobileNav'
import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Wait for auth to initialize if needed
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading, isOrganizationProfileComplete, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isOrganizationProfileComplete && location.pathname !== '/organization-setup') {
      navigate({ to: '/organization-setup' })
    }
  }, [isLoading, isAuthenticated, isOrganizationProfileComplete, location.pathname, user, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    navigate({ to: '/login' })
    return null
  }

  // If we're on organization setup, don't show the sidebar
  if (location.pathname === '/organization-setup') {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <DarkTopBar />
        <main className="flex-1 overflow-auto px-4 pb-28 pt-2 md:px-8 md:pb-8 md:pt-4">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
