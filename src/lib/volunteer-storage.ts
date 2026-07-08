import { VolunteerInput, type IdRegistry, assignStableIds } from '@/lib/id-registry'
import { loadSettings } from '@/lib/settings'
import rawVolunteers from '@/data/example.json'
import registryFile from '@/data/id-registry.json'

const VOLUNTEERS_KEY = 'caumas_volunteers'
const REGISTRY_KEY = 'caumas_volunteer_registry'

export type { VolunteerInput }

function loadJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadVolunteerInputs(): VolunteerInput[] {
  const saved = loadJson<VolunteerInput[]>(VOLUNTEERS_KEY, [])
  if (saved.length) return saved
  return rawVolunteers as VolunteerInput[]
}

export function loadVolunteerRegistry(): IdRegistry {
  return loadJson<IdRegistry>(REGISTRY_KEY, registryFile as IdRegistry)
}

export function saveVolunteerInputs(entries: VolunteerInput[]): void {
  localStorage.setItem(VOLUNTEERS_KEY, JSON.stringify(entries))
}

export function saveVolunteerRegistry(registry: IdRegistry): void {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

export function persistVolunteerInputs(entries: VolunteerInput[]): void {
  saveVolunteerInputs(entries)
  const prefix = loadSettings().qrPrefix.trim() || 'JATRA-VOL'
  const { registry } = assignStableIds(entries, loadVolunteerRegistry(), prefix)
  saveVolunteerRegistry(registry)
}

export function loadVolunteersWithIds() {
  const entries = loadVolunteerInputs()
  const registry = loadVolunteerRegistry()
  const prefix = loadSettings().qrPrefix.trim() || 'JATRA-VOL'
  return assignStableIds(entries, registry, prefix)
}
