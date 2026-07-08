import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Download, Search, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { IntegrationBanner } from '@/components/IntegrationBanner'

import { VolunteerCard } from '@/components/VolunteerCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateBulkPdf } from '@/lib/qr-utils'
import { loadSettings } from '@/lib/settings'
import { getVolunteers, searchVolunteers } from '@/lib/volunteers'

export const Route = createFileRoute('/_authenticated/volunteers')({
  component: VolunteersPage,
})

function VolunteersPage() {
  const all = getVolunteers()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pdfLoading, setPdfLoading] = useState(false)

  const volunteers = useMemo(
    () => (query ? searchVolunteers(query) : all),
    [query, all],
  )

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(volunteers.map((v) => v.id)))
  const clearSelection = () => setSelected(new Set())

  const bulkPdf = async () => {
    const picked = all.filter((v) => selected.has(v.id))
    if (!picked.length) {
      toast.error('Select at least one volunteer')
      return
    }
    setPdfLoading(true)
    try {
      await generateBulkPdf(picked, loadSettings().eventName)
      toast.success(`PDF with ${picked.length} pass(es) downloaded`)
    } catch {
      toast.error('PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Volunteers</h1>
          <p className="text-sm text-muted-foreground">
            {all.length} total · {selected.size} selected
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!selected.size || pdfLoading}
            onClick={bulkPdf}
          >
            <Download className="h-4 w-4" />
            Bulk PDF ({selected.size})
          </Button>
        </div>
      </div>

      <IntegrationBanner />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, ID, team, email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {volunteers.map((v) => (
          <VolunteerCard
            key={v.id}
            volunteer={v}
            selected={selected.has(v.id)}
            onSelectChange={(on) => toggleSelect(v.id, on)}
          />
        ))}
      </div>

      {!volunteers.length && (
        <p className="py-12 text-center text-muted-foreground">
          No volunteers match your search.
        </p>
      )}
    </div>
  )
}
