import type { DashboardStats as ApiDashboardStats } from '@/lib/api'
import { apiGetDashboardStats } from '@/lib/api'
import { getVolunteers } from '@/lib/volunteers'
import { loadLocalStatus } from '@/lib/status'

export type EventStats = {
  totalVolunteers: number
  entryVerified: number
  kitReceived: number
  certificateReceived: number
  mealsServed: number
  totalRegistrations: number
  totalAttendees: number
  checkedInUsers: number
  pendingMeals: number
  qrScans: number
  volunteerActivity: number
}

function fromApi(stats: ApiDashboardStats): EventStats {
  return {
    totalVolunteers: stats.totalVolunteers,
    entryVerified: stats.entryVerified,
    kitReceived: stats.kitReceived,
    certificateReceived: 0,
    mealsServed: stats.mealsServed,
    totalRegistrations: stats.totalRegistrations,
    totalAttendees: stats.totalAttendees,
    checkedInUsers: stats.checkedInUsers,
    pendingMeals: stats.pendingMeals,
    qrScans: stats.qrScans,
    volunteerActivity: stats.volunteerActivity,
  }
}

function computeLocalStats(): EventStats {
  const volunteers = getVolunteers()
  let entryVerified = 0
  let kitReceived = 0
  let certificateReceived = 0
  let mealsServed = 0

  for (const v of volunteers) {
    const s = loadLocalStatus(v.id)
    if (s.entryVerified) entryVerified++
    if (s.kitReceived) kitReceived++
    if (s.certificateReceived) certificateReceived++
    mealsServed +=
      (s.breakfastUsed ?? 0) + (s.lunchUsed ?? 0) + (s.dinnerUsed ?? 0)
  }

  return {
    totalVolunteers: volunteers.length,
    entryVerified,
    kitReceived,
    certificateReceived,
    mealsServed,
    totalRegistrations: volunteers.length,
    totalAttendees: volunteers.length,
    checkedInUsers: entryVerified,
    pendingMeals: 0,
    qrScans: 0,
    volunteerActivity: 0,
  }
}

export async function fetchEventStats(): Promise<EventStats> {
  try {
    const stats = await apiGetDashboardStats()
    if (stats.totalVolunteers > 0 || stats.qrScans > 0 || stats.mealsServed > 0) {
      return fromApi(stats)
    }
    const local = computeLocalStats()
    return { ...fromApi(stats), ...local, totalVolunteers: local.totalVolunteers }
  } catch {
    return computeLocalStats()
  }
}

/** @deprecated Use fetchEventStats — sync fallback for legacy callers */
export function computeEventStats(): EventStats {
  return computeLocalStats()
}

export function entryRate(stats: EventStats): number {
  if (!stats.totalVolunteers) return 0
  return Math.round((stats.entryVerified / stats.totalVolunteers) * 100)
}
