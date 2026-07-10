import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getStoredUser, type AuthUser } from '@/lib/session'

type AuthContextValue = {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated] = useState(true)
  const [user] = useState<AuthUser | null>(getStoredUser)
  const [isLoading] = useState(false)

  const login = useCallback(async () => {
    return true
  }, [])

  const logout = useCallback(async () => {
    // No-op
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, user, isLoading, login, logout }),
    [isAuthenticated, user, isLoading, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
