import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { DarkTopBar } from '@/components/DarkTopBar'
import { MobileHeader } from '@/components/MobileHeader'
import { MobileNav } from '@/components/MobileNav'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
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
