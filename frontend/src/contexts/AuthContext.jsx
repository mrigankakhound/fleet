import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours

/**
 * Decode a JWT payload without a library.
 * Returns null if the token is invalid/malformed.
 */
const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Returns true if the token is present and has not expired yet.
 */
const isTokenValid = (token) => {
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  // exp is in seconds; Date.now() is in ms
  return payload.exp * 1000 > Date.now() + 30_000 // 30s buffer
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearAuth = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('fleet_token')
    localStorage.removeItem('fleet_user')
    localStorage.removeItem('fleet_login_time')
  }, [])

  // Check session timeout
  const checkSessionTimeout = useCallback(() => {
    const loginTime = localStorage.getItem('fleet_login_time')
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime)
      if (elapsed > SESSION_TIMEOUT) {
        clearAuth()
        toast.warning('Session expired. Please login again.')
        return false
      }
    }
    return true
  }, [clearAuth])

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('fleet_token')
      const storedUser = localStorage.getItem('fleet_user')

      if (storedToken && storedUser) {
        if (!checkSessionTimeout()) {
          setIsLoading(false)
          return
        }

        // ── Fast path: if JWT is still valid, restore from localStorage immediately ──
        // This avoids a network round-trip on every page load/refresh.
        if (isTokenValid(storedToken)) {
          setToken(storedToken)
          try {
            setUser(JSON.parse(storedUser))
          } catch {
            clearAuth()
            setIsLoading(false)
            return
          }
          setIsLoading(false)

          // Background refresh: silently update user data without blocking UI
          getMe()
            .then((res) => {
              setUser(res.data.data)
              localStorage.setItem('fleet_user', JSON.stringify(res.data.data))
            })
            .catch(() => {
              // If /me fails (e.g. token revoked server-side), clear session
              clearAuth()
              window.location.href = '/login'
            })

          return
        }

        // ── Slow path: token missing or expired — clear session ──
        clearAuth()
      }

      setIsLoading(false)
    }

    restoreSession()
  }, [checkSessionTimeout, clearAuth])

  // Session timeout check interval
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      if (!checkSessionTimeout()) {
        window.location.href = '/login'
      }
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [token, checkSessionTimeout])

  const login = async (credentials) => {
    const res = await loginApi(credentials)
    const { token: newToken, user: userData } = res.data.data
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('fleet_token', newToken)
    localStorage.setItem('fleet_user', JSON.stringify(userData))
    localStorage.setItem('fleet_login_time', Date.now().toString())
    return userData
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {}
    clearAuth()
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
