import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TopNav from './TopNav'
import Footer from './Footer'
import OfflineBanner from './OfflineBanner'
import SyncToast from './SyncToast'

// Student home pages where a back button makes no sense
const NO_BACK_PATHS = new Set([
  '/dashboard',
  '/disciplines',
  '/session/music',
  '/portfolio',
  '/skill-summary',
  '/settings',
  '/feedback',
  '/profile',
])

interface Props {
  children: React.ReactNode
  background?: string
}

export default function MainLayout({ children, background = 'bg-white' }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()

  const isStudent = user?.role === 'student'
  const showBack = isStudent && !NO_BACK_PATHS.has(pathname)

  const handleBack = () => {
    // history.state.idx is 0 when there is no previous page inside this SPA session
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
    } else {
      navigate('/disciplines')
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${background}`}>
      <TopNav />
      <OfflineBanner />
      <div className="flex-1">
        {showBack && (
          <div className="px-6 md:px-10 pt-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-text-secondary text-sm hover:text-text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        )}
        {children}
      </div>
      <Footer />
      <SyncToast />
    </div>
  )
}
