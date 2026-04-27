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

  // Verify token is still valid
  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response.data
      // Map the response to UserDto format
      const userData: UserDto = {
        username: data.username,
        email: data.email || '', // Use email from response or empty string
        roles: data.roles
          .filter((role: string) => role.startsWith('ROLE_'))
          .map((role: string) => role.replace('ROLE_', ''))
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {
      // Token invalid, clear storage
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      setUser(null)
    }
  }, [])

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
  }, [verifyToken])

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call login endpoint with POST request
      const response = await apiClient.post(`${API_BASE_URL}/api/auth/login`, {
        username: credentials.username,
        password: credentials.password
      })

      const { token } = response.data

      // Store token
      localStorage.setItem('authToken', token)

      // Get user data using the token
      await verifyToken(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Usuario o contraseña incorrectos'
      setError(message)
      console.error('Login error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [verifyToken])

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
