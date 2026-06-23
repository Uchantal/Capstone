import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionGate } from '../hooks/useSessionGate'
import { useAuth } from '../hooks/useAuth'

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSessionGate()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (isOpen === null) {
    return <div className="min-h-screen bg-white" />
  }

  if (isOpen === false) {
    const initials = user?.fullName ? getInitials(user.fullName) : '?'

    return (
      <div className="min-h-screen bg-[#F9F7F4] flex flex-col items-center justify-center px-6 relative">

        {/* Profile avatar — top right */}
        <div className="absolute top-5 right-6">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center focus:outline-none hover:bg-primary-dark transition-colors"
            aria-label="Profile menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-surface-border rounded-xl shadow-md z-20 overflow-hidden">
                {user?.fullName && (
                  <div className="px-4 py-3 border-b border-surface-border">
                    <p className="text-text-primary text-sm font-semibold truncate">{user.fullName}</p>
                    {user?.username && (
                      <p className="text-text-muted text-xs truncate">@{user.username}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  className="w-full text-left px-4 py-3 text-sm text-accent hover:bg-accent/5 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Closed session card */}
        <div className="bg-white border border-surface-border rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-text-primary font-bold text-xl mb-3">Lab Session Closed</h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Your supervisor has closed the lab session. Please wait for the session to be opened.
          </p>
          <p className="text-text-muted text-xs">
            This page checks automatically every 30 seconds.
          </p>
        </div>

      </div>
    )
  }

  return <>{children}</>
}
