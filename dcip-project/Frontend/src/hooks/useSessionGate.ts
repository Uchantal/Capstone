import { useEffect, useState } from 'react'
import { getSessionStatus } from '../services/api'

export function useSessionGate(): { isOpen: boolean | null } {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  const check = async () => {
    try {
      const res = await getSessionStatus()
      setIsOpen(res.data.isOpen)
    } catch {
      // On network failure assume open so students are never blocked by an outage
      setIsOpen(true)
    }
  }

  useEffect(() => {
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [])

  return { isOpen }
}
