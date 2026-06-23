import { useEffect, useState } from 'react'
import { getPendingItems, removePendingItem } from '../services/db'
import { savePortfolioItem } from '../services/api'
import api from '../services/api'
import { replayPendingRequests } from '../utils/syncQueue'

export const useSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  const syncAll = async () => {
    if (!navigator.onLine) return
    setSyncing(true)

    // Sync legacy portfolio pending items from db.ts store
    const pending = await getPendingItems()
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

    // Replay general pending requests queued by the offline interceptor
    await replayPendingRequests(api)

    setSyncing(false)
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncAll()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    syncAll()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, syncing }
}
