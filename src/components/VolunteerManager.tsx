import { FormEvent, useMemo, useState, useRef } from 'react'
import { Download, Upload, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VolunteerCard } from '@/components/VolunteerCard'
import { loadSettings } from '@/lib/settings'
import { getVolunteers, searchVolunteers, type Volunteer, type VolunteerInput } from '@/lib/volunteers'
import { persistVolunteerInputs, loadVolunteerInputs, loadVolunteerRegistry } from '@/lib/volunteer-storage'
import { assignStableIds } from '@/lib/id-registry'

const REQUIRED_FIELDS: Array<keyof VolunteerInput> = [
  'name',
  'email',
  'phone',
  'team',
  'role',
]

function parseCsv(text: string): VolunteerInput[] {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split(','))

  if (rows.length === 0) return []

  const headers = rows[0].map((value) => value.trim().toLowerCase())
  const entries: VolunteerInput[] = []

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (row.length < headers.length) continue
    const entry = headers.reduce((result, header, index) => {
      if (header === 'name' || header === 'email' || header === 'phone' || header === 'team' || header === 'role') {
        result[header] = row[index].trim()
      }
      return result
    }, {} as VolunteerInput)
    if (REQUIRED_FIELDS.every((field) => entry[field]?.length)) {
      entries.push(entry)
    }
  }

  return entries
}

function normalizeJsonEntries(value: unknown): VolunteerInput[] {
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
    .filter((entry): entry is VolunteerInput =>
      REQUIRED_FIELDS.every((field) => entry[field]?.length),
    )
}

export function VolunteerManager() {
  const [query, setQuery] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [manualInput, setManualInput] = useState({
    name: '',
    email: '',
    phone: '',
    team: '',
    role: '',
  } as VolunteerInput)
  const [volunteers, setVolunteers] = useState<Volunteer[]>(getVolunteers())
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(
    () => (query ? searchVolunteers(query) : volunteers),
    [query, volunteers],
  )

  const refreshVolunteers = () => {
    const stored = getVolunteers()
    setVolunteers(stored)
  }

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!REQUIRED_FIELDS.every((field) => manualInput[field]?.length)) {
      toast.error('Please fill all fields')
      return
    }

    const savedInputs = loadVolunteerInputs()
    const nextInputs = [...savedInputs, manualInput]
    persistVolunteerInputs(nextInputs)

    toast.success('Participant added successfully')
    setManualInput({ name: '', email: '', phone: '', team: '', role: '' })
    refreshVolunteers()
  }

  const handleJsonImport = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonInput)
    } catch {
      toast.error('Invalid JSON')
      return
    }

    const entries = normalizeJsonEntries(parsed)
    if (!entries.length) {
      toast.error('No valid participant records found')
      return
    }

    const savedInputs = loadVolunteerInputs()
    const nextInputs = [...savedInputs, ...entries]
    persistVolunteerInputs(nextInputs)

    toast.success(`${entries.length} participant(s) imported from JSON`)
    setJsonInput('')
    refreshVolunteers()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const isJson = file.type.includes('json') || file.name.toLowerCase().endsWith('.json')
    let data: unknown

    try {
      data = isJson ? JSON.parse(text) : parseCsv(text)
    } catch {
      toast.error('Unable to parse file')
      return
    }

    const entries = normalizeJsonEntries(data)

    if (!entries.length) {
      toast.error('No valid participant records found in file')
      return
    }

    const savedInputs = loadVolunteerInputs()
    const nextInputs = [...savedInputs, ...entries]
    persistVolunteerInputs(nextInputs)

    toast.success(`${entries.length} participant(s) imported from file`)
    refreshVolunteers()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div id="manage-participants" className="space-y-6">
      <div className="space-y-6">
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Manage Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participant-search">Search participants</Label>
              <Input
                id="participant-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email, phone, team, role"
              />
            </div>

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import JSON / CSV file
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.csv,application/json,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-3 rounded-3xl border border-border/60 bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4 text-primary" />
                Add participant manually
              </div>
              <form onSubmit={handleManualSubmit} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="manual-name">Name</Label>
                    <Input
                      id="manual-name"
                      value={manualInput.name}
                      onChange={(e) => setManualInput({ ...manualInput, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="manual-email">Email</Label>
                    <Input
                      id="manual-email"
                      type="email"
                      value={manualInput.email}
                      onChange={(e) => setManualInput({ ...manualInput, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="manual-phone">Phone</Label>
                    <Input
                      id="manual-phone"
                      value={manualInput.phone}
                      onChange={(e) => setManualInput({ ...manualInput, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="manual-team">Team</Label>
                    <Input
                      id="manual-team"
                      value={manualInput.team}
                      onChange={(e) => setManualInput({ ...manualInput, team: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-role">Role</Label>
                  <Input
                    id="manual-role"
                    value={manualInput.role}
                    onChange={(e) => setManualInput({ ...manualInput, role: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add participant
                </Button>
              </form>
            </div>

            <div className="space-y-2 rounded-3xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
              <p className="font-semibold">JSON import format</p>
              <p>Use an array of objects with keys: name, email, phone, team, role.</p>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{{"name":"Jane Doe","email":"jane@example.com","phone":"1234567890","team":"Volunteers","role":"Volunteer"}}]'
                className="min-h-[180px]"
              />
              <Button variant="outline" onClick={handleJsonImport} className="w-full">
                Import JSON text
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
