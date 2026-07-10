export type PageTitleKey =
  | 'volunteers'
  | 'adventure'
  | 'cultural'
  | 'workshop'
  | 'custom-folder'

const STORAGE_KEY = 'caumas_page_titles'

const DEFAULT_PAGE_TITLES: Record<PageTitleKey, string> = {
  volunteers: 'Volunteers',
  adventure: 'Adventure',
  cultural: 'Cultural',
  workshop: 'Workshop',
  'custom-folder': 'Custom Folder',
}

export function getStoredPageTitles(): Record<PageTitleKey, string> {
  if (typeof window === 'undefined') return DEFAULT_PAGE_TITLES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PAGE_TITLES
    const parsed = JSON.parse(raw) as Partial<Record<PageTitleKey, string>>
    return {
      ...DEFAULT_PAGE_TITLES,
      ...parsed,
    }
  } catch {
    return DEFAULT_PAGE_TITLES
  }
}

export function getStoredPageTitle(key: PageTitleKey): string {
  return getStoredPageTitles()[key] ?? DEFAULT_PAGE_TITLES[key]
}

export function saveStoredPageTitle(key: PageTitleKey, title: string): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getStoredPageTitles()
    const next = {
      ...existing,
      [key]: title.trim() || DEFAULT_PAGE_TITLES[key],
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('caumas-page-titles-updated'))
  } catch {
    // ignore storage failures
  }
}

export function subscribeStoredPageTitles(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const listener = () => onUpdate()
  window.addEventListener('caumas-page-titles-updated', listener)
  return () => window.removeEventListener('caumas-page-titles-updated', listener)
}
