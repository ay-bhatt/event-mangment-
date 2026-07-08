export type VolunteerInput = {
  name: string
  email: string
  phone: string
  team: string
  role: string
}

export type Volunteer = VolunteerInput & {
  id: string
  fingerprint: string
}

export type IdRegistry = {
  nextSeq: number
  assignments: Record<string, string>
}

export function volunteerFingerprint(v: VolunteerInput): string {
  return [v.name, v.email, v.phone].map((s) => s.trim().toLowerCase()).join('|')
}

export function formatVolunteerId(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

export function assignStableIds(
  entries: VolunteerInput[],
  registry: IdRegistry,
  prefix: string,
): { volunteers: Volunteer[]; registry: IdRegistry } {
  const normalizedPrefix = prefix.trim() || 'JATRA-VOL'
  const nextRegistry: IdRegistry = {
    nextSeq: registry.nextSeq,
    assignments: { ...registry.assignments },
  }
  const usedIds = new Set(Object.values(nextRegistry.assignments))

  const volunteers: Volunteer[] = entries.map((entry) => {
    const fp = volunteerFingerprint(entry)
    let id = nextRegistry.assignments[fp]

    if (!id) {
      let seq = nextRegistry.nextSeq
      while (usedIds.has(formatVolunteerId(normalizedPrefix, seq))) {
        seq += 1
      }
      id = formatVolunteerId(normalizedPrefix, seq)
      nextRegistry.assignments[fp] = id
      nextRegistry.nextSeq = seq + 1
      usedIds.add(id)
    }

    return { ...entry, id, fingerprint: fp }
  })

  return { volunteers, registry: nextRegistry }
}
