import { loadVolunteersWithIds } from '@/lib/volunteer-storage'
import { type Volunteer, type VolunteerInput, volunteerFingerprint } from '@/lib/id-registry'

export type { Volunteer, VolunteerInput }
export { volunteerFingerprint }

export function getVolunteers(): Volunteer[] {
  return loadVolunteersWithIds().volunteers
}

export function findVolunteerById(id: string): Volunteer | undefined {
  const normalized = id.trim().toUpperCase()
  return getVolunteers().find((v) => v.id.toUpperCase() === normalized)
}

export function searchVolunteers(query: string): Volunteer[] {
  const q = query.trim().toLowerCase()
  if (!q) return getVolunteers()
  return getVolunteers().filter(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      v.team.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      v.role.toLowerCase().includes(q),
  )
}

export function parseScannedQrValue(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  try {
    const url = new URL(text)
    const parts = url.pathname.split('/').filter(Boolean)
    for (const segment of ['verify', 'check']) {
      const idx = parts.indexOf(segment)
      if (idx >= 0 && parts[idx + 1]) {
        return decodeURIComponent(parts[idx + 1]).toUpperCase()
      }
    }
  } catch {
    /* not a URL */
  }

  const match = text.match(/([A-Za-z]+-[A-Za-z]+-\d{3,})/i)
  if (match) return match[1].toUpperCase()

  if (/^[A-Za-z]+-[A-Za-z]+-\d{3,}$/i.test(text)) return text.toUpperCase()

  return text.toUpperCase()
}

/** Normalize manual input: full ID, URL, or numeric suffix (001 → JATRA-VOL-001). */
export function normalizeVolunteerId(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  const prefix = (loadSettings().qrPrefix || 'JATRA-VOL').toUpperCase()

  if (/^\d+$/.test(text)) {
    return `${prefix}-${text.padStart(3, '0')}`
  }

  const parsed = parseScannedQrValue(text)
  if (!parsed) return null

  const volMatch = parsed.match(/^([A-Z]+-VOL-)(\d+)$/i)
  if (volMatch) {
    return `${volMatch[1]}${volMatch[2].padStart(3, '0')}`
  }

  return parsed
}
