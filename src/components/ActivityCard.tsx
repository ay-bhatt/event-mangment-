import { useEffect, useId, useState } from 'react'
import QRCode from 'react-qr-code'
import { Download, Mail, Phone, Mail as MailIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { sendVolunteerPassEmail, isEmailJsConfigured } from '@/lib/emailService'
import { downloadQrPng, getQrPayload } from '@/lib/qr-utils'
import {
  STATUS_FIELDS,
  EMPTY_STATUS,
  loadVolunteerStatus,
  subscribeVolunteerStatus,
  updateVolunteerStatus,
  type VolunteerStatus,
  type StatusKey,
} from '@/lib/status'
import type { ActivityEntry } from '@/lib/activities'
import { getInitials, cn } from '@/lib/utils'

type Props = {
  entry: ActivityEntry
  selected: boolean
  onSelectChange: (checked: boolean) => void
}

export function ActivityCard({ entry, selected, onSelectChange }: Props) {
  const qrDomId = useId()
  const [status, setStatus] = useState<VolunteerStatus>(EMPTY_STATUS)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadVolunteerStatus(entry.id).then((s) => {
      if (!cancelled) setStatus(s)
    })
    const unsub = subscribeVolunteerStatus(entry.id, setStatus)
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [entry.id])

  const setStatusField = async (
    key: StatusKey,
    value: boolean | number,
  ) => {
    const next = { ...status, [key]: value }
    setStatus(next)
    try {
      await updateVolunteerStatus(entry.id, next)
    } catch {
      toast.error('Failed to save status')
      setStatus(status)
    }
  }

  const toggleStatus = async (key: StatusKey, checked: boolean) => {
    await setStatusField(key, checked)
  }

  const setAttendanceDays = async (value: number) => {
    await setStatusField('attendanceDays', value)
  }

  const handleEmail = async () => {
    if (!isEmailJsConfigured()) {
      toast.error('Configure EmailJS in Settings (see SETUP.md)')
      return
    }
    setSending(true)
    try {
      await sendVolunteerPassEmail(entry)
      toast.success(`Pass sent to ${entry.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-primary/30',
      )}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectChange(v === true)}
            aria-label={`Select ${entry.name}`}
            className="mt-1"
          />
          <Avatar className="h-11 w-11">
            <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight">{entry.name}</h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {entry.id}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {entry.team} · {entry.role}
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 truncate">
                <MailIcon className="h-3 w-3 shrink-0" />
                {entry.email}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                {entry.phone}
              </p>
            </div>
          </div>
        </div>

        <div
          id={qrDomId}
          className="mx-auto flex w-fit flex-col items-center rounded-lg border bg-white p-3"
        >
          <QRCode
            value={getQrPayload(entry.id)}
            size={128}
            level="M"
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => downloadQrPng(entry)}
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={sending}
            onClick={handleEmail}
          >
            <Mail className="h-3.5 w-3.5" />
            {sending ? 'Sending…' : 'Email'}
          </Button>
        </div>

        <div className="grid gap-3 border-t pt-3">
          <div className="space-y-2">
            <Label htmlFor={`${entry.id}-attendanceDays`} className="text-xs font-medium">
              Attendance days
            </Label>
            <select
              id={`${entry.id}-attendanceDays`}
              value={Number(status.attendanceDays || 0)}
              onChange={(e) => setAttendanceDays(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value={0}>0 / 5 days</option>
              <option value={1}>1 / 5 days</option>
              <option value={2}>2 / 5 days</option>
              <option value={3}>3 / 5 days</option>
              <option value={4}>4 / 5 days</option>
              <option value={5}>5 / 5 days</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STATUS_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`${entry.id}-${key}`}
                  checked={status[key] as boolean}
                  onCheckedChange={(v) => toggleStatus(key, v === true)}
                />
                <Label
                  htmlFor={`${entry.id}-${key}`}
                  className="cursor-pointer text-xs font-normal"
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
