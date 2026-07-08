export type AppSettings = {
  eventName: string
  qrPrefix: string
  emailSubject: string
  emailMessage: string
}

const STORAGE_KEY = 'caumas_app_settings'

export const DEFAULT_SETTINGS: AppSettings = {
  eventName: 'Event',
  qrPrefix: 'EVENT-VOL',
  emailSubject: 'Your Event Pass',
  emailMessage: `Hello {{name}},

You are confirmed for {{event}}. Your pass ID is {{id}}. Please present the attached QR code at the entry gate.

Thank you,
Event Team`,
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore storage errors
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = readStorage(STORAGE_KEY)
    if (!raw) {
      for (const legacyKey of ['jatra_app_settings', 'yatra_app_settings'] as const) {
        const legacy = readStorage(legacyKey)
        if (legacy) {
          const parsed = JSON.parse(legacy) as Partial<AppSettings>
          const migrated = { ...DEFAULT_SETTINGS, ...parsed }
          saveSettings(migrated)
          return migrated
        }
      }
      return { ...DEFAULT_SETTINGS }
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      eventName: (parsed.eventName ?? DEFAULT_SETTINGS.eventName).trim(),
      qrPrefix: (parsed.qrPrefix ?? DEFAULT_SETTINGS.qrPrefix).trim(),
      emailSubject: (parsed.emailSubject ?? DEFAULT_SETTINGS.emailSubject).trim(),
      emailMessage: (parsed.emailMessage ?? DEFAULT_SETTINGS.emailMessage).trim(),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  const normalized = {
    ...DEFAULT_SETTINGS,
    ...settings,
    eventName: settings.eventName.trim(),
    qrPrefix: settings.qrPrefix.trim(),
    emailSubject: settings.emailSubject.trim(),
    emailMessage: settings.emailMessage.trim(),
  }
  writeStorage(STORAGE_KEY, JSON.stringify(normalized))
}

export function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}
