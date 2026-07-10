import {
  clearAuthSession,
  getAuthToken,
  getLoginHistoryId,
  getStoredUser,
  setAuthSession,
} from '@/lib/session'

import type { VolunteerStatus } from '@/lib/status'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(data.error || res.statusText || 'Request failed', res.status)
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function apiLogin(_username: string, _password: string) {
  const user = getStoredUser()!
  const data = {
    success: true,
    token: 'mock_token',
    user,
    loginHistoryId: 1,
  }
  setAuthSession(data.token, data.user, data.loginHistoryId)
  return data
}

export async function apiLogout() {
  const loginHistoryId = getLoginHistoryId()
  try {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ loginHistoryId }),
    })
  } catch {
    // Ignore
  } finally {
    clearAuthSession()
  }
}

export async function apiValidateSession() {
  const user = getStoredUser()!
  return { success: true, valid: true, user }
}

export async function apiForgotPassword(email: string) {
  return request<{ success: boolean; message: string; resetToken?: string }>(
    '/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export async function apiResetPassword(token: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardStats = {
  totalRegistrations: number
  totalAttendees: number
  checkedInUsers: number
  mealsServed: number
  pendingMeals: number
  qrScans: number
  volunteerActivity: number
  entryVerified: number
  kitReceived: number
  totalVolunteers: number
  entryRate: number
}

export async function apiGetDashboardStats(eventId?: number) {
  const qs = eventId ? `?eventId=${eventId}` : ''
  const data = await request<{ success: boolean; stats: DashboardStats }>(
    `/dashboard/stats${qs}`,
  )
  return data.stats
}

// ---------------------------------------------------------------------------
// Pass status
// ---------------------------------------------------------------------------

export async function apiGetPassStatus(passId: string, eventId?: number) {
  const qs = eventId ? `?eventId=${eventId}` : ''
  const data = await request<{ success: boolean; status: VolunteerStatus }>(
    `/dashboard/status/${encodeURIComponent(passId)}${qs}`,
  )
  return data.status
}

export async function apiUpdatePassStatus(
  passId: string,
  status: VolunteerStatus,
  eventId?: number,
) {
  const data = await request<{ success: boolean; status: VolunteerStatus }>(
    `/dashboard/status/${encodeURIComponent(passId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status, eventId }),
    },
  )
  return data.status
}

// ---------------------------------------------------------------------------
// Scans
// ---------------------------------------------------------------------------

export async function apiValidateScan(
  externalPassId: string,
  scanType: 'entry' | 'exit' | 'meal' | 'activity' | 'verify' | 'manual' = 'entry',
  rawPayload?: string,
) {
  return request<{
    success: boolean
    valid: boolean
    result: string
    message: string
    status: VolunteerStatus | null
  }>('/scans/validate', {
    method: 'POST',
    body: JSON.stringify({ externalPassId, scanType, rawPayload }),
  })
}

export async function apiCheckOut(externalPassId: string, notes?: string) {
  return request<{
    success: boolean
    isDuplicate?: boolean
    message: string
    status: VolunteerStatus
    name?: string | null
  }>(`/attendance/check-out`, {
    method: 'POST',
    body: JSON.stringify({ externalPassId, notes }),
  })
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function apiCheckIn(externalPassId: string, notes?: string) {
  return request<{
    success: boolean
    isDuplicate: boolean
    message: string
    status: VolunteerStatus
    name: string
  }>('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ externalPassId, notes }),
  })
}

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

export async function apiCollectMeal(
  externalPassId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner',
) {
  return request<{
    success: boolean
    result: string
    message: string
    status: VolunteerStatus
    name: string | null
  }>('/meals/collect', {
    method: 'POST',
    body: JSON.stringify({ externalPassId, mealType }),
  })
}

export async function apiGetMealLogs(limit = 50) {
  const data = await request<{ success: boolean; logs: unknown[] }>(
    `/meals/logs?limit=${limit}`,
  )
  return data.logs
}

export function isApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_URL || true)
}
