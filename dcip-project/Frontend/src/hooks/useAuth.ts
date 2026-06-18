import { useState } from 'react'

export type UserRole = 'student' | 'supervisor' | 'admin'

export interface AuthUser {
  id: string
  fullName: string
  username: string
  role: UserRole
  school: { id: string; name: string; district: string } | null
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
  // very first render; prevents redirect loops in route guards.
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<AuthUser | null>(loadUser)

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
