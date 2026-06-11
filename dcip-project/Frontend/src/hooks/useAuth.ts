import { useState } from 'react'

export interface AuthUser {
  id: string
  fullName: string
  username: string
  school: { id: string; name: string; district: string }
  discipline: string | null
}

const loadToken = (): string | null => localStorage.getItem('token')

const loadUser = (): AuthUser | null => {
  const stored = localStorage.getItem('user')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const useAuth = () => {
  // Both token and user are read synchronously so they are available on the
  // very first render. Page components check `user` in useEffect — if user
  // were null on first render they would immediately navigate('/login').
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  // loading is always false: everything comes from synchronous localStorage reads
  const loading = false

  const saveAuth = (newToken: string, userData: AuthUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: Partial<AuthUser>) => {
    if (!user) return
    const merged = { ...user, ...updated }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }

  return { user, token, loading, saveAuth, logout, updateUser }
}
