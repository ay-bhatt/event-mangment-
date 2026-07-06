import { useEffect, useId, useState } from 'react'
import QRCode from 'react-qr-code'
import { ArrowLeft, ArrowRight, Download, Mail, Phone, Mail as MailIcon } from 'lucide-react'
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
  MEAL_KEYS,
  MAX_MEAL_PASSES,
  getMealRemaining,
  getMealUsed,
  getTotalMealsRemaining,
  getTotalMealsUsed,
  loadVolunteerStatus,
  subscribeVolunteerStatus,
  updateVolunteerStatus,
  type MealKey,
  type VolunteerStatus,
  type StatusKey,
} from '@/lib/status'
import type { Volunteer } from '@/lib/volunteers'
import { getInitials, cn } from '@/lib/utils'

type Props = {
  volunteer: Volunteer
  selected: boolean
  onSelectChange: (checked: boolean) => void
}

export function VolunteerCard({ volunteer, selected, onSelectChange }: Props) {
  const qrDomId = useId()
  const [status, setStatus] = useState<VolunteerStatus>(EMPTY_STATUS)
  const [sending, setSending] = useState(false)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadVolunteerStatus(volunteer.id).then((s) => {
      if (!cancelled) setStatus(s)
    })
    const unsub = subscribeVolunteerStatus(volunteer.id, setStatus)
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [volunteer.id])

  const saveStatus = async (next: VolunteerStatus) => {
    const nextWithTimestamp = { ...next, updatedAt: new Date().toISOString() }
    setStatus(nextWithTimestamp)
    try {
      await updateVolunteerStatus(volunteer.id, nextWithTimestamp)
    } catch {
      toast.error('Failed to save status')
      setStatus(status)
    }
  }

  const setStatusField = async (
    key: StatusKey,
    value: boolean | number,
  ) => {
    const next = { ...status, [key]: value }
    await saveStatus(next)
  }

  const toggleStatus = async (key: StatusKey, checked: boolean) => {
    const next = { ...status, [key]: checked }

    if (MEAL_KEYS.includes(key as MealKey) && checked) {
      const mealKey = key as MealKey
      const usedKey = `${mealKey}Used` as const
      next[usedKey] = Math.min(
        MAX_MEAL_PASSES,
        getMealUsed(status, mealKey) + 1,
      )
    }

    await saveStatus(next)
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
      await sendVolunteerPassEmail(volunteer)
      toast.success(`Pass sent to ${volunteer.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email failed')
    } finally {
      setSending(false)
    }
  }

  const mealStats = MEAL_KEYS.map((meal) => {
    const used = getMealUsed(status, meal)
    return {
      meal,
      label: meal[0].toUpperCase() + meal.slice(1),
      used,
      remaining: getMealRemaining(status, meal),
      percent: Math.round((used / MAX_MEAL_PASSES) * 100),
    }
  })

  const updatedAtText = status.updatedAt
    ? new Date(status.updatedAt).toLocaleString()
    : 'Not updated yet'

  const cardTransformStyle = {
    transformStyle: 'preserve-3d' as const,
    transition: 'transform 0.5s ease',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }

  const faceStyle = {
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-primary/30',
      )}
    >
      <CardContent className="p-0">
        <div className="relative min-h-[720px]" style={{ perspective: '1200px' }}>
          <div
            className="relative h-full transition-transform duration-500"
            style={cardTransformStyle}
          >
            <div className="absolute inset-0" style={faceStyle}>
              <div className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(v) => onSelectChange(v === true)}
                    aria-label={`Select ${volunteer.name}`}
                    className="mt-1"
                  />
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{getInitials(volunteer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-tight">{volunteer.name}</h3>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {volunteer.id}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {volunteer.team} · {volunteer.role}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5 truncate">
                        <MailIcon className="h-3 w-3 shrink-0" />
                        {volunteer.email}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        {volunteer.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  id={qrDomId}
                  className="mx-auto flex w-fit flex-col items-center rounded-lg border bg-white p-3"
                >
                  <QRCode
                    value={getQrPayload(volunteer.id)}
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
                    onClick={() => downloadQrPng(volunteer)}
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

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setFlipped(true)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    View Statistics
                  </Button>
                </div>

                <div className="grid gap-3 border-t pt-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${volunteer.id}-attendanceDays`} className="text-xs font-medium">
                      Attendance days
                    </Label>
                    <select
                      id={`${volunteer.id}-attendanceDays`}
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
                          id={`${volunteer.id}-${key}`}
                          checked={status[key] as boolean}
                          onCheckedChange={(v) => toggleStatus(key, v === true)}
                        />
                        <Label
                          htmlFor={`${volunteer.id}-${key}`}
                          className="cursor-pointer text-xs font-normal"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0"
              style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
            >
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Participant Meal Statistics</h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time meal usage for this participant.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setFlipped(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>

                <div className="grid gap-3">
                  {mealStats.map((item) => (
                    <div key={item.meal} className="rounded-2xl border border-input bg-card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{item.label}</p>
                        <span className="text-sm text-muted-foreground">
                          {item.remaining} remaining
                        </span>
                      </div>
                      <p className="mt-2 text-sm">
                        {item.label} Passes Used: {item.used} / {MAX_MEAL_PASSES}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-input bg-card p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Total Meals Used
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{getTotalMealsUsed(status)}</p>
                  </div>
                  <div className="rounded-2xl border border-input bg-card p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Total Meals Remaining
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{getTotalMealsRemaining(status)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-input bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-2 text-sm">{updatedAtText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
