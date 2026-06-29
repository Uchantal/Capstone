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

function DisciplineCard({ disc, onContinue }: { disc: DisciplineSummary; onContinue: (url: string) => void }) {
  const continueUrl = computeContinueUrl(disc)
  return (
    <div className="bg-white border border-surface-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-primary font-semibold text-sm">{disc.label}</p>
        <span className={`text-xs ${skillLabelClass(disc.skillLevel)}`}>{formatSkillLevel(disc.skillLevel)}</span>
      </div>
      <div className="mb-4">
        <MilestoneDots discKey={disc.key} completedStages={disc.completedStages} />
      </div>
      <button
        onClick={() => onContinue(continueUrl)}
        className="w-full border border-primary text-primary text-xs font-semibold py-2 rounded-lg hover:bg-primary/5 transition-colors"
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-text-primary font-bold text-2xl">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {user.school?.name}{user.school?.district ? ` · ${user.school.district}` : ''}
          </p>
        </div>

        <div className="bg-dark-mid rounded-2xl px-6 py-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-sm">DCIP Studio</p>
            <p className="text-white/70 text-xs mt-0.5">
              Unlock the studio, access virtual space and create serious work.
            </p>
          </div>
          <button
            onClick={() => navigate('/studio')}
            className="flex-shrink-0 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Enter Studio
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 md:grid-cols-1 lg:grid-cols-3">
          <div className="bg-white border border-surface-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Total Practice</p>
            <p className="text-primary font-bold text-3xl">
              {totalHours}<span className="text-base font-normal text-text-secondary ml-1">hrs</span>
            </p>
          </div>
          <div className="bg-white border border-surface-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Disciplines Active</p>
            <p className="text-primary font-bold text-3xl">{disciplines.length}</p>
          </div>
          <div className="bg-white border border-surface-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Levels Completed</p>
            <p className="text-primary font-bold text-3xl">{levelsCompleted}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 lg:grid-cols-1">

          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-text-primary font-bold text-base mb-4">Your Disciplines</h2>
            {loading ? (
              <div className="bg-white border border-surface-border rounded-2xl p-6">
                <p className="text-text-secondary text-sm">Loading progress...</p>
              </div>
            ) : disciplines.length === 0 ? (
              <div className="bg-white border border-surface-border rounded-2xl p-6 text-center">
                <p className="text-text-primary font-semibold text-sm mb-1">No activity yet</p>
                <p className="text-text-secondary text-xs">
                  Choose a discipline to begin your creative journey.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {disciplines.map(disc => (
                  <DisciplineCard key={disc.key} disc={disc} onContinue={navigate} />
                ))}
              </div>
            )}
          </div>

          <div className="col-span-1 space-y-4 lg:col-span-1">
            <div className="bg-white border border-surface-border rounded-2xl p-6">
              <h2 className="text-text-primary font-bold text-base mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/studio')}
                  className="w-full bg-primary text-white font-semibold text-sm py-3 rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Open Studio
                </button>
                <button
                  onClick={() => navigate('/disciplines')}
                  className="w-full bg-white border border-surface-border text-text-primary font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Go to Disciplines
                </button>
                <button
                  onClick={() => navigate('/portfolio')}
                  className="w-full bg-white border border-surface-border text-text-primary font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  View Portfolio
                </button>
                <button
                  onClick={() => navigate('/skill-summary')}
                  className="w-full bg-white border border-surface-border text-text-primary font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  View Skill Summary
                </button>
              </div>
            </div>

            {disciplines.length > 0 && (
              <div>
                <h2 className="text-text-primary font-bold text-base mb-3">My Grades</h2>
                <div className="space-y-4">
                  {disciplines.map(disc => (
                    <GradesCard
                      key={disc.key}
                      discKey={disc.key}
                      discLabel={DISC_LABEL[disc.key] ?? disc.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
