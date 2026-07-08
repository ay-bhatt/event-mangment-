import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  Mail,
  Phone,
  Search,
  User,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { SwitchTabs } from '@/components/SwitchTabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  findVolunteerById,
  normalizeVolunteerId,
  parseScannedQrValue,
} from '@/lib/volunteers'
import { apiCollectMeal } from '@/lib/api'
import {
  EMPTY_STATUS,
  STATUS_FIELDS,
  getAttendanceSummary,
  getFoodSummary,
  getMealRemaining,
  getMealUsed,
  getTotalMealsRemaining,
  getTotalMealsUsed,
  loadVolunteerStatus,
  subscribeVolunteerStatus,
  saveLocalStatus,
  updateVolunteerStatus,
  type MealKey,
  type VolunteerStatus,
  MAX_MEAL_PASSES,
  MEAL_KEYS,
} from '@/lib/status'
import { loadSettings } from '@/lib/settings'
import { getInitials, cn } from '@/lib/utils'
import type { Volunteer } from '@/lib/volunteers'

export const Route = createFileRoute('/_authenticated/meal-scanner')({
  component: MealScannerPage,
})

type ScanStatus = 'success' | 'warning' | 'error' | 'duplicate' | 'not-found'

type ScanHistoryItem = {
  id: string
  timestamp: string
  participantId: string
  participantName: string
  team: string
  meal: MealKey
  status: ScanStatus
  message: string
}

type ScanResult = {
  participant?: Volunteer
  status: ScanStatus
  message: string
  meal: MealKey
  timestamp: string
  updatedStatus?: VolunteerStatus
}

function getDisplayStatus(status: ScanStatus): 'success' | 'warning' | 'error' | 'duplicate' {
  return status === 'not-found' ? 'warning' : status
}

function getDisplayLabel(status: ScanStatus): string {
  if (status === 'not-found') return 'not found'
  if (status === 'duplicate') return 'duplicate'
  return status
}

const COOLDOWN_MS = 5000
const MAX_HISTORY = 20

function playSuccessTone() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.08
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      context.close().catch(() => undefined)
    }, 120)
  } catch {
    // ignore if audio is unavailable
  }
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

