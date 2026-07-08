import rawAdventure from '@/data/activity.json'
import rawCultural from '@/data/cultural.json'
import rawWorkshop from '@/data/workshop.json'

export type ActivityType = 'adventure' | 'cultural' | 'workshop'
export type ActivityInput = {
  name: string
  email: string
  phone: string
  team: string
  role: string
}
export type ActivityEntry = ActivityInput & {
  id: string
}

const activityData: Record<ActivityType, ActivityInput[]> = {
  adventure: rawAdventure as ActivityInput[],
  cultural: rawCultural as ActivityInput[],
  workshop: rawWorkshop as ActivityInput[],
}

const activityPrefix: Record<ActivityType, string> = {
  adventure: 'JATRA-ADV',
  cultural: 'JATRA-CUL',
  workshop: 'JATRA-WSH',
}

const activityTitles: Record<ActivityType, string> = {
  adventure: 'Adventure Activities',
  cultural: 'Cultural Activities',
  workshop: 'Workshops',
}

const activitySubtitles: Record<ActivityType, string> = {
  adventure: 'Manage adventure activity entries, generate QR passes and verify attendance.',
  cultural: 'Manage cultural activity entries, generate QR passes and verify attendees.',
  workshop: 'Manage workshop entries, generate QR passes and verify participation.',
}

const STORAGE_PREFIX = 'jatra_activity_entries_'

function getPrefix(type: ActivityType) {
  return activityPrefix[type]
}

function getStorageKey(type: ActivityType) {
  return `${STORAGE_PREFIX}${type}`
}

function formatEntryId(type: ActivityType, index: number) {
  return `${getPrefix(type)}-${String(index + 1).padStart(3, '0')}`
}

function loadLocalEntries(type: ActivityType): ActivityEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(type))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean).map((entry) => ({
      ...entry,
      id: String(entry.id || ''),
    }))
  } catch {
    return []
  }
}

function saveLocalEntries(type: ActivityType, entries: ActivityEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(type), JSON.stringify(entries))
}

export function getActivityPageTitle(type: ActivityType) {
  return activityTitles[type]
}

export function getActivityPageSubtitle(type: ActivityType) {
  return activitySubtitles[type]
}

export function getActivityEntries(type: ActivityType): ActivityEntry[] {
  const base = activityData[type].map((entry, index) => ({
    ...entry,
    id: formatEntryId(type, index),
  }))

  const local = loadLocalEntries(type)
  return [...base, ...local]
}

export function searchActivityEntries(type: ActivityType, query: string): ActivityEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return getActivityEntries(type)
  return getActivityEntries(type).filter(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q) ||
      entry.team.toLowerCase().includes(q) ||
      entry.email.toLowerCase().includes(q) ||
      entry.phone.includes(q) ||
      entry.role.toLowerCase().includes(q),
  )
}

export function findActivityEntryById(
  id: string,
): { type: ActivityType; entry: ActivityEntry } | undefined {
  const normalized = id.trim().toUpperCase()
  for (const type of Object.keys(activityData) as ActivityType[]) {
    const entry = getActivityEntries(type).find(
      (item) => item.id.toUpperCase() === normalized,
    )
    if (entry) return { type, entry }
  }
  return undefined
}

export function addActivityEntry(type: ActivityType, input: ActivityInput): ActivityEntry[] {
  const local = loadLocalEntries(type)
  const newId = `${getPrefix(type)}-${String(Date.now() % 1000000).padStart(6, '0')}`
  const nextEntry: ActivityEntry = {
    ...input,
    id: newId,
  }
  const next = [...local, nextEntry]
  saveLocalEntries(type, next)
  return getActivityEntries(type)
}
