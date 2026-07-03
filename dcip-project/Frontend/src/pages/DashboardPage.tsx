import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchProgressSummary, fetchEngagementScores } from '../services/api'
import MainLayout from '../components/MainLayout'

interface DisciplineSummary {
  key: string
  label: string
  completedStages: string[]
  skillLevel: string
  totalSessions: number
  totalMinutes: number
}

interface SummaryResponse {
  disciplines: DisciplineSummary[]
  totalLevelsCompleted: number
  activeSince: string | null
}

const STAGE_URLS: Record<string, { stageId: string; url: string }[]> = {
  voice: [
    { stageId: 'voice-studio',           url: '/voice/studio' },
    { stageId: 'voice-course-1',         url: '/voice/posture-breath-voice' },
    { stageId: 'voice-course-2',         url: '/voice/pitch-and-scale' },
    { stageId: 'voice-level-1',          url: '/voice/level-1' },
    { stageId: 'voice-level-1-practise', url: '/voice/level-1/practise' },
    { stageId: 'voice-level-1-demo',     url: '/voice/level-1/demonstrate' },
    { stageId: 'voice-level-2',          url: '/voice/level-2' },
    { stageId: 'voice-level-2-practise', url: '/voice/level-2/practise' },
    { stageId: 'voice-level-2-demo',     url: '/voice/level-2/demonstrate' },
    { stageId: 'voice-level-3',          url: '/voice/level-3' },
    { stageId: 'voice-level-3-practise', url: '/voice/level-3/practise' },
    { stageId: 'voice-level-3-demo',     url: '/voice/level-3/demonstrate' },
    { stageId: 'voice-sharpening',       url: '/voice/sharpening-myself' },
    { stageId: 'voice-production-demo',  url: '/voice/production' },
  ],
  guitar: [
    { stageId: 'guitar-intro',            url: '/guitar/virtual-instrument' },
    { stageId: 'guitar-course-1',         url: '/guitar/reading-the-fretboard' },
    { stageId: 'guitar-course-2',         url: '/guitar/notes-across-the-neck' },
    { stageId: 'guitar-level-1',          url: '/guitar/level-1' },
    { stageId: 'guitar-level-1-practise', url: '/guitar/level-1/practise' },
    { stageId: 'guitar-level-1-demo',     url: '/guitar/level-1/demonstrate' },
    { stageId: 'guitar-level-2',          url: '/guitar/level-2' },
    { stageId: 'guitar-level-2-practise', url: '/guitar/level-2/practise' },
    { stageId: 'guitar-level-2-demo',     url: '/guitar/level-2/demonstrate' },
    { stageId: 'guitar-level-3',          url: '/guitar/level-3' },
    { stageId: 'guitar-level-3-practise', url: '/guitar/level-3/practise' },
    { stageId: 'guitar-level-3-demo',     url: '/guitar/level-3/demonstrate' },
    { stageId: 'guitar-sharpening',       url: '/guitar/sharpening-myself' },
    { stageId: 'guitar-production-demo',  url: '/guitar/production' },
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
    { stageId: 'va-virtual-canvas',      url: '/visual-arts/virtual-canvas' },
    { stageId: 'va-course-1',            url: '/visual-arts/course-1' },
    { stageId: 'va-course-2',            url: '/visual-arts/course-2' },
    { stageId: 'va-level-1',             url: '/visual-arts/level-1' },
    { stageId: 'va-level-1-practise',    url: '/visual-arts/level-1/practise' },
    { stageId: 'va-level-1-demo',        url: '/visual-arts/level-1/demonstrate' },
    { stageId: 'va-level-2',             url: '/visual-arts/level-2' },
    { stageId: 'va-level-2-practise',    url: '/visual-arts/level-2/practise' },
    { stageId: 'va-level-2-demo',        url: '/visual-arts/level-2/demonstrate' },
    { stageId: 'va-level-3',             url: '/visual-arts/level-3' },
    { stageId: 'va-level-3-practise',    url: '/visual-arts/level-3/practise' },
    { stageId: 'va-level-3-demo',        url: '/visual-arts/level-3/demonstrate' },
    { stageId: 'va-sharpening',          url: '/visual-arts/sharpening' },
    { stageId: 'va-production-demo',     url: '/visual-arts/production' },
  ],
  'graphic-design': [
    { stageId: 'gd-virtual-studio',      url: '/graphic-design/virtual-studio' },
    { stageId: 'gd-course-1',            url: '/graphic-design/course-1' },
    { stageId: 'gd-course-2',            url: '/graphic-design/course-2' },
    { stageId: 'gd-level-1',             url: '/graphic-design/level-1' },
    { stageId: 'gd-level-1-practise',    url: '/graphic-design/level-1/practise' },
    { stageId: 'gd-level-1-demo',        url: '/graphic-design/level-1/demonstrate' },
    { stageId: 'gd-level-2',             url: '/graphic-design/level-2' },
    { stageId: 'gd-level-2-practise',    url: '/graphic-design/level-2/practise' },
    { stageId: 'gd-level-2-demo',        url: '/graphic-design/level-2/demonstrate' },
    { stageId: 'gd-level-3',             url: '/graphic-design/level-3' },
    { stageId: 'gd-level-3-practise',    url: '/graphic-design/level-3/practise' },
    { stageId: 'gd-level-3-demo',        url: '/graphic-design/level-3/demonstrate' },
    { stageId: 'gd-sharpening',          url: '/graphic-design/sharpening' },
    { stageId: 'gd-production-demo',     url: '/graphic-design/production' },
  ],
}

