import { useEffect, useState } from 'react'
import { getSessionStatus } from '../services/api'

export function useSessionGate(): { isOpen: boolean | null } {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  const check = async () => {
    // If the device has no network at all, never block the student
    if (!navigator.onLine) {
      setIsOpen(true)
      return
    }
    try {
      const res = await getSessionStatus()
      // SW returns {offline:true} with 503 when it can't reach the server
      if ((res.data as { offline?: boolean }).offline) {
        setIsOpen(true)
        return
      }
      setIsOpen(res.data.isOpen)
    } catch {
      // Any network or server failure defaults to open
      setIsOpen(true)
    }
  }

  useEffect(() => {
    check()
    const id = setInterval(check, 30_000)

    const handleOffline = () => setIsOpen(true)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(id)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOpen }
}
