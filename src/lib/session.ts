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
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
