import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setInitializing(false)
      return
    }
    try {
      const me = await authApi.fetchMe()
      setUser(me)
    } catch {
      localStorage.removeItem('access_token')
      setUser(null)
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login(email, password)
    localStorage.setItem('access_token', access_token)
    const me = await authApi.fetchMe()
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (fields) => {
    await authApi.register(fields)
    // Registration doesn't log the person in automatically — send them to
    // sign in with the credentials they just created.
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateMe(payload)
    setUser(updated)
    return updated
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: !!user,
      isManager: user?.role === 'manager',
      login,
      register,
      logout,
      updateProfile,
      refreshUser: loadCurrentUser,
    }),
    [user, initializing, login, register, logout, updateProfile, loadCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
