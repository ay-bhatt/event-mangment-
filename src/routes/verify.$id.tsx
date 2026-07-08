import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CaumasLogoMark } from '@/components/CaumasBrand'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND } from '@/lib/brand'
import { findVolunteerById } from '@/lib/volunteers'
import {
  loadVolunteerStatus,
  EMPTY_STATUS,
  type VolunteerStatus,
} from '@/lib/status'
import { loadSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/verify/$id')({
  component: VerifyPage,
})

function VerifyPage() {
  const { id } = Route.useParams()
  const volunteer = findVolunteerById(id)
  const valid = Boolean(volunteer)
  const settings = loadSettings()
  const [status, setStatus] = useState<VolunteerStatus>(EMPTY_STATUS)

  useEffect(() => {
    if (volunteer) {
      loadVolunteerStatus(volunteer.id).then(setStatus)
    }
  }, [volunteer?.id])

  return (
    <div className="caumas-verify-bg flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <CaumasLogoMark className="mx-auto h-16 w-16" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {BRAND.name}
            </p>
            <p className="mt-1 text-sm font-medium">{settings.eventName}</p>
          </div>

          <Badge
            className={cn(
              'mx-auto px-4 py-2 text-base font-bold',
              valid
                ? 'bg-success text-success-foreground hover:bg-success'
                : 'bg-danger text-danger-foreground hover:bg-danger',
            )}
          >
            {valid ? 'VALID PASS' : 'INVALID PASS'}
          </Badge>

          <p className="font-mono text-lg font-semibold">{id}</p>

          {volunteer ? (
            <dl className="space-y-3 text-left text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{volunteer.name}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Team</dt>
                <dd className="font-medium">{volunteer.team}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium">{volunteer.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry</dt>
                <dd className="font-medium">
                  {status.entryVerified ? 'Verified' : 'Pending'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              This pass ID is not registered for this event.
            </p>
          )}

          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {BRAND.tagline}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
