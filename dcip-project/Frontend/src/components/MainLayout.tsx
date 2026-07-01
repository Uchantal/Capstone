import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useInactivityLogout } from '../hooks/useInactivityLogout'
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

// Explicit parent for every content page.
// Used when there is no browser history (direct URL, bookmark, post-SW-reload)
// so the back button always navigates to the right place rather than
// falling back blindly to /disciplines.
const ROUTE_PARENT: Record<string, string> = {
  // ── Piano ────────────────────────────────────────────────────────────
  '/piano/understanding-the-piano':     '/piano/virtual-instrument',
  '/piano/notes-build-chords':          '/piano/understanding-the-piano',
  '/piano/level-1':                     '/piano/virtual-instrument',
  '/piano/level-1/practise':            '/piano/level-1',
  '/piano/level-1/demonstrate':         '/piano/level-1',
  '/piano/level-2':                     '/piano/virtual-instrument',
  '/piano/level-2/practise':            '/piano/level-2',
  '/piano/level-2/demonstrate':         '/piano/level-2',
  '/piano/level-3':                     '/piano/virtual-instrument',
  '/piano/level-3/practise':            '/piano/level-3',
  '/piano/level-3/demonstrate':         '/piano/level-3',
  '/piano/sharpening-myself':           '/piano/virtual-instrument',
  '/piano/production':                  '/piano/virtual-instrument',

  // ── Guitar ───────────────────────────────────────────────────────────
  '/guitar/reading-the-fretboard':      '/guitar/virtual-instrument',
  '/guitar/notes-across-the-neck':      '/guitar/reading-the-fretboard',
  '/guitar/level-1':                    '/guitar/virtual-instrument',
  '/guitar/level-1/practise':           '/guitar/level-1',
  '/guitar/level-1/demonstrate':        '/guitar/level-1',
  '/guitar/level-2':                    '/guitar/virtual-instrument',
  '/guitar/level-2/practise':           '/guitar/level-2',
  '/guitar/level-2/demonstrate':        '/guitar/level-2',
  '/guitar/level-3':                    '/guitar/virtual-instrument',
  '/guitar/level-3/practise':           '/guitar/level-3',
  '/guitar/level-3/demonstrate':        '/guitar/level-3',
  '/guitar/sharpening-myself':          '/guitar/virtual-instrument',
  '/guitar/production':                 '/guitar/virtual-instrument',

  // ── Voice ────────────────────────────────────────────────────────────
  '/voice/posture-breath-voice':        '/voice/studio',
  '/voice/pitch-and-scale':             '/voice/posture-breath-voice',
  '/voice/level-1':                     '/voice/studio',
  '/voice/level-1/practise':            '/voice/level-1',
  '/voice/level-1/demonstrate':         '/voice/level-1',
  '/voice/level-2':                     '/voice/studio',
  '/voice/level-2/practise':            '/voice/level-2',
  '/voice/level-2/demonstrate':         '/voice/level-2',
  '/voice/level-3':                     '/voice/studio',
  '/voice/level-3/practise':            '/voice/level-3',
  '/voice/level-3/demonstrate':         '/voice/level-3',
  '/voice/sharpening-myself':           '/voice/studio',
  '/voice/production':                  '/voice/studio',

  // ── Visual Arts ──────────────────────────────────────────────────────
  '/visual-arts/course-1':              '/visual-arts/virtual-canvas',
  '/visual-arts/course-2':              '/visual-arts/course-1',
  '/visual-arts/level-1':               '/visual-arts/virtual-canvas',
  '/visual-arts/level-1/practise':      '/visual-arts/level-1',
  '/visual-arts/level-1/demonstrate':   '/visual-arts/level-1',
  '/visual-arts/level-2':               '/visual-arts/virtual-canvas',
  '/visual-arts/level-2/practise':      '/visual-arts/level-2',
  '/visual-arts/level-2/demonstrate':   '/visual-arts/level-2',
  '/visual-arts/level-3':               '/visual-arts/virtual-canvas',
  '/visual-arts/level-3/practise':      '/visual-arts/level-3',
  '/visual-arts/level-3/demonstrate':   '/visual-arts/level-3',
  '/visual-arts/sharpening':            '/visual-arts/virtual-canvas',
  '/visual-arts/production':            '/visual-arts/virtual-canvas',

  // ── Graphic Design ───────────────────────────────────────────────────
  '/graphic-design/course-1':           '/graphic-design/virtual-studio',
  '/graphic-design/course-2':           '/graphic-design/course-1',
  '/graphic-design/level-1':            '/graphic-design/virtual-studio',
  '/graphic-design/level-1/practise':   '/graphic-design/level-1',
  '/graphic-design/level-1/demonstrate':'/graphic-design/level-1',
  '/graphic-design/level-2':            '/graphic-design/virtual-studio',
  '/graphic-design/level-2/practise':   '/graphic-design/level-2',
  '/graphic-design/level-2/demonstrate':'/graphic-design/level-2',
  '/graphic-design/level-3':            '/graphic-design/virtual-studio',
  '/graphic-design/level-3/practise':   '/graphic-design/level-3',
  '/graphic-design/level-3/demonstrate':'/graphic-design/level-3',
  '/graphic-design/sharpening':         '/graphic-design/virtual-studio',
  '/graphic-design/production':         '/graphic-design/virtual-studio',

  // ── Hub / instrument pages ───────────────────────────────────────────
  '/piano/virtual-instrument':          '/disciplines',
  '/guitar/virtual-instrument':         '/disciplines',
  '/voice/studio':                      '/disciplines',
  '/visual-arts/virtual-canvas':        '/disciplines',
  '/graphic-design/virtual-studio':     '/disciplines',
  '/graphic-design/overview':           '/disciplines',
}

interface Props {
  children: React.ReactNode
  background?: string
}

export default function MainLayout({ children, background = 'bg-white' }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { showWarning, stayLoggedIn } = useInactivityLogout()

  const isStudent = user?.role === 'student'
  const showBack = isStudent && !NO_BACK_PATHS.has(pathname)

  const handleBack = () => {
    // If there is real browser history from within this SPA session use it —
    // this gives the most natural "undo last navigation" feeling.
    // Otherwise fall back to the statically-defined parent for this route so
    // that the button still works after a page reload, a direct URL open, or
    // after the service-worker reload that fires on each new deploy.
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
    } else {
      navigate(ROUTE_PARENT[pathname] ?? '/disciplines')
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

      {/* Inactivity warning — shown 5 minutes before auto-logout */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-lg mb-2">Still there?</h2>
            <p className="text-text-secondary text-sm mb-6">
              You have been inactive for 25 minutes. For security, you will be logged out in 5 minutes. Click below to stay logged in.
            </p>
            <button
              onClick={stayLoggedIn}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
