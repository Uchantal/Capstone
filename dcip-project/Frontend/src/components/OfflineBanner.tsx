import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-primary text-white text-xs py-1.5 text-center">
      You are offline. Your work is being saved locally and will sync when you reconnect.
    </div>
  )
}
