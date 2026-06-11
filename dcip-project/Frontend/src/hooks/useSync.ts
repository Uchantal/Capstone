import { useEffect, useState } from 'react'
import { getPendingItems, removePendingItem } from '../services/db'
import { savePortfolioItem } from '../services/api'

export const useSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  const syncPendingItems = async () => {
    if (!navigator.onLine) return
    const pending = await getPendingItems()
    if (pending.length === 0) return
    setSyncing(true)
    for (const item of pending) {
      try {
        await savePortfolioItem({
          discipline: item.discipline,
          title: item.title,
          fileType: item.fileType,
          fileData: item.fileData,
          durationMinutes: item.durationMinutes,
        })
        if (item.localId !== undefined) {
          await removePendingItem(item.localId)
        }
      } catch {
        // will retry on next online event
      }
    }
    setSyncing(false)
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingItems()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try to sync on mount
    syncPendingItems()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, syncing }
}
