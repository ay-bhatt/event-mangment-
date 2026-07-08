import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getVolunteers, searchVolunteers, type Volunteer } from '@/lib/volunteers'
import { getQrPayload, downloadQrPng } from '@/lib/qr-utils'

export function ParticipantQR() {
  const all = useMemo(() => getVolunteers(), [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Volunteer[]>(all.slice(0, 8))
  const [selected, setSelected] = useState<Volunteer | null>(all[0] ?? null)

  useEffect(() => {
    const r = query.trim() ? searchVolunteers(query).slice(0, 12) : all.slice(0, 12)
    setResults(r)
    if (r.length > 0 && !r.includes(selected as Volunteer)) {
      setSelected(r[0])
    }
  }, [query, all])

  const currentValue = selected ? getQrPayload(selected.id) : ''

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">Participant QR</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search participants by name, id, team..."
              />
            </div>

            <div className="mt-3 max-h-40 overflow-auto">
              {results.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`w-full text-left rounded-md px-2 py-1 text-sm hover:bg-muted ${
                    selected?.id === v.id ? 'bg-muted/40 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{v.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{v.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex w-48 flex-col items-center justify-center gap-3">
            <div className="rounded bg-white p-2">
              {currentValue ? (
                <QRCode value={currentValue} size={120} level="M" />
              ) : (
                <div className="h-[120px] w-[120px]" />
              )}
            </div>
            <div className="w-full">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => selected && downloadQrPng(selected)}
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ParticipantQR