const DISC_FIRST_URL: Record<string, string> = {
  piano: '/piano/virtual-instrument',
  guitar: '/guitar/virtual-instrument',
  voice: '/voice/studio',
  'visual-arts': '/visual-arts/virtual-canvas',
  'graphic-design': '/graphic-design/overview',
}

const MILESTONES: { label: string; stageIds: string[] }[] = [
  { label: 'Courses',    stageIds: [] },
  { label: 'Level 1',   stageIds: [] },
  { label: 'Level 2',   stageIds: [] },
  { label: 'Level 3',   stageIds: [] },
  { label: 'Production', stageIds: [] },
]

const DISC_MILESTONE_STAGES: Record<string, string[][]> = {
  piano: [
    ['piano-understanding', 'piano-notes-chords'],
    ['piano-level-1-demo'],
    ['piano-level-2-demo'],
    ['piano-level-3-demo'],
    ['piano-production-demo'],
  ],
  guitar: [
    ['guitar-intro', 'guitar-course-1', 'guitar-course-2'],
    ['guitar-level-1-demo'],
    ['guitar-level-2-demo'],
    ['guitar-level-3-demo'],
    ['guitar-production-demo'],
  ],
  voice: [
    ['voice-studio', 'voice-course-1', 'voice-course-2'],
    ['voice-level-1-demo'],
    ['voice-level-2-demo'],
    ['voice-level-3-demo'],
    ['voice-production-demo'],
  ],
  'visual-arts': [
    ['va-virtual-canvas', 'va-course-1', 'va-course-2'],
    ['va-level-1-demo'],
    ['va-level-2-demo'],
    ['va-level-3-demo'],
    ['va-production-demo'],
  ],
  'graphic-design': [
    ['gd-virtual-studio', 'gd-course-1', 'gd-course-2'],
    ['gd-level-1-demo'],
    ['gd-level-2-demo'],
    ['gd-level-3-demo'],
    ['gd-production-demo'],
  ],
}

function computeContinueUrl(disc: DisciplineSummary): string {
  const stages = STAGE_URLS[disc.key]
  if (!stages) return DISC_FIRST_URL[disc.key] ?? '/disciplines'
  let lastIdx = -1
  for (let i = 0; i < stages.length; i++) {
    if (disc.completedStages.includes(stages[i].stageId)) lastIdx = i
  }
  if (lastIdx === -1) return DISC_FIRST_URL[disc.key] ?? stages[0].url
  const nextIdx = Math.min(lastIdx + 1, stages.length - 1)
  return stages[nextIdx].url
}

