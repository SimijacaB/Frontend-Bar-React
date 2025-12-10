import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { UserDto, LoginRequest } from '../../../types'
import apiClient from '../../../lib/axios'
import API_BASE_URL from '../../../config/api'

interface AuthContextType {
  user: UserDto | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('authToken')

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        // Optionally verify the token is still valid
        verifyToken(storedToken)
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
      }
    }
    setIsLoading(false)
  }, [])

  // Verify token is still valid
  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Basic ${token}` }
      })
      setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch {
      // Token invalid, clear storage
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      setUser(null)
    }
  }

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create Basic Auth token (Base64 encoded username:password)
      const token = btoa(`${credentials.username}:${credentials.password}`)
      
      // Call login endpoint with Basic Auth header using GET
      const response = await apiClient.get(`${API_BASE_URL}/api/auth/login`, {
        headers: {
          Authorization: `Basic ${token}`
        }
      })

      const userData: UserDto = response.data

      // Store token and user data
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Usuario o contraseña incorrectos'
      setError(message)
      console.error('Login error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
