<<<<<<< HEAD
import type { User } from './api'

const TOKEN_KEY = 'caumas_auth_token'
const USER_KEY = 'caumas_auth_user'

export type AuthUser = User

export function getAuthSession(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    }
  } catch {
    return { token: null, user: null }
  }
}

export function setAuthSession(token: string, user?: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
=======
const TOKEN_KEY = 'caumas_auth_token'
const USER_KEY = 'caumas_auth_user'
const LOGIN_HISTORY_KEY = 'caumas_login_history_id'

export type AuthUser = {
  id: number
  username: string
  email: string | null
  role: string
  fullName: string | null
}

const mockUser: AuthUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'super_admin',
  fullName: 'Local Admin',
}

export function getAuthToken(): string | null {
  return 'mock_token'
}

export function setAuthSession(token: string, user: AuthUser, loginHistoryId?: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (loginHistoryId) {
    localStorage.setItem(LOGIN_HISTORY_KEY, String(loginHistoryId))
  }
  sessionStorage.setItem('caumas_admin_session', '1')
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
<<<<<<< HEAD
=======
  localStorage.removeItem(LOGIN_HISTORY_KEY)
  sessionStorage.removeItem('caumas_admin_session')
  for (const key of ['jatra_admin_session', 'yatra_admin_session']) {
    sessionStorage.removeItem(key)
  }
}

export function getStoredUser(): AuthUser | null {
  return mockUser
}

export function getLoginHistoryId(): number | null {
  return 1
}

export function isAdminSessionActive(): boolean {
  return true
}

/** @deprecated Use isAdminSessionActive — kept for route guards */
export function setAdminSession(active: boolean): void {
  if (!active) clearAuthSession()
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
}
