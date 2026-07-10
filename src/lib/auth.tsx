import {
  createContext,
  useCallback,
  useContext,
<<<<<<< HEAD
  useEffect,
=======
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
  useMemo,
  useState,
  type ReactNode,
} from 'react'
<<<<<<< HEAD
import { authApi, type User } from './api'
import { clearAuthSession, getAuthSession, setAuthSession } from './session'

type AuthContextValue = {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
=======
import { getStoredUser, type AuthUser } from '@/lib/session'

type AuthContextValue = {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
}

const AuthContext = createContext<AuthContextValue | null>(null)

<<<<<<< HEAD
// Helper function to check if organization profile is complete
function isOrganizationProfileComplete(user: User | null): boolean {
  if (!user?.organization) return false
  const { country, address, timezone, currency } = user.organization
  // Check that all required fields are present and not empty strings
  return !!(
    country && 
    country.trim() && 
    address && 
    address.trim() && 
    timezone && 
    timezone.trim() && 
    currency && 
    currency.trim()
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      const { token, user: storedUser } = getAuthSession()
      if (token) {
        try {
          const response = await authApi.getMe()
          setUser(response.data.user)
        } catch {
          // Token invalid, clear session
          clearAuthSession()
          setUser(null)
        }
      } else if (storedUser) {
        setUser(storedUser)
      } else {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      const { accessToken, user } = response.data
      setAuthSession(accessToken, user)
      setUser(user)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuthSession()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      isLoading,
      login,
      logout,
      checkAuth,
      isOrganizationProfileComplete: isOrganizationProfileComplete(user),
    }),
    [user, isLoading, login, logout, checkAuth]
  ) as AuthContextValue & { isOrganizationProfileComplete: boolean }
=======
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
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
<<<<<<< HEAD
  return ctx as AuthContextValue & { isOrganizationProfileComplete: boolean }
=======
  return ctx
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
}
