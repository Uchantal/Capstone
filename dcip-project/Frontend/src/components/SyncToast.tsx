import { useEffect, useState } from 'react'

export default function SyncToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => {
      setVisible(true)
      setTimeout(() => setVisible(false), 4000)
    }
    document.addEventListener('dcip:synced', handler)
    return () => document.removeEventListener('dcip:synced', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-secondary text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
      Your work has been synced.
    </div>
  )
}
