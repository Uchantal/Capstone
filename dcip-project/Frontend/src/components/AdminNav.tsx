import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { label: 'Overview',    to: '/admin/overview' },
  { label: 'Students',    to: '/admin/students' },
  { label: 'Supervisors', to: '/admin/supervisors' },
  { label: 'Schools',     to: '/admin/schools' },
  { label: 'Modules',     to: '/admin/modules' },
  { label: 'Reports',     to: '/admin/reports' },
  { label: 'Feedback',    to: '/admin/feedback' },
  { label: 'Preview',     to: '/admin/preview' },
]

export default function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-surface-border h-14 flex items-center px-4 lg:px-6 justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DC</span>
          </div>
          <span className="text-text-secondary text-xs font-medium hidden lg:inline">Admin</span>
        </button>
        <div className="flex items-center flex-wrap gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <span className="text-text-secondary text-xs hidden xl:inline truncate max-w-[120px]">{user.fullName}</span>
        )}
        <button
          onClick={handleLogout}
          className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
