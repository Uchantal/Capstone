import { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'student' | 'supervisor' | 'admin'

export interface AuthUser {
  id: string
  fullName: string
  username: string
  role: UserRole
  school: { id: string; name: string; district: string } | null
  discipline: string | null
  subDiscipline: string | null
  graduated?: boolean
  graduatedDisciplines?: string[]
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

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: false
  saveAuth: (newToken: string, userData: AuthUser) => void
  logout: () => void
  updateUser: (updated: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Both token and user are read synchronously so they are available on the
  // very first render; prevents redirect loops in route guards.
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<AuthUser | null>(loadUser)

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
    setUser(prev => {
      if (!prev) return prev
      const merged = { ...prev, ...updated }
      localStorage.setItem('user', JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, loading: false, saveAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
