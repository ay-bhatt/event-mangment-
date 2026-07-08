import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { Download, Search, MapPin, Info, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getVolunteers, searchVolunteers, type Volunteer } from '@/lib/volunteers'
import { getQrPayload, downloadQrPng } from '@/lib/qr-utils'

const GOVT_ID_TYPES = ['Aadhar', 'Passport', 'Voter ID', 'Driving Licence'] as const

export function CustomFolder() {
  const allVolunteers = useMemo(() => getVolunteers(), [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Volunteer[]>(allVolunteers.slice(0, 8))
  const [selected, setSelected] = useState<Volunteer | null>(allVolunteers[0] ?? null)

  useEffect(() => {
    const found = query.trim() ? searchVolunteers(query).slice(0, 12) : allVolunteers.slice(0, 12)
    setResults(found)
    if (found.length > 0 && !found.some((item) => item.id === selected?.id)) {
      setSelected(found[0])
    }
  }, [query, allVolunteers, selected?.id])

  const selectedVolunteer = selected ?? allVolunteers[0] ?? null
  const qrValue = selectedVolunteer ? getQrPayload(selectedVolunteer.id) : ''
  const govtIdType = GOVT_ID_TYPES[selectedVolunteer ? selectedVolunteer.id.length % GOVT_ID_TYPES.length : 0]
  const govtIdNo = selectedVolunteer ? `${selectedVolunteer.id}-${selectedVolunteer.phone.slice(-4)}` : 'N/A'
  const address = selectedVolunteer ? `${selectedVolunteer.team} Camp, Event Grounds` : 'N/A'

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

            <div className="grid gap-2 rounded-3xl border border-border/60 bg-background p-3 shadow-sm">
              {results.map((volunteer) => (
                <button
                  key={volunteer.id}
                  type="button"
                  onClick={() => setSelected(volunteer)}
                  className={`w-full rounded-2xl px-3 py-2 text-left transition-colors hover:bg-muted/30 ${
                    volunteer.id === selectedVolunteer?.id ? 'bg-primary/10 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{volunteer.name}</p>
                      <p className="text-xs text-muted-foreground">{volunteer.team}</p>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{volunteer.id}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border/60 bg-background p-4 shadow-sm">
              <div className="mx-auto mb-4 w-fit rounded-3xl bg-white p-3">
                {qrValue ? (
                  <QRCode value={qrValue} size={160} level="M" />
                ) : (
                  <div className="h-[160px] w-[160px]" />
                )}
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => selectedVolunteer && downloadQrPng(selectedVolunteer)}
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>

            <div className="grid gap-3 rounded-3xl border border-border/60 bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4 text-primary" />
                Participant details
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Name</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2 text-sm">{selectedVolunteer?.name ?? 'N/A'}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Participant ID</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2 font-mono">{selectedVolunteer?.id ?? 'N/A'}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Team Name</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2">{selectedVolunteer?.team ?? 'N/A'}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Contact No.</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2">{selectedVolunteer?.phone ?? 'N/A'}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Info</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2">{selectedVolunteer?.role ?? 'N/A'}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Address</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2 flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {address}
                  </div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Govt ID</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2">{govtIdType}</div>
                </div>
                <div className="grid gap-1 text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">ID No.</div>
                  <div className="rounded-2xl bg-muted/10 px-3 py-2">{govtIdNo}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomFolder
