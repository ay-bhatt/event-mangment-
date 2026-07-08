export type AppSettings = {
  eventName: string
  qrPrefix: string
  emailSubject: string
  emailMessage: string
}

const STORAGE_KEY = 'caumas_app_settings'

export const DEFAULT_SETTINGS: AppSettings = {
  eventName: 'Jatra festival 2026',
  qrPrefix: 'CAUMAS-VOL',
  emailSubject: 'Your CAUMAS Event Pass',
  emailMessage: `Hello {{name}},

You are confirmed for {{event}}. Your pass ID is {{id}}. Please present the attached QR code at the entry gate.

Thank you,
CAUMAS Event Team`,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const legacyKey of [
        'jatra_app_settings',
        'yatra_app_settings',
      ] as const) {
        const legacy = localStorage.getItem(legacyKey)
        if (legacy) {
          const parsed = JSON.parse(legacy) as Partial<AppSettings>
          const migrated = { ...DEFAULT_SETTINGS, ...parsed }
          saveSettings(migrated)
          return migrated
        }
      }
      return { ...DEFAULT_SETTINGS }
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function applyTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}
