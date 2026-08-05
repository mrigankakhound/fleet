import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours

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
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        try {
          const res = await getMe()
          setUser(res.data.data)
          localStorage.setItem('fleet_user', JSON.stringify(res.data.data))
        } catch {
          clearAuth()
        }
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
