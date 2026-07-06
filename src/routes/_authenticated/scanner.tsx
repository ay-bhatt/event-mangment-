import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { loadSettings } from '@/lib/settings'
import {
  normalizeVolunteerId,
  parseScannedQrValue,
} from '@/lib/volunteers'
import { apiCheckIn, apiValidateScan } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/scanner')({
  component: ScannerPage,
})

function ScannerPage() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const stopPromiseRef = useRef<Promise<void> | null>(null)
  const isMountedRef = useRef(true)
  const lastScannedRef = useRef('')
  const readerId = 'qr-reader'
  const settings = loadSettings()
  const prefix = settings.qrPrefix || 'JATRA-VOL'

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
        /* ignore stop errors from interrupted sessions */
      }
      try {
        scanner.clear()
      } catch {
        /* ignore clear errors when node is already detached */
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
      const id = parseScannedQrValue(decoded)
      if (!id || id === lastScannedRef.current) return
      lastScannedRef.current = id
      await stopCamera()
      try {
        await apiValidateScan(id, 'entry', decoded)
        await apiCheckIn(id)
      } catch {
        // Continue to detail page even if API unavailable
      }
      navigate({ to: '/check/$id', params: { id } })
    },
    [navigate, stopCamera],
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

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault()
    const id = normalizeVolunteerId(manualId)
    if (!id) {
      toast.error('Enter a valid volunteer ID')
      return
    }
    void stopCamera()
    navigate({ to: '/check/$id', params: { id } })
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      void stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Scan a pass or enter an ID to open volunteer details.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Camera</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-6">
          <div
            id={readerId}
            className={
              scanning
                ? 'min-h-[280px] overflow-hidden rounded-lg border bg-black/5'
                : 'min-h-[280px] overflow-hidden rounded-lg border border-dashed border-muted bg-muted/10'
            }
          />
          {!scanning && (
            <p className="text-sm text-muted-foreground">
              Start the camera to scan a volunteer QR. You will be taken to
              their detail page automatically.
            </p>
          )}
          <Button
            className="gap-2"
            onClick={scanning ? () => void stopCamera() : startCamera}
          >
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Manual lookup</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handleManualLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualId">Pass ID</Label>
              <Input
                id="manualId"
                placeholder={`e.g. ${prefix}-001 or ${prefix}-ADV-001`}
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter full pass ID (for example {prefix}-001 or JATRA-ADV-001).
              </p>
            </div>
            <Button type="submit" className="w-full gap-2 sm:w-auto">
              <Search className="h-4 w-4" />
              Look up pass
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
