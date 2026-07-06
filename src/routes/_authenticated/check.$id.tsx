import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { findVolunteerById } from '@/lib/volunteers'
import { findActivityEntryById } from '@/lib/activities'
import {
  EMPTY_STATUS,
  STATUS_FIELDS,
  getAttendanceSummary,
  getFoodSummary,
  loadVolunteerStatus,
  subscribeVolunteerStatus,
  type VolunteerStatus,
} from '@/lib/status'
import { loadSettings } from '@/lib/settings'
import { getInitials, cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/check/$id')({
  component: CheckVolunteerPage,
})

function CheckVolunteerPage() {
  const { id } = Route.useParams()
  const volunteer = findVolunteerById(id)
  const activity = findActivityEntryById(id)
  const item = volunteer ?? activity?.entry
  const itemType = volunteer
    ? 'Volunteer'
    : activity
    ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1)
    : 'Pass'
  const valid = Boolean(item)
  const settings = loadSettings()
  const [status, setStatus] = useState<VolunteerStatus>(EMPTY_STATUS)

  useEffect(() => {
    if (!item) return
    loadVolunteerStatus(item.id).then(setStatus)
    const unsub = subscribeVolunteerStatus(item.id, setStatus)
    return () => unsub?.()
  }, [item?.id])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/scanner">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Scanner
          </Link>
        </Button>
      </div>

      <Card
        className={cn(
          'overflow-hidden border-2',
          valid
            ? 'border-success/50 shadow-md'
            : 'border-danger/50 shadow-md',
        )}
      >
        <div
          className={cn(
            'px-6 py-4 text-center',
            valid ? 'bg-success/10' : 'bg-danger/10',
          )}
        >
          <Badge
            className={cn(
              'px-4 py-1.5 text-sm font-bold',
              valid
                ? 'bg-success text-success-foreground hover:bg-success'
                : 'bg-danger text-danger-foreground hover:bg-danger',
            )}
          >
            {valid ? 'VALID PASS' : 'NOT VALID'}
          </Badge>
          <p className="mt-2 font-mono text-lg font-semibold">{id}</p>
          <p className="text-xs text-muted-foreground">{settings.eventName}</p>
        </div>

        <CardContent className="space-y-6 p-6">
          {item ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.team} · {item.role}
                  </p>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label={`${itemType} ID`}
                  value={item.id}
                />
                <DetailItem
                  icon={<Users className="h-4 w-4" />}
                  label="Team / Role"
                  value={`${item.team} · ${item.role}`}
                />
                <DetailItem
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={item.email}
                />
                <DetailItem
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={item.phone}
                />
                <DetailItem
                  label="Attendance"
                  value={getAttendanceSummary(status)}
                />
                <DetailItem
                  label="Food"
                  value={getFoodSummary(status)}
                />
                <DetailItem
                  label="Entry"
                  value={status.entryVerified ? 'Verified' : 'Pending'}
                />
              </dl>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium">Status checklist</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_FIELDS.map(({ key, label }) => (
                    <div
                      key={key}
                      className={cn(
                        'rounded-md px-2 py-1.5 text-xs',
                        status[key]
                          ? 'bg-success/15 text-success'
                          : 'text-muted-foreground',
                      )}
                    >
                      {status[key] ? '✓' : '○'} {label}
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to={activity ? `/${activity.type}` : '/volunteers'}>
                  Open in list
                </Link>
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                No volunteer found for ID{' '}
                <span className="font-mono font-medium text-foreground">
                  {id}
                </span>{' '}
                in <code className="rounded bg-muted px-1">example.json</code>.
              </p>
              <p className="text-sm text-muted-foreground">
                Check the ID or scan a valid CAUMAS event pass QR code.
              </p>
              <Button asChild>
                <Link to="/scanner">Scan again</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
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