function MealScannerPage() {
  const settings = loadSettings()
  const [currentMeal, setCurrentMeal] = useState<MealKey>('breakfast')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [manualId, setManualId] = useState('')
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Volunteer | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<VolunteerStatus>(EMPTY_STATUS)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stopPromiseRef = useRef<Promise<void> | null>(null)
  const isMountedRef = useRef(true)
  const lastScanTimestamps = useRef<Record<string, number>>({})
  const lastScannedRef = useRef('')
  const readerId = 'meal-scanner-reader'

  const addHistoryItem = useCallback((item: ScanHistoryItem) => {
    setScanHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY))
  }, [])



  const stopCamera = useCallback(async () => {
    if (stopPromiseRef.current) {
      await stopPromiseRef.current
      return
    }

    const stopTask = (async () => {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (!scanner) {
        if (isMountedRef.current) setScanning(false)
        return
      }

      try {
        if (scanner.isScanning) {
          await scanner.stop()
        }
      } catch {
        // ignore stop errors from interrupted sessions
      }
      try {
        scanner.clear()
      } catch {
        // ignore clear errors when node is already detached
      }
      if (isMountedRef.current) setScanning(false)
    })()

    stopPromiseRef.current = stopTask.finally(() => {
      stopPromiseRef.current = null
    })
    await stopPromiseRef.current
  }, [])

  const handleScanResult = useCallback(
    async (decoded: string, fromManual = false) => {
      const normalized = fromManual
        ? normalizeVolunteerId(decoded)
        : normalizeVolunteerId(parseScannedQrValue(decoded) ?? '')
      const now = Date.now()

      if (!normalized) {
        const result: ScanResult = {
          status: 'error',
          message: 'Invalid QR code scanned.',
          meal: currentMeal,
          timestamp: new Date().toLocaleTimeString(),
        }
        setScanResult(result)
        addHistoryItem({
          id: `${Date.now()}-invalid`,
          timestamp: result.timestamp,
          participantId: 'Unknown',
          participantName: 'Unknown QR',
          team: '-',
          meal: currentMeal,
          status: 'not-found',
          message: result.message,
        })
        return
      }

      const cooldownKey = `${normalized}-${currentMeal}`
      if (lastScanTimestamps.current[cooldownKey] && now - lastScanTimestamps.current[cooldownKey] < COOLDOWN_MS) {
        const message = 'Duplicate scan ignored. Please wait a moment before scanning again.'
        const result: ScanResult = {
          status: 'duplicate',
          message,
          meal: currentMeal,
          timestamp: new Date().toLocaleTimeString(),
        }
        setScanResult(result)
        return
      }

      lastScanTimestamps.current[cooldownKey] = now
      const volunteer = findVolunteerById(normalized)
      if (!volunteer) {
        const message = 'Participant not found for scanned QR code.'
        const result: ScanResult = {
          status: 'not-found',
          message,
          meal: currentMeal,
          timestamp: new Date().toLocaleTimeString(),
        }
        setScanResult(result)
        addHistoryItem({
          id: `${Date.now()}-notfound`,
          timestamp: result.timestamp,
          participantId: normalized,
          participantName: 'Unknown',
          team: '-',
          meal: currentMeal,
          status: 'not-found',
          message,
        })
        return
      }

      try {
        const apiResult = await apiCollectMeal(volunteer.id, currentMeal)
        saveLocalStatus(volunteer.id, apiResult.status)

        if (apiResult.result === 'already_collected') {
          const message = 'Meal Already Collected'
          const result: ScanResult = {
            participant: volunteer,
            status: 'duplicate',
            message,
            meal: currentMeal,
            timestamp: new Date().toLocaleTimeString(),
            updatedStatus: apiResult.status,
          }
          setScanResult(result)
          addHistoryItem({
            id: `${Date.now()}-duplicate`,
            timestamp: result.timestamp,
            participantId: volunteer.id,
            participantName: volunteer.name,
            team: volunteer.team,
            meal: currentMeal,
            status: 'duplicate',
            message,
          })
          return
        }

        if (!apiResult.success) {
          const message = apiResult.message
          const result: ScanResult = {
            participant: volunteer,
            status: 'warning',
            message,
            meal: currentMeal,
            timestamp: new Date().toLocaleTimeString(),
            updatedStatus: apiResult.status,
          }
          setScanResult(result)
          addHistoryItem({
            id: `${Date.now()}-warning`,
            timestamp: result.timestamp,
            participantId: volunteer.id,
            participantName: volunteer.name,
            team: volunteer.team,
            meal: currentMeal,
            status: 'warning',
            message,
          })
          return
        }

        const message = apiResult.message
        const result: ScanResult = {
          participant: volunteer,
          status: 'success',
          message,
          meal: currentMeal,
          timestamp: new Date().toLocaleTimeString(),
          updatedStatus: apiResult.status,
        }
        setScanResult(result)
        addHistoryItem({
          id: `${Date.now()}-success`,
          timestamp: result.timestamp,
          participantId: volunteer.id,
          participantName: volunteer.name,
          team: volunteer.team,
          meal: currentMeal,
          status: 'success',
          message,
        })
        playSuccessTone()
        toast.success(message)
      } catch {
        const localStatus = await loadVolunteerStatus(volunteer.id)
        const remaining = getMealRemaining(localStatus, currentMeal)
        if (remaining <= 0) {
          const message = `No remaining ${currentMeal} passes for this participant.`
          setScanResult({
            participant: volunteer,
            status: 'warning',
            message,
            meal: currentMeal,
            timestamp: new Date().toLocaleTimeString(),
            updatedStatus: localStatus,
          })
          return
        }

        const updatedStatus = {
          ...localStatus,
          [`${currentMeal}Used`]: getMealUsed(localStatus, currentMeal) + 1,
        }

        await updateVolunteerStatus(volunteer.id, updatedStatus)

        const message = `${volunteer.name} recorded locally for ${currentMeal}. Sync when the server is available.`
        setScanResult({
          participant: volunteer,
          status: 'success',
          message,
          meal: currentMeal,
          timestamp: new Date().toLocaleTimeString(),
          updatedStatus,
        })
        addHistoryItem({
          id: `${Date.now()}-offline`,
          timestamp: new Date().toLocaleTimeString(),
          participantId: volunteer.id,
          participantName: volunteer.name,
          team: volunteer.team,
          meal: currentMeal,
          status: 'success',
          message,
        })
        toast.success(message)
      }
    },
    [currentMeal, addHistoryItem],
  )

  const startCamera = async () => {
    try {
      await stopCamera()
      lastScannedRef.current = ''
      const readerEl = document.getElementById(readerId)
      if (!readerEl) {
        toast.error('Scanner container not ready. Please refresh the page.')
        return
      }
      const scanner = new Html5Qrcode(readerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (text) => void handleScanResult(text),
        () => undefined,
      )
      setScanning(true)
    } catch {
      await stopCamera()
      toast.error('Could not access camera. Check permissions.')
      setScanning(false)
    }
  }

  const handleManualLookup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleScanResult(manualId, true)
  }

  const handleHistoryItemClick = async (item: ScanHistoryItem) => {
    setSelectedHistoryItemId(item.id)
    const volunteer = findVolunteerById(item.participantId)
    if (volunteer) {
      setSelectedParticipant(volunteer)
      const status = await loadVolunteerStatus(volunteer.id)
      setSelectedStatus(status)
      subscribeVolunteerStatus(volunteer.id, setSelectedStatus)
    }
  }

  const clearSelection = () => {
    setSelectedHistoryItemId(null)
    setSelectedParticipant(null)
    setSelectedStatus(EMPTY_STATUS)
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      void stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Meal Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Select the current meal and scan participant QR codes for instant meal pass deduction.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Meal selection & camera</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6 pt-6">
              <SwitchTabs
                items={MEAL_KEYS.map((meal) => ({
                  value: meal,
                  label: meal.charAt(0).toUpperCase() + meal.slice(1),
                }))}
                value={currentMeal}
                onChange={setCurrentMeal}
              />

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Camera feed</p>
                    <p className="text-xs text-muted-foreground">
                      Use the device camera to scan participant QR codes continuously.
                    </p>
                  </div>
                  <Button className="gap-2" onClick={scanning ? () => void stopCamera() : startCamera}>
                    {scanning ? (
                      <>
                        <CameraOff className="h-4 w-4" /> Stop Camera
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" /> Start Camera
                      </>
                    )}
                  </Button>
                </div>

                <div
                  id={readerId}
                  className={
                    scanning
                      ? 'min-h-[280px] overflow-hidden rounded-lg border bg-black/5'
                      : 'min-h-[280px] overflow-hidden rounded-lg border border-dashed border-muted bg-muted/10 text-center text-sm text-muted-foreground'
                  }
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Manual entry</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-6">
              <form onSubmit={handleManualLookup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manualMealId">Participant ID</Label>
                  <Input
                    id="manualMealId"
                    placeholder="Enter participant ID"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  <Search className="h-4 w-4" />
                  Record meal manually
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Scan history</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="space-y-3">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                      selectedHistoryItemId === item.id
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.participantName}</span>
                        <Badge variant="outline" className="capitalize">{item.meal}</Badge>
                        <span className={cn(
                          'text-xs font-medium',
                          item.status === 'success' || item.status === 'not-found'
                            ? 'text-emerald-600'
                            : item.status === 'warning'
                              ? 'text-amber-700'
                              : 'text-rose-600'
                        )}>
                          {getDisplayLabel(item.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.participantId} · {item.team} · {item.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                {!scanHistory.length && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No scan history yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedParticipant ? (
            <Card className="sticky top-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Participant details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-6 pt-6">
                <Card
                  className={cn(
                    'overflow-hidden border-2',
                    'border-success/50 shadow-md',
                  )}
                >
                  <div
                    className={cn(
                      'px-6 py-4 text-center',
                      'bg-success/10',
                    )}
                  >
                    <Badge
                      className={cn(
                        'px-4 py-1.5 text-sm font-bold',
                        'bg-success text-success-foreground hover:bg-success',
                      )}
                    >
                      VALID PASS
                    </Badge>
                    <p className="mt-2 font-mono text-lg font-semibold">{selectedParticipant.id}</p>
                    <p className="text-xs text-muted-foreground">{settings.eventName}</p>
                  </div>

                  <CardContent className="space-y-6 p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {getInitials(selectedParticipant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold">{selectedParticipant.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedParticipant.team} · {selectedParticipant.role}
                        </p>
                      </div>
                    </div>

                    <dl className="grid gap-4">
                      <DetailItem
                        icon={<User className="h-4 w-4" />}
                        label="Volunteer ID"
                        value={selectedParticipant.id}
                      />
                      <DetailItem
                        icon={<Users className="h-4 w-4" />}
                        label="Team / Role"
                        value={`${selectedParticipant.team} · ${selectedParticipant.role}`}
                      />
                      <DetailItem
                        icon={<Mail className="h-4 w-4" />}
                        label="Email"
                        value={selectedParticipant.email}
                      />
                      <DetailItem
                        icon={<Phone className="h-4 w-4" />}
                        label="Phone"
                        value={selectedParticipant.phone}
                      />
                      <DetailItem
                        label="Attendance"
                        value={getAttendanceSummary(selectedStatus)}
                      />
                      <DetailItem
                        label="Food"
                        value={getFoodSummary(selectedStatus)}
                      />
                      <DetailItem
                        label="Entry"
                        value={selectedStatus.entryVerified ? 'Verified' : 'Pending'}
                      />
                    </dl>

                    <div className="grid gap-3">
                      {MEAL_KEYS.map((meal) => (
                        <div key={meal} className="rounded-2xl border border-input bg-card p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium capitalize">{meal}</p>
                            <p className="text-sm text-muted-foreground">
                              {getMealRemaining(selectedStatus, meal)} remaining
                            </p>
                          </div>
                          <p className="mt-2 text-sm">
                            Used: {getMealUsed(selectedStatus, meal)} / {MAX_MEAL_PASSES}
                          </p>
                        </div>
                      ))}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-input bg-card p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Used</p>
                          <p className="mt-2 text-2xl font-semibold">{getTotalMealsUsed(selectedStatus)}</p>
                        </div>
                        <div className="rounded-2xl border border-input bg-card p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Remaining</p>
                          <p className="mt-2 text-2xl font-semibold">{getTotalMealsRemaining(selectedStatus)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="mb-3 text-sm font-medium">Status checklist</p>
                      <div className="grid grid-cols-2 gap-2">
                        {STATUS_FIELDS.map(({ key, label }) => (
                          <div
                            key={key}
                            className={cn(
                              'rounded-md px-2 py-1.5 text-xs',
                              selectedStatus[key]
                                ? 'bg-success/15 text-success'
                                : 'text-muted-foreground',
                            )}
                          >
                            {selectedStatus[key] ? '✓' : '○'} {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Latest scan result</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                {scanResult ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-input bg-card p-4">
                      <div className="flex items-center gap-3">
                        {getDisplayStatus(scanResult.status) === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : getDisplayStatus(scanResult.status) === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-rose-600" />
                        )}
                        <div>
                          <p className="font-semibold capitalize">{getDisplayLabel(scanResult.status)}</p>
                          <p className="text-sm text-muted-foreground">{scanResult.message}</p>
                        </div>
                      </div>
                    </div>

                    {scanResult.participant ? (
                      <div className="rounded-3xl border border-input bg-card p-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Participant</p>
                            <p className="mt-2 font-semibold">{scanResult.participant.name}</p>
                            <p className="text-xs text-muted-foreground">{scanResult.participant.id}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</p>
                            <p className="mt-2 font-semibold">{scanResult.participant.team}</p>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <div className="grid gap-2 rounded-2xl border border-input bg-muted p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meal scanned</p>
                            <p className="text-lg font-semibold capitalize">{scanResult.meal}</p>
                          </div>
                          {scanResult.updatedStatus ? (() => {
                            const updatedStatus = scanResult.updatedStatus
                            return (
                              <div className="grid gap-3">
                                {MEAL_KEYS.map((meal) => (
                                  <div key={meal} className="rounded-2xl border border-input bg-card p-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium capitalize">{meal}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {getMealRemaining(updatedStatus, meal)} remaining
                                      </p>
                                    </div>
                                    <p className="mt-2 text-sm">
                                      Used: {getMealUsed(updatedStatus, meal)} / {MAX_MEAL_PASSES}
                                    </p>
                                  </div>
                                ))}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl border border-input bg-card p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Used</p>
                                    <p className="mt-2 text-2xl font-semibold">{getTotalMealsUsed(updatedStatus)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-input bg-card p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Remaining</p>
                                    <p className="mt-2 text-2xl font-semibold">{getTotalMealsRemaining(updatedStatus)}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })() : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-input bg-card p-6 text-sm text-muted-foreground">
                        Scan a participant QR code to see their updated meal statistics.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-input bg-card p-6 text-sm text-muted-foreground">
                    Waiting for first scan.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
