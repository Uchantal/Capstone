import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

const INACTIVITY_MS = 30 * 60 * 1000  // 30 minutes of no activity → logout
const WARNING_MS    = 25 * 60 * 1000  // show warning at 25 minutes (5 min before logout)

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart'] as const

export function useInactivityLogout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (warningRef.current) clearTimeout(warningRef.current)
    if (logoutRef.current)  clearTimeout(logoutRef.current)
  }, [])

  const resetTimers = useCallback(() => {
    if (!user) return
    clearTimers()
    setShowWarning(false)
    warningRef.current = setTimeout(() => setShowWarning(true), WARNING_MS)
    logoutRef.current  = setTimeout(() => {
      logout()
      navigate('/login', { replace: true })
    }, INACTIVITY_MS)
  }, [user, clearTimers, logout, navigate])

  useEffect(() => {
    if (!user) { clearTimers(); return }

    resetTimers()
    ACTIVITY_EVENTS.forEach(ev => document.addEventListener(ev, resetTimers))

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach(ev => document.removeEventListener(ev, resetTimers))
    }
  }, [user, resetTimers, clearTimers])

  return { showWarning, stayLoggedIn: resetTimers }
}
