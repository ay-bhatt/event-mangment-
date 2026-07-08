import {
  apiGetPassStatus,
  apiUpdatePassStatus,
} from '@/lib/api'

export const STATUS_FIELDS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'kitReceived', label: 'Kit Received' },
  { key: 'certificateReceived', label: 'Certificate Received' },
  { key: 'entryVerified', label: 'Entry Verified' },
] as const

export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'] as const
export type MealKey = (typeof MEAL_KEYS)[number]
export const MAX_MEAL_PASSES = 5

export const ATTENDANCE_KEY = 'attendanceDays' as const
export const ATTENDANCE_OPTIONS = [0, 1, 2, 3, 4, 5] as const

export type StatusKey = (typeof STATUS_FIELDS)[number]['key'] | typeof ATTENDANCE_KEY
export type VolunteerStatus = {
  attendanceDays: number
  breakfastUsed: number
  lunchUsed: number
  dinnerUsed: number
  updatedAt?: string
} & Record<(typeof STATUS_FIELDS)[number]['key'], boolean>

export const EMPTY_STATUS: VolunteerStatus = {
  attendanceDays: 0,
  breakfast: false,
  lunch: false,
  dinner: false,
  breakfastUsed: 0,
  lunchUsed: 0,
  dinnerUsed: 0,
  updatedAt: undefined,
  kitReceived: false,
  certificateReceived: false,
  entryVerified: false,
}

const LOCAL_PREFIX = 'jatra_status_'
const statusCache = new Map<string, VolunteerStatus>()
const listeners = new Map<string, Set<(s: VolunteerStatus) => void>>()

function localKey(id: string) {
  return `${LOCAL_PREFIX}${id}`
}

function normalizeMealCount(raw: number | boolean | undefined): number {
  if (typeof raw === 'number') return Math.max(0, Math.min(MAX_MEAL_PASSES, Math.trunc(raw)))
  if (raw === true) return 1
  return 0
}

function normalizeStatus(raw: Record<string, unknown> | null): VolunteerStatus {
  if (!raw) return { ...EMPTY_STATUS }

  const attendanceDays =
    typeof raw.attendanceDays === 'number'
      ? raw.attendanceDays
      : raw.attendance === true
        ? 1
        : 0

  return {
    attendanceDays,
    breakfast: Boolean(raw.breakfast),
    lunch: Boolean(raw.lunch),
    dinner: Boolean(raw.dinner),
    breakfastUsed: normalizeMealCount(
      (raw.breakfastUsed as number | boolean | undefined) ??
        (raw.breakfast as number | boolean | undefined),
    ),
    lunchUsed: normalizeMealCount(
      (raw.lunchUsed as number | boolean | undefined) ??
        (raw.lunch as number | boolean | undefined),
    ),
    dinnerUsed: normalizeMealCount(
      (raw.dinnerUsed as number | boolean | undefined) ??
        (raw.dinner as number | boolean | undefined),
    ),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    kitReceived: Boolean(raw.kitReceived),
    certificateReceived: Boolean(raw.certificateReceived),
    entryVerified: Boolean(raw.entryVerified),
  }
}

function notifyListeners(volunteerId: string, status: VolunteerStatus) {
  listeners.get(volunteerId)?.forEach((fn) => fn(status))
}

export function getMealUsed(status: VolunteerStatus, meal: MealKey): number {
  return status[`${meal}Used`]
}

export function getMealRemaining(status: VolunteerStatus, meal: MealKey): number {
  return Math.max(0, MAX_MEAL_PASSES - getMealUsed(status, meal))
}

export function getTotalMealsUsed(status: VolunteerStatus): number {
  return MEAL_KEYS.reduce((sum, meal) => sum + getMealUsed(status, meal), 0)
}

export function getTotalMealsRemaining(status: VolunteerStatus): number {
  return MEAL_KEYS.length * MAX_MEAL_PASSES - getTotalMealsUsed(status)
}

export function loadLocalStatus(volunteerId: string): VolunteerStatus {
  if (statusCache.has(volunteerId)) {
    return statusCache.get(volunteerId)!
  }
  try {
    const raw = localStorage.getItem(localKey(volunteerId))
    if (!raw) return { ...EMPTY_STATUS }
    const parsed = JSON.parse(raw)
    const normalized = normalizeStatus(parsed)
    statusCache.set(volunteerId, normalized)
    return normalized
  } catch {
    return { ...EMPTY_STATUS }
  }
}

export function saveLocalStatus(volunteerId: string, status: VolunteerStatus): void {
  statusCache.set(volunteerId, status)
  localStorage.setItem(localKey(volunteerId), JSON.stringify(status))
  notifyListeners(volunteerId, status)
}

export async function loadVolunteerStatus(volunteerId: string): Promise<VolunteerStatus> {
  try {
    const remote = await apiGetPassStatus(volunteerId)
    const normalized = normalizeStatus(remote as Record<string, unknown>)
    saveLocalStatus(volunteerId, normalized)
    return normalized
  } catch {
    return loadLocalStatus(volunteerId)
  }
}

export async function updateVolunteerStatus(
  volunteerId: string,
  status: VolunteerStatus,
): Promise<void> {
  const withTimestamp = { ...status, updatedAt: new Date().toISOString() }
  saveLocalStatus(volunteerId, withTimestamp)
  try {
    const saved = await apiUpdatePassStatus(volunteerId, withTimestamp)
    saveLocalStatus(volunteerId, normalizeStatus(saved as Record<string, unknown>))
  } catch {
    // Local cache kept as fallback when API unavailable
  }
}

export function subscribeVolunteerStatus(
  volunteerId: string,
  onUpdate: (status: VolunteerStatus) => void,
): (() => void) | null {
  if (!listeners.has(volunteerId)) {
    listeners.set(volunteerId, new Set())
  }
  listeners.get(volunteerId)!.add(onUpdate)
  onUpdate(loadLocalStatus(volunteerId))

  void loadVolunteerStatus(volunteerId).then(onUpdate).catch(() => undefined)

  return () => {
    listeners.get(volunteerId)?.delete(onUpdate)
  }
}

export function getFoodSummary(status: VolunteerStatus): string {
  const parts: string[] = []
  if (getMealUsed(status, 'breakfast') > 0)
    parts.push(`Breakfast ${getMealUsed(status, 'breakfast')}/${MAX_MEAL_PASSES}`)
  if (getMealUsed(status, 'lunch') > 0)
    parts.push(`Lunch ${getMealUsed(status, 'lunch')}/${MAX_MEAL_PASSES}`)
  if (getMealUsed(status, 'dinner') > 0)
    parts.push(`Dinner ${getMealUsed(status, 'dinner')}/${MAX_MEAL_PASSES}`)
  return parts.length ? parts.join(' · ') : 'No meals marked'
}

export function getAttendanceSummary(status: VolunteerStatus): string {
  const days = Number(status.attendanceDays || 0)
  return days > 0 ? `${days}/5 days marked` : 'No attendance marked'
}

/** API is always the primary backend now */
export function isApiEnabled(): boolean {
  return true
}
