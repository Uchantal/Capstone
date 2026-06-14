import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { label: 'Overview', to: '/admin/overview' },
  { label: 'Students', to: '/admin/students' },
  { label: 'Supervisors', to: '/admin/supervisors' },
  { label: 'Schools', to: '/admin/schools' },
  { label: 'Modules', to: '/admin/modules' },
  { label: 'Reports', to: '/admin/reports' },
]

export default function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-border h-14 flex items-center px-6 justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg w-9 h-9 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DC</span>
          </div>
          <span className="text-text-secondary text-xs font-medium hidden sm:inline">Admin</span>
        </div>
        <div className="flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-text-secondary text-xs hidden sm:inline">{user.fullName}</span>
        )}
        <button
          onClick={handleLogout}
          className="border border-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
