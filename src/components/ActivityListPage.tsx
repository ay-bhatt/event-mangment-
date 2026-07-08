import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Search, Upload, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ActivitySwitchTabs } from '@/components/ActivitySwitchTabs'
import { IntegrationBanner } from '@/components/IntegrationBanner'
import { ActivityCard } from '@/components/ActivityCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { generateBulkPdf } from '@/lib/qr-utils'
import {
  ActivityType,
  ActivityEntry,
  ActivityInput,
  addActivityEntry,
  getActivityEntries,
  getActivityPageSubtitle,
  importActivityEntries,
  searchActivityEntries,
} from '@/lib/activities'
import { loadSettings } from '@/lib/settings'
import { getStoredPageTitle, type PageTitleKey } from '@/lib/page-titles'
import { PageTitleEditor } from '@/components/PageTitleEditor'

type Props = {
  type: ActivityType
}

function normalizeActivityEntries(value: unknown): ActivityInput[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      return {
        name: String(record.name ?? '').trim(),
        email: String(record.email ?? '').trim(),
        phone: String(record.phone ?? '').trim(),
        team: String(record.team ?? '').trim(),
        role: String(record.role ?? '').trim(),
      }
    })
    .filter(
      (entry): entry is ActivityInput =>
        entry !== null &&
        entry.name.length > 0 &&
        entry.email.length > 0 &&
        entry.phone.length > 0 &&
        entry.team.length > 0 &&
        entry.role.length > 0,
    )
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
  const [jsonInput, setJsonInput] = useState('')
  const [fileUploadLoading, setFileUploadLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setQuery('')
    setSelected(new Set())
    setEntries(getActivityEntries(type))
  }, [type])

  const [pageTitle, setPageTitle] = useState(() => getStoredPageTitle(type))
  const subtitle = getActivityPageSubtitle(type)
  const settings = loadSettings()

  useEffect(() => {
    setPageTitle(getStoredPageTitle(type))
    const listener = () => setPageTitle(getStoredPageTitle(type))
    window.addEventListener('caumas-page-titles-updated', listener)
    return () => window.removeEventListener('caumas-page-titles-updated', listener)
  }, [type])

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

  const handleJsonImport = () => {
    if (!jsonInput.trim()) {
      toast.error('Paste JSON to import')
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonInput)
    } catch {
      toast.error('Invalid JSON')
      return
    }

    const entries = normalizeActivityEntries(parsed)
    if (!entries.length) {
      toast.error('No valid activity entries found')
      return
    }

    importActivityEntries(type, entries)
    setEntries(getActivityEntries(type))
    setJsonInput('')
    toast.success(`${entries.length} activity record(s) imported`) 
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileUploadLoading(true)
    try {
      const text = await file.text()
      const isJson = file.type.includes('json') || file.name.toLowerCase().endsWith('.json')
      const parsed = isJson ? JSON.parse(text) : null
      const entries = normalizeActivityEntries(parsed)

      if (!entries.length) {
        toast.error('No valid activity entries found in file')
        return
      }

      importActivityEntries(type, entries)
      setEntries(getActivityEntries(type))
      toast.success(`${entries.length} activity record(s) imported from file`)
    } catch {
      toast.error('Unable to parse file')
    } finally {
      setFileUploadLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddEntry = (e: FormEvent<HTMLFormElement>) => {
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" title="Click Rename or double-click the sidebar label to rename this page">
              {pageTitle}
            </h1>
            <PageTitleEditor pageKey={type as PageTitleKey} defaultTitle={pageTitle} />
          </div>
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

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Import activity data</h2>
              <p className="text-sm text-muted-foreground">Import activity entries from JSON text or a JSON file.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploadLoading}
            >
              <Upload className="h-4 w-4" />
              Import JSON file
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>

          <div className="mt-4 space-y-3 rounded-3xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4 text-primary" />
              JSON import text
            </div>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{{"name":"Jane Doe","email":"jane@example.com","phone":"1234567890","team":"Day Pass","role":"Participant"}}]'
              className="min-h-[150px]"
            />
            <Button variant="outline" onClick={handleJsonImport} className="w-full">
              Import JSON text
            </Button>
          </div>
        </div>
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
      
      {/* End of page content */}
    </div>
  )
}
