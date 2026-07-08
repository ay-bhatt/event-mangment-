import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { ArrowRight, Download, Mail, Search, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getVolunteers, searchVolunteers, type Volunteer } from '@/lib/volunteers'
import { getQrPayload, downloadQrPng } from '@/lib/qr-utils'
import { loadLocalStatus, subscribeVolunteerStatus, type VolunteerStatus } from '@/lib/status'

export function CustomFolder() {
  const allVolunteers = useMemo(() => getVolunteers(), [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Volunteer[]>(allVolunteers.slice(0, 8))
  const [selected, setSelected] = useState<Volunteer | null>(allVolunteers[0] ?? null)

  const selectedVolunteer = selected ?? allVolunteers[0] ?? null
  const [status, setStatus] = useState<VolunteerStatus>(() =>
    loadLocalStatus(selectedVolunteer?.id ?? allVolunteers[0]?.id ?? ''),
  )
  const qrValue = selectedVolunteer ? getQrPayload(selectedVolunteer.id) : ''

  useEffect(() => {
    const found = query.trim() ? searchVolunteers(query).slice(0, 12) : allVolunteers.slice(0, 12)
    setResults(found)
    if (found.length > 0 && !found.some((item) => item.id === selected?.id)) {
      setSelected(found[0])
    }
  }, [query, allVolunteers, selected?.id])

  useEffect(() => {
    if (!selectedVolunteer) return
    setStatus(loadLocalStatus(selectedVolunteer.id))
    const unsubscribe = subscribeVolunteerStatus(selectedVolunteer.id, setStatus)
    return () => unsubscribe?.()
  }, [selectedVolunteer?.id])

  return (
    <Card className="rounded-3xl border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          Custom Folder
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search participants"
              />
            </div>

            <div className="grid gap-3 grid-cols-2 rounded-3xl border border-border/60 bg-background p-3 shadow-sm">
              {results.map((volunteer) => (
                <button
                  key={volunteer.id}
                  type="button"
                  onClick={() => setSelected(volunteer)}
                  className={`rounded-2xl px-3 py-3 text-left transition-all border-2 hover:shadow-md ${
                    volunteer.id === selectedVolunteer?.id ? 'bg-primary/10 border-primary font-semibold' : 'border-border/40 hover:border-primary/50'
                  }`}
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold line-clamp-2">{volunteer.name}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{volunteer.team}</p>
                      <p className="font-mono text-xs text-muted-foreground">{volunteer.id}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {selectedVolunteer?.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{selectedVolunteer?.name ?? 'Participant Name'}</p>
                    <p className="text-sm text-muted-foreground">Volunteers · Volunteer</p>
                  </div>
                </div>
                <div className="rounded-full border border-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {selectedVolunteer?.id ?? 'N/A'}
                </div>
              </div>

              <div className="my-6 flex justify-center">
                <div className="rounded-[2rem] bg-white p-4 shadow-sm">
                  {qrValue ? (
                    <QRCode value={qrValue} size={180} level="M" />
                  ) : (
                    <div className="h-[180px] w-[180px]" />
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => selectedVolunteer && downloadQrPng(selectedVolunteer)}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
                <Button
                  className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => selectedVolunteer && window.open(`mailto:${selectedVolunteer.email}`)}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>

              <Button variant="outline" className="mt-4 w-full gap-2 justify-center">
                <ArrowRight className="h-4 w-4" />
                View Statistics
              </Button>

              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium">Attendance days</div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                  {(status?.attendanceDays ?? 0)} / 5 days
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Breakfast', active: status?.breakfast },
                  { label: 'Lunch', active: status?.lunch },
                  { label: 'Dinner', active: status?.dinner },
                  { label: 'Kit Received', active: status?.kitReceived },
                  { label: 'Certificate Received', active: status?.certificateReceived },
                  { label: 'Entry Verified', active: status?.entryVerified },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 ${
                      active ? 'border-emerald-500 bg-emerald-50' : 'border-muted/60 bg-white'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full ${
                        active ? 'bg-emerald-500 text-white flex items-center justify-center' : 'border border-primary/40 bg-transparent'
                      }`}
                    >
                      {active ? '✓' : ''}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomFolder
