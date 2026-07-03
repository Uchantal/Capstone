import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import { fetchProgressSummary } from '../services/api'

// Ordered stage-to-URL maps for "Continue Learning"
const STAGE_URLS: Record<string, { stageId: string; url: string }[]> = {
  voice: [
    { stageId: 'voice-studio',             url: '/voice/studio' },
    { stageId: 'voice-course-1',           url: '/voice/posture-breath-voice' },
    { stageId: 'voice-course-2',           url: '/voice/pitch-and-scale' },
    { stageId: 'voice-level-1',            url: '/voice/level-1' },
    { stageId: 'voice-level-1-practise',   url: '/voice/level-1/practise' },
    { stageId: 'voice-level-1-demo',       url: '/voice/level-1/demonstrate' },
    { stageId: 'voice-level-2',            url: '/voice/level-2' },
    { stageId: 'voice-level-2-practise',   url: '/voice/level-2/practise' },
    { stageId: 'voice-level-2-demo',       url: '/voice/level-2/demonstrate' },
    { stageId: 'voice-level-3',            url: '/voice/level-3' },
    { stageId: 'voice-level-3-practise',   url: '/voice/level-3/practise' },
    { stageId: 'voice-level-3-demo',       url: '/voice/level-3/demonstrate' },
    { stageId: 'voice-sharpening',         url: '/voice/sharpening-myself' },
    { stageId: 'voice-production-demo',    url: '/voice/production' },
  ],
  guitar: [
    { stageId: 'guitar-intro',             url: '/guitar/virtual-instrument' },
    { stageId: 'guitar-course-1',          url: '/guitar/reading-the-fretboard' },
    { stageId: 'guitar-course-2',          url: '/guitar/notes-across-the-neck' },
    { stageId: 'guitar-level-1',           url: '/guitar/level-1' },
    { stageId: 'guitar-level-1-practise',  url: '/guitar/level-1/practise' },
    { stageId: 'guitar-level-1-demo',      url: '/guitar/level-1/demonstrate' },
    { stageId: 'guitar-level-2',           url: '/guitar/level-2' },
    { stageId: 'guitar-level-2-practise',  url: '/guitar/level-2/practise' },
    { stageId: 'guitar-level-2-demo',      url: '/guitar/level-2/demonstrate' },
    { stageId: 'guitar-level-3',           url: '/guitar/level-3' },
    { stageId: 'guitar-level-3-practise',  url: '/guitar/level-3/practise' },
    { stageId: 'guitar-level-3-demo',      url: '/guitar/level-3/demonstrate' },
    { stageId: 'guitar-sharpening',        url: '/guitar/sharpening-myself' },
    { stageId: 'guitar-production-demo',   url: '/guitar/production' },
  ],
  piano: [
    { stageId: 'piano-understanding',      url: '/piano/understanding-the-piano' },
    { stageId: 'piano-notes-chords',       url: '/piano/notes-build-chords' },
    { stageId: 'piano-level-1',            url: '/piano/level-1' },
    { stageId: 'piano-level-1-practise',   url: '/piano/level-1/practise' },
    { stageId: 'piano-level-1-demo',       url: '/piano/level-1/demonstrate' },
    { stageId: 'piano-level-2',            url: '/piano/level-2' },
    { stageId: 'piano-level-2-practise',   url: '/piano/level-2/practise' },
    { stageId: 'piano-level-2-demo',       url: '/piano/level-2/demonstrate' },
    { stageId: 'piano-level-3',            url: '/piano/level-3' },
    { stageId: 'piano-level-3-practise',   url: '/piano/level-3/practise' },
    { stageId: 'piano-level-3-demo',       url: '/piano/level-3/demonstrate' },
    { stageId: 'piano-sharpening',         url: '/piano/sharpening-myself' },
    { stageId: 'piano-production-demo',    url: '/piano/production' },
  ],
  'visual-arts': [
    { stageId: 'va-virtual-canvas',        url: '/visual-arts/virtual-canvas' },
    { stageId: 'va-course-1',              url: '/visual-arts/course-1' },
    { stageId: 'va-course-2',              url: '/visual-arts/course-2' },
    { stageId: 'va-level-1',              url: '/visual-arts/level-1' },
    { stageId: 'va-level-1-practise',      url: '/visual-arts/level-1/practise' },
    { stageId: 'va-level-1-demo',          url: '/visual-arts/level-1/demonstrate' },
    { stageId: 'va-level-2',              url: '/visual-arts/level-2' },
    { stageId: 'va-level-2-practise',      url: '/visual-arts/level-2/practise' },
    { stageId: 'va-level-2-demo',          url: '/visual-arts/level-2/demonstrate' },
    { stageId: 'va-level-3',              url: '/visual-arts/level-3' },
    { stageId: 'va-level-3-practise',      url: '/visual-arts/level-3/practise' },
    { stageId: 'va-level-3-demo',          url: '/visual-arts/level-3/demonstrate' },
    { stageId: 'va-sharpening',            url: '/visual-arts/sharpening' },
    { stageId: 'va-production-demo',       url: '/visual-arts/production' },
  ],
  'graphic-design': [
    { stageId: 'gd-virtual-studio',        url: '/graphic-design/virtual-studio' },
    { stageId: 'gd-course-1',             url: '/graphic-design/course-1' },
    { stageId: 'gd-course-2',             url: '/graphic-design/course-2' },
    { stageId: 'gd-level-1',              url: '/graphic-design/level-1' },
    { stageId: 'gd-level-1-practise',      url: '/graphic-design/level-1/practise' },
    { stageId: 'gd-level-1-demo',          url: '/graphic-design/level-1/demonstrate' },
    { stageId: 'gd-level-2',              url: '/graphic-design/level-2' },
    { stageId: 'gd-level-2-practise',      url: '/graphic-design/level-2/practise' },
    { stageId: 'gd-level-2-demo',          url: '/graphic-design/level-2/demonstrate' },
    { stageId: 'gd-level-3',              url: '/graphic-design/level-3' },
    { stageId: 'gd-level-3-practise',      url: '/graphic-design/level-3/practise' },
    { stageId: 'gd-level-3-demo',          url: '/graphic-design/level-3/demonstrate' },
    { stageId: 'gd-sharpening',            url: '/graphic-design/sharpening' },
    { stageId: 'gd-production-demo',       url: '/graphic-design/production' },
  ],
}

