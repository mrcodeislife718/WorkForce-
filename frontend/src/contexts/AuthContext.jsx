import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { TOKEN_KEY } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null)
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('orca:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('orca:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!token) {
        setLoading(false)
        setUser(null)
        return
      }
      setLoading(true)
      try {
        const response = await api.get('/api/auth/me')
        if (!cancelled) setUser(response.data.user)
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => { cancelled = true }
  }, [token])

  const finishAuthentication = (payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token)
    setToken(payload.token)
    setUser(payload.user)
  }

  const login = async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    finishAuthentication(response.data)
    return response.data.user
  }

  const signup = async (profile) => {
    const response = await api.post('/api/auth/signup', profile)
    finishAuthentication(response.data)
    return response.data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({
    token,
    user,
    loading,
    authenticated: Boolean(token && user),
    login,
    signup,
    logout,
  }), [token, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
