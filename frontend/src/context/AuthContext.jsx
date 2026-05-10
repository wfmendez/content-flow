import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'cf-token'
const USER_KEY  = 'cf-user'
const DEMO_USER = { email: 'demo@contentflow.io', name: 'Demo User', role: 'admin', isDemo: true }

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const stored = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } })()
    if (token && stored && !stored.isDemo) {
      axios.get(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000,
      }).catch(() => {
        // Token expired or backend down — clear
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError('')
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await axios.post(`${BASE}/api/auth/login`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 6000,
      })
      localStorage.setItem(TOKEN_KEY, data.access_token)
      const u = { ...data.user, isDemo: false }
      localStorage.setItem(USER_KEY, JSON.stringify(u))
      setUser(u)
      return true
    } catch (e) {
      setError(e.response?.data?.detail || 'No se pudo conectar al servidor')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const loginDemo = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER))
    setUser(DEMO_USER)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

/** Returns the stored JWT token or null */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}
