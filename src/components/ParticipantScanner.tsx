import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { findVolunteerById, parseScannedQrValue } from '@/lib/volunteers'
import { apiCheckIn, apiValidateScan, apiCheckOut } from '@/lib/api'
import { updateVolunteerStatus, loadLocalStatus } from '@/lib/status'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

type Props = {
  mode: 'entry' | 'exit'
}

export function ParticipantScanner({ mode }: Props) {
  const readerId = `participant-scanner-${mode}`
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<{ message: string; participantId?: string; participantName?: string } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stopPromiseRef = useRef<Promise<void> | null>(null)
  const isMountedRef = useRef(true)
  const lastScannedRef = useRef<string>('')

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
        if (scanner.isScanning) await scanner.stop()
      } catch {
        // ignore
      }
      try {
        scanner.clear()
      } catch {
        // ignore
      }
      if (isMountedRef.current) setScanning(false)
    })()

    stopPromiseRef.current = stopTask.finally(() => {
      stopPromiseRef.current = null
    })
    await stopPromiseRef.current
  }, [])

  const handleScan = useCallback(
    async (decoded: string) => {
      const parsed = parseScannedQrValue(decoded)
      if (!parsed) {
        setLastResult({ message: 'Invalid QR code' })
        return
      }
      if (lastScannedRef.current === parsed) {
        return
      }
      lastScannedRef.current = parsed
      setTimeout(() => {
        if (lastScannedRef.current === parsed) {
          lastScannedRef.current = ''
        }
      }, 5000)

      const volunteerId = parsed
      const volunteer = findVolunteerById(volunteerId)

      try {
        await apiValidateScan(volunteerId, mode, decoded)
      } catch {
        // ignore validation errors
      }

      try {
        if (mode === 'entry') {
          const res = await apiCheckIn(volunteerId)
          if (res?.status) await updateVolunteerStatus(volunteerId, res.status)
          setLastResult({ message: res?.message || 'Entry successful', participantId: volunteer?.id, participantName: volunteer?.name })
        } else {
          const res = await apiCheckOut(volunteerId)
          if (res?.status) await updateVolunteerStatus(volunteerId, res.status)
          setLastResult({ message: res?.message || 'Exit successful', participantId: volunteer?.id, participantName: volunteer?.name })
        }
      } catch {
        // Fallback: mark entryVerified locally so UI updates even if API unreachable
        try {
          const local = loadLocalStatus(volunteerId)
          const updated = { ...local, entryVerified: mode === 'entry' ? true : local.entryVerified }
          await updateVolunteerStatus(volunteerId, updated)
        } catch {
          // ignore
        }
        setLastResult({ message: `${mode === 'entry' ? 'Entry' : 'Exit'} recorded locally`, participantId: volunteer?.id, participantName: volunteer?.name })
      }
    },
    [mode],
  )

  const startCamera = async () => {
    try {
      await stopCamera()
      const readerEl = document.getElementById(readerId)
      if (!readerEl) {
        toast.error('Scanner not ready')
        return
      }
      const scanner = new Html5Qrcode(readerId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => void handleScan(text),
        () => undefined,
      )
      setScanning(true)
    } catch {
      await stopCamera()
      toast.error('Could not access camera. Check permissions.')
      setScanning(false)
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      void stopCamera()
    }
  }, [stopCamera])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{mode === 'entry' ? 'Entry' : 'Exit'} scanner</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Camera</p>
            <p className="text-xs text-muted-foreground">Start camera to scan participant QR for {mode}.</p>
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
              ? 'min-h-[220px] overflow-hidden rounded-lg border bg-black/5'
              : 'min-h-[220px] overflow-hidden rounded-lg border border-dashed border-muted bg-muted/10 text-center text-sm text-muted-foreground'
          }
        />

        <div>
          {lastResult ? (
            <div className="rounded-3xl border border-input bg-card p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold">{lastResult.message}</p>
                  <p className="text-sm text-muted-foreground">{lastResult.participantId}</p>
                </div>
              </div>
              {lastResult.participantName ? (
                <div className="mt-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(lastResult.participantName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{lastResult.participantName}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-input bg-card p-6 text-sm text-muted-foreground">Waiting for scan.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ParticipantScanner
