import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { label: 'Overview',    to: '/admin/overview' },
  { label: 'Supervisors', to: '/admin/supervisors' },
  { label: 'Schools',     to: '/admin/schools' },
  { label: 'Modules',     to: '/admin/modules' },
  { label: 'Reports',     to: '/admin/reports' },
  { label: 'Feedback',    to: '/admin/feedback' },
  { label: 'Preview',     to: '/admin/preview' },
]

const SITE_LINKS = [
  { label: 'Home',         to: '/' },
  { label: 'About',        to: '/#about' },
  { label: 'Disciplines',  to: '/#disciplines' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Feedback',     to: '/feedback' },
]

export default function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-surface-border h-14 flex items-center px-4 lg:px-6 justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">

        {/* Logo with site-links dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-primary rounded-lg w-9 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-[10px] tracking-tight">DCIP</span>
            </div>
            <span className="text-text-secondary text-xs font-medium hidden lg:inline">Admin</span>
          </button>

          {menuOpen && (
            <div className="absolute top-10 left-0 z-50 bg-white border border-surface-border rounded-xl shadow-lg py-1 min-w-[160px]">
              <p className="text-text-secondary text-[10px] font-semibold uppercase tracking-widest px-3 py-2">
                Visit Site
              </p>
              {SITE_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin nav links */}
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
