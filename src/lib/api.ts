import axios from 'axios'
import { getAuthSession, clearAuthSession, setAuthSession } from '@/lib/session'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config) => {
    const { token } = getAuthSession()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await apiClient.post('/auth/refresh-token')
        const { accessToken } = response.data
        setAuthSession(accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        clearAuthSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  businessEmail?: string
  website?: string
  country?: string
  address?: string
  timezone?: string
  currency?: string
  plan?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'member'
  organization: Organization
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Auth API
export const authApi = {
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    organizationName: string
  }) => apiClient.post('/auth/register', data),
  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  getMe: () => apiClient.get('/auth/me'),
}

// Organization API
export const orgApi = {
  getMyOrganization: () => apiClient.get('/organization'),
  updateOrganization: (data: Partial<Organization>) =>
    apiClient.put('/organization', data),
}

// Stub types and functions for backward compatibility (not implemented yet)
export interface DashboardStats {
  [key: string]: any
}

export const apiGetDashboardStats = (): Promise<any> => Promise.resolve({ 
  totalVolunteers: 0,
  entryVerified: 0,
  kitReceived: 0,
  mealsServed: 0,
  totalRegistrations: 0,
  totalAttendees: 0,
  checkedInUsers: 0,
  pendingMeals: 0,
  qrScans: 0,
  volunteerActivity: []
})
export const apiCheckIn = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK' })
export const apiValidateScan = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK' })
export const apiCheckOut = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK' })
export const apiCollectMeal = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK', result: {} })
export const apiGetPassStatus = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK' })
export const apiUpdatePassStatus = (..._args: any[]): Promise<any> => Promise.resolve({ status: 'success', message: 'OK' })

export default apiClient