function LogoLink() {
  return (
    <Link
      to="/"
      className="bg-primary rounded-lg w-9 h-8 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
    >
      <span className="text-white font-bold text-[10px] tracking-tight">DCIP</span>
    </Link>
  )
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0]
}

interface DisciplineSummary {
  key: string
  completedStages: string[]
}

function computeContinueUrl(disciplines: DisciplineSummary[]): string {
  if (disciplines.length === 0) return '/disciplines'

  let bestUrl = '/disciplines'
  let bestIdx = -2 // -2 so that even lastCompletedIdx=-1 (no stages done) still wins

  for (const disc of disciplines) {
    const stages = STAGE_URLS[disc.key]
    if (!stages) continue
    let lastCompletedIdx = -1
    for (let i = 0; i < stages.length; i++) {
      if (disc.completedStages.includes(stages[i].stageId)) lastCompletedIdx = i
    }
    if (lastCompletedIdx > bestIdx) {
      bestIdx = lastCompletedIdx
      const nextIdx = Math.min(lastCompletedIdx + 1, stages.length - 1)
      bestUrl = stages[nextIdx].url
    }
  }
  return bestUrl
}

export default function TopNav() {
  const { user, logout } = useAuth()
  const { isOnline, syncing } = useSync()
  const navigate = useNavigate()

  const [profileOpen, setProfileOpen] = useState(false)
  const [continueLoading, setContinueLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const continueUrlRef = useRef<string | null>(null)

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/')
  }

  const statusColor = syncing
    ? 'bg-status-syncing'
    : isOnline
    ? 'bg-status-synced'
    : 'bg-status-offline'

  const statusLabel = syncing ? 'Syncing' : isOnline ? 'Online' : 'Offline'

  useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const handleProfileToggle = async () => {
    const opening = !profileOpen
    setProfileOpen(opening)
    if (opening && continueUrlRef.current === null) {
      setContinueLoading(true)
      try {
        const res = await fetchProgressSummary()
        const disciplines: DisciplineSummary[] = res.data?.disciplines ?? []
        continueUrlRef.current = computeContinueUrl(disciplines)
      } catch {
        continueUrlRef.current = '/disciplines'
      } finally {
        setContinueLoading(false)
      }
    }
  }

  const go = (url: string) => {
    setProfileOpen(false)
    navigate(url)
  }

  // Non-student nav (admin)
  if (user?.role === 'admin') {
    return (
      <nav className="bg-white border-b border-surface-border h-12 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <LogoLink />
          <div>
            <p className="text-text-primary font-semibold text-sm leading-tight hidden lg:block">
              Digital Creative Infrastructure Platform
            </p>
            {user && (
              <p className="text-text-secondary text-xs leading-tight">
                {user.fullName} · Administrator
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
              className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Log out
            </button>
          )}
        </div>
      </nav>
    )
  }

  // Student nav
  const initials = user ? getInitials(user.fullName) : ''
  const firstName = user ? getFirstName(user.fullName) : ''
  const schoolName = user?.school?.name ?? ''

  return (
    <nav className="bg-white border-b border-surface-border h-12 flex items-center px-6 justify-between">
      <div className="flex items-center gap-3">
        <LogoLink />
        <p className="text-text-primary font-semibold text-sm leading-tight hidden lg:block">
          Digital Creative Infrastructure Platform
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-text-secondary text-xs">{statusLabel}</span>
        </div>

        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Profile trigger */}
            <button
              type="button"
              onClick={handleProfileToggle}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">{initials}</span>
              </div>
              <span className="text-sm font-medium text-text-primary hidden sm:block">{firstName}</span>
              <span className="text-text-secondary text-xs hidden sm:block">&#8964;</span>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-surface-border rounded-xl shadow-lg min-w-56 z-50 overflow-hidden">

                {/* Identity header */}
                <div className="px-4 py-3 border-b border-surface-border bg-[#F9F7F4]">
                  <p className="text-sm font-semibold text-text-primary leading-tight">{user.fullName}</p>
                  {schoolName && (
                    <p className="text-xs text-text-secondary mt-0.5">{schoolName}</p>
                  )}
                </div>

                {/* Navigation links */}
                <div
                  onClick={() => go('/dashboard')}
                  className="px-4 py-3 flex flex-col gap-0.5 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100 border-b border-surface-border"
                >
                  <span className="text-sm font-medium text-text-primary">My Dashboard</span>
                  <span className="text-xs text-text-secondary">Overview and quick access</span>
                </div>

                <div
                  onClick={() => go('/portfolio')}
                  className="px-4 py-3 flex flex-col gap-0.5 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100 border-b border-surface-border"
                >
                  <span className="text-sm font-medium text-text-primary">My Portfolio</span>
                  <span className="text-xs text-text-secondary">All your saved creative work</span>
                </div>

                <div
                  onClick={() => go('/studio')}
                  className="px-4 py-3 flex flex-col gap-0.5 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100 border-b border-surface-border"
                >
                  <span className="text-sm font-medium text-text-primary">DCIP Studio</span>
                  <span className="text-xs text-text-secondary">Professional creative workspace</span>
                </div>

                <div
                  onClick={() => go('/skill-summary')}
                  className="px-4 py-3 flex flex-col gap-0.5 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100 border-b border-surface-border"
                >
                  <span className="text-sm font-medium text-text-primary">Skill Summary</span>
                  <span className="text-xs text-text-secondary">Your progress and badges</span>
                </div>

                <div
                  onClick={() => !continueLoading && go(continueUrlRef.current ?? '/disciplines')}
                  className={`px-4 py-3 flex flex-col gap-0.5 transition-colors duration-100 border-b border-surface-border ${continueLoading ? 'opacity-50 cursor-wait' : 'hover:bg-[#F9F7F4] cursor-pointer'}`}
                >
                  <span className="text-sm font-medium text-text-primary">
                    {continueLoading ? 'Loading…' : 'Continue Learning'}
                  </span>
                  <span className="text-xs text-text-secondary">Pick up where you left off</span>
                </div>

                {/* Settings divider */}
                <div
                  onClick={() => go('/settings')}
                  className="px-4 py-3 flex flex-col gap-0.5 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100 border-b border-surface-border"
                >
                  <span className="text-sm font-medium text-text-primary">Account Settings</span>
                  <span className="text-xs text-text-secondary">Password and account details</span>
                </div>

                {/* Log out */}
                <div
                  onClick={handleLogout}
                  className="px-4 py-3 hover:bg-[#F9F7F4] cursor-pointer transition-colors duration-100"
                >
                  <span className="text-sm font-medium text-accent">Log out</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
