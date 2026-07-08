import { useEffect, useMemo, useState } from 'react'
import { Download, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ActivitySwitchTabs } from '@/components/ActivitySwitchTabs'
import { IntegrationBanner } from '@/components/IntegrationBanner'
import { ActivityCard } from '@/components/ActivityCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateBulkPdf } from '@/lib/qr-utils'
import {
  ActivityType,
  ActivityEntry,
  ActivityInput,
  addActivityEntry,
  getActivityEntries,
  getActivityPageSubtitle,
  getActivityPageTitle,
  searchActivityEntries,
} from '@/lib/activities'
import { loadSettings } from '@/lib/settings'

type Props = {
  type: ActivityType
}

export function ActivityListPage({ type }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<ActivityEntry[]>(() => getActivityEntries(type))
  const [newEntry, setNewEntry] = useState<ActivityInput>({
    name: '',
    email: '',
    phone: '',
    team: '',
    role: '',
  })
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    setQuery('')
    setSelected(new Set())
    setEntries(getActivityEntries(type))
  }, [type])

  const title = getActivityPageTitle(type)
  const subtitle = getActivityPageSubtitle(type)
  const settings = loadSettings()

  const visibleEntries = useMemo(
    () => (query ? searchActivityEntries(type, query) : entries),
    [query, entries, type],
  )

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(visibleEntries.map((item) => item.id)))
  const clearSelection = () => setSelected(new Set())

  const bulkPdf = async () => {
    const picked = entries.filter((item) => selected.has(item.id))
    if (!picked.length) {
      toast.error('Select at least one item')
      return
    }
    setPdfLoading(true)
    try {
      await generateBulkPdf(picked, settings.eventName)
      toast.success(`PDF with ${picked.length} pass(es) downloaded`)
    } catch {
      toast.error('PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.name.trim() || !newEntry.email.trim() || !newEntry.phone.trim()) {
      toast.error('Name, email, and phone are required')
      return
    }
    const next = addActivityEntry(type, newEntry)
    setEntries(next)
    setNewEntry({ name: '', email: '', phone: '', team: '', role: '' })
    toast.success('New entry added')
  }

  return (
    <div className="mx-auto max-w-7xl">
      <ActivitySwitchTabs className="mb-6" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <p className="text-sm text-muted-foreground">{entries.length} total · {selected.size} selected</p>
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
        {visibleEntries.map((entry) => (
          <ActivityCard
            key={entry.id}
            entry={entry}
            selected={selected.has(entry.id)}
            onSelectChange={(on) => toggleSelect(entry.id, on)}
          />
        ))}
      </div>

      {!visibleEntries.length && (
        <p className="py-12 text-center text-muted-foreground">
          No entries match your search.
        </p>
      )}

      <div className="mt-10 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Add new entry</h2>
            <p className="text-sm text-muted-foreground">Create a new QR pass entry for this section.</p>
          </div>
        </div>

        <form onSubmit={handleAddEntry} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                value={newEntry.email}
                onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-phone">Phone</Label>
              <Input
                id="new-phone"
                value={newEntry.phone}
                onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="new-team">Team / Track</Label>
              <Input
                id="new-team"
                value={newEntry.team}
                onChange={(e) => setNewEntry({ ...newEntry, team: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new-role">Role / Session</Label>
              <Input
                id="new-role"
                value={newEntry.role}
                onChange={(e) => setNewEntry({ ...newEntry, role: e.target.value })}
              />
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" className="w-full sm:w-auto">
                Add entry
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
