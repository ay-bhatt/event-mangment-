import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LayoutDashboard, FolderOpen } from 'lucide-react'
import { CustomFolder } from '@/components/custom-folder/CustomFolder'
import { VolunteerManager } from '@/components/VolunteerManager'
import { Button } from '@/components/ui/button'
import { IntegrationBanner } from '@/components/IntegrationBanner'
import { BRAND } from '@/lib/brand'
import { loadSettings } from '@/lib/settings'
import { getStoredPageTitle } from '@/lib/page-titles'
import { PageTitleEditor } from '@/components/PageTitleEditor'

export const Route = createFileRoute('/_authenticated/custom-folder')({
  component: CustomFolderPage,
})

function CustomFolderPage() {
  const settings = loadSettings()
  const [title, setTitle] = useState(() => getStoredPageTitle('custom-folder'))

  useEffect(() => {
    const listener = () => setTitle(getStoredPageTitle('custom-folder'))
    window.addEventListener('caumas-page-titles-updated', listener)
    return () => window.removeEventListener('caumas-page-titles-updated', listener)
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="caumas-hero p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {BRAND.name} · {settings.eventName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl" title="Click Rename or double-click the sidebar label to rename this page">
                {title}
              </h1>
              <PageTitleEditor pageKey="custom-folder" defaultTitle="Custom Folder" />
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Open a secure folder to manage participant QR codes and details with the same app theme and layout.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="caumas-btn-gradient gap-2 rounded-full shadow-md">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/volunteers">
                <FolderOpen className="h-4 w-4" />
                View volunteers
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <IntegrationBanner />

      <CustomFolder />

      <VolunteerManager />

      <div className="rounded-3xl border border-border/40 bg-card p-6 text-sm text-muted-foreground shadow-sm">
        <p className="font-semibold">Tip</p>
        <p className="mt-2">
          Use this custom folder page to open participant details one-by-one and generate QR passes without crowding the dashboard.
        </p>
      </div>
    </div>
  )
}