function formatSkillLevel(level: string): string {
  if (level === 'not-started') return 'Not Started'
  if (level === 'getting-started') return 'Getting Started'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function skillLabelClass(level: string): string {
  if (level === 'advanced') return 'text-[#2D6A4F] font-bold'
  if (level === 'intermediate') return 'text-primary font-bold'
  if (level === 'beginner') return 'text-text-primary font-semibold'
  return 'text-text-muted'
}

function MilestoneDots({ discKey, completedStages }: { discKey: string; completedStages: string[] }) {
  const milestoneStages = DISC_MILESTONE_STAGES[discKey] ?? []
  const labels = MILESTONES.map(m => m.label)
  return (
    <div className="flex items-start gap-2 flex-wrap">
      {milestoneStages.map((stageIds, i) => {
        const done = stageIds.some(id => completedStages.includes(id))
        return (
          <div key={labels[i]} className="flex items-center gap-2">
            {i > 0 && <span className="text-surface-border text-xs">--</span>}
            <div className="flex flex-col items-center gap-1">
              <span className={`w-3 h-3 rounded-full border-2 inline-block ${done ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`} />
              <span className="text-text-muted text-[9px] whitespace-nowrap">{labels[i]}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DisciplineCard({ disc, onContinue, onViewDetail }: { disc: DisciplineSummary; onContinue: (url: string) => void; onViewDetail: (key: string) => void }) {
  const continueUrl = computeContinueUrl(disc)
  const totalStages = STAGE_URLS[disc.key]?.length ?? 1
  const pct = Math.min(Math.round((disc.completedStages.length / totalStages) * 100), 100)

  return (
    <div
      onClick={() => onViewDetail(disc.key)}
      className="bg-white border border-surface-border rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-primary transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-primary font-bold text-sm">{disc.label}</p>
        <span className={`text-xs ${skillLabelClass(disc.skillLevel)}`}>{formatSkillLevel(disc.skillLevel)}</span>
      </div>
      <div className="flex justify-between text-[10px] text-text-muted mb-1">
        <span>Progress</span>
        <span>{Math.min(disc.completedStages.length, totalStages)} / {totalStages} stages</span>
      </div>
      <div className="h-1.5 bg-surface-warm rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <MilestoneDots discKey={disc.key} completedStages={disc.completedStages} />
      <button
        onClick={e => { e.stopPropagation(); onContinue(continueUrl) }}
        className="mt-4 w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

const STAGE_LABELS: Record<string, string> = {
  course1: 'Course 1', course2: 'Course 2',
  level1Learn: 'Level 1: Learn', level1Practise: 'Level 1: Practise', level1Demonstrate: 'Level 1: Demonstrate',
  level2Learn: 'Level 2: Learn', level2Practise: 'Level 2: Practise', level2Demonstrate: 'Level 2: Demonstrate',
  level3Learn: 'Level 3: Learn', level3Practise: 'Level 3: Practise', level3Demonstrate: 'Level 3: Demonstrate',
  sharpening: 'Sharpening', production: 'Production',
}

type ScoreMap = Record<string, number | null>

function gradeInfo(score: number | null): { label: string; color: string } {
  if (score === null) return { label: '—', color: 'text-text-muted' }
  if (score >= 80) return { label: 'Excellent', color: 'text-[#2D6A4F]' }
  if (score >= 60) return { label: 'Good', color: 'text-primary' }
  if (score >= 40) return { label: 'Fair', color: 'text-orange-500' }
  return { label: 'Needs Improvement', color: 'text-accent' }
}

function GradesCard({ discKey, discLabel }: { discKey: string; discLabel: string }) {
  const [scores, setScores] = useState<ScoreMap | null>(null)

  useEffect(() => {
    fetchEngagementScores(discKey)
      .then(res => setScores(res.data ?? {}))
      .catch(() => setScores({}))
  }, [discKey])

  const attempted = Object.entries(STAGE_LABELS).filter(
    ([key]) => scores && typeof scores[key] === 'number'
  )

  const overall = scores?.overallEngagement ?? null
  const { label: overallLabel, color: overallColor } = gradeInfo(overall as number | null)

  if (scores === null) return null
  if (attempted.length === 0) return null

  return (
    <div className="bg-white border border-surface-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-primary font-semibold text-sm">{discLabel}</p>
        {overall !== null && (
          <span className={`text-xs font-bold ${overallColor}`}>{overall}% · {overallLabel}</span>
        )}
      </div>
      <div className="space-y-2">
        {attempted.map(([key, label]) => {
          const score = scores[key] as number
          const { label: g, color } = gradeInfo(score)
          return (
            <div key={key} className="grid grid-cols-[130px_1fr] gap-2 items-center">
              <p className="text-text-muted text-xs truncate">{label}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs tabular-nums text-text-secondary w-6 text-right">{score}%</span>
                <span className={`text-xs font-medium w-24 ${color}`}>{g}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DISC_LABEL: Record<string, string> = {
  piano: 'Piano', guitar: 'Guitar', voice: 'Voice & Singing',
  'visual-arts': 'Visual Arts', 'graphic-design': 'Graphic Design',
}


export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = () => {
    fetchProgressSummary()
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadSummary()

    // Refresh dashboard data automatically when offline work syncs back
    const handleSynced = () => loadSummary()
    document.addEventListener('dcip:synced', handleSynced)
    return () => document.removeEventListener('dcip:synced', handleSynced)
  }, [user, navigate])

  if (!user) return null

  const disciplines = summary?.disciplines ?? []
  const totalHours = Math.round(
    (disciplines.reduce((s, d) => s + d.totalMinutes, 0) / 60) * 10
  ) / 10
  const levelsCompleted = summary?.totalLevelsCompleted ?? 0

  const PRODUCTION_STAGE_IDS = new Set([
    'piano-production-demo', 'guitar-production-demo', 'voice-production-demo',
    'va-production-demo', 'gd-production-demo',
  ])
  const isGraduate = disciplines.some(d =>
    d.completedStages.some(s => PRODUCTION_STAGE_IDS.has(s))
  )

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-text-primary font-bold text-2xl">Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">
              {user.fullName} · {user.school?.name}{user.school?.district ? `, ${user.school.district}` : ''}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white border border-surface-border rounded-xl px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-primary font-bold text-lg leading-none">{totalHours}</p>
              <p className="text-text-muted text-[10px] mt-0.5">hrs practice</p>
            </div>
            <div className="bg-white border border-surface-border rounded-xl px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-primary font-bold text-lg leading-none">{disciplines.length}</p>
              <p className="text-text-muted text-[10px] mt-0.5">disciplines</p>
            </div>
            <div className="bg-white border border-surface-border rounded-xl px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-primary font-bold text-lg leading-none">{levelsCompleted}</p>
              <p className="text-text-muted text-[10px] mt-0.5">levels done</p>
            </div>
          </div>
        </div>

        {/* Studio banner */}
        <div className={`rounded-2xl px-6 py-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isGraduate ? 'bg-white border border-surface-border' : 'bg-surface-warm border border-surface-border'}`}>
          <div className="flex items-start gap-3">
            {!isGraduate && (
              <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            )}
            <div>
              <p className="text-text-primary font-bold text-sm">DCIP Studio</p>
              <p className="text-text-muted text-xs mt-0.5">
                {isGraduate
                  ? 'Your creative studio is open. Build, experiment, and create serious work.'
                  : 'Complete your first production to unlock the Studio.'}
              </p>
            </div>
          </div>
          {isGraduate ? (
            <button
              onClick={() => navigate('/studio')}
              className="flex-shrink-0 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Enter Studio
            </button>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-2 text-text-muted text-xs font-medium px-5 py-2.5 rounded-xl bg-surface-border/60 border border-surface-border cursor-not-allowed select-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Locked
            </span>
          )}
        </div>

        {/* Disciplines */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold text-base">Your Disciplines</h2>
          <button
            onClick={() => navigate('/disciplines')}
            className="text-xs text-primary font-medium hover:underline"
          >
            Browse all disciplines
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white border border-surface-border rounded-2xl p-5 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-4 w-24 bg-surface-warm rounded" />
                  <div className="h-3 w-16 bg-surface-warm rounded" />
                </div>
                <div className="flex justify-between mb-1">
                  <div className="h-3 w-12 bg-surface-warm rounded" />
                  <div className="h-3 w-16 bg-surface-warm rounded" />
                </div>
                <div className="h-1.5 bg-surface-warm rounded-full mb-4" />
                <div className="flex gap-2 mb-4">
                  {[1,2,3,4,5].map(d => <div key={d} className="w-3 h-3 rounded-full bg-surface-warm" />)}
                </div>
                <div className="h-9 bg-surface-warm rounded-xl" />
              </div>
            ))}
          </div>
        ) : disciplines.length === 0 ? (
          <div className="bg-white border border-surface-border rounded-2xl p-10 text-center">
            <p className="text-text-primary font-semibold text-sm mb-2">No activity yet</p>
            <p className="text-text-muted text-xs mb-4">Choose a discipline to begin your creative journey.</p>
            <button
              onClick={() => navigate('/disciplines')}
              className="bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Start a Discipline
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {disciplines.map(disc => (
              <DisciplineCard
                key={disc.key}
                disc={disc}
                onContinue={navigate}
                onViewDetail={key => navigate(`/discipline/${key}`)}
              />
            ))}
          </div>
        )}


        {/* Skill Summary — visible when student has more than one discipline */}
        {disciplines.length > 1 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary font-bold text-base">Skill Summary</h2>
              <button
                onClick={() => navigate('/skill-summary')}
                className="text-xs text-primary font-medium hover:underline"
              >
                View full report
              </button>
            </div>
            <div className="bg-white border border-surface-border rounded-2xl overflow-hidden">
              {disciplines.map((disc, i) => (
                <div
                  key={disc.key}
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-surface-warm transition-colors ${i < disciplines.length - 1 ? 'border-b border-surface-border' : ''}`}
                  onClick={() => navigate(`/discipline/${disc.key}`)}
                >
                  <p className="text-text-primary font-semibold text-sm">{disc.label}</p>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-1.5 bg-surface-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(Math.round((disc.completedStages.length / (STAGE_URLS[disc.key]?.length ?? 1)) * 100), 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs w-28 text-right ${skillLabelClass(disc.skillLevel)}`}>
                      {formatSkillLevel(disc.skillLevel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
