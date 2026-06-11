import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'

export default function TopNav() {
  const { user, logout } = useAuth()
  const { isOnline, syncing } = useSync()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const statusColor = syncing
    ? 'bg-status-syncing'
    : isOnline
    ? 'bg-status-synced'
    : 'bg-status-offline'

  const statusLabel = syncing ? 'Syncing' : isOnline ? 'Online' : 'Offline'

  return (
    <nav className="bg-white border-b border-border h-14 flex items-center px-6 justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
          <span className="text-white font-bold text-sm">DC</span>
        </div>
        <div>
          <p className="text-text-primary font-semibold text-sm leading-tight">Digital Creative Platform</p>
          {user && (
            <p className="text-text-secondary text-xs leading-tight">
              {user.fullName} · {user.school.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-text-secondary text-xs">{statusLabel}</span>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="border border-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        )}
      </div>
    </nav>
  )
}
