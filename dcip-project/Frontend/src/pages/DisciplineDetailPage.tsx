import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchProgressSummary, fetchEngagementScores, fetchPortfolio } from '../services/api'
import MainLayout from '../components/MainLayout'

// ── Types ────────────────────────────────────────────────────────────────────

interface DisciplineSummary {
  key: string
  label: string
  completedStages: string[]
  skillLevel: string
  totalSessions: number
  totalMinutes: number
}

interface PortfolioItem {
  _id: string
  discipline: string
  title: string
  fileType: string
  createdAt: string
}

// ── Static config ────────────────────────────────────────────────────────────

const DISC_LABEL: Record<string, string> = {
  piano: 'Piano',
  guitar: 'Guitar',
  voice: 'Voice and Singing',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
}

const DISC_FIRST_URL: Record<string, string> = {
  piano: '/piano/virtual-instrument',
  guitar: '/guitar/virtual-instrument',
  voice: '/voice/studio',
  'visual-arts': '/visual-arts/virtual-canvas',
  'graphic-design': '/graphic-design/overview',
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
    { stageId: 'piano-understanding',    url: '/piano/understanding-the-piano' },
    { stageId: 'piano-notes-chords',     url: '/piano/notes-build-chords' },
    { stageId: 'piano-level-1',          url: '/piano/level-1' },
    { stageId: 'piano-level-1-practise', url: '/piano/level-1/practise' },
    { stageId: 'piano-level-1-demo',     url: '/piano/level-1/demonstrate' },
    { stageId: 'piano-level-2',          url: '/piano/level-2' },
    { stageId: 'piano-level-2-practise', url: '/piano/level-2/practise' },
    { stageId: 'piano-level-2-demo',     url: '/piano/level-2/demonstrate' },
    { stageId: 'piano-level-3',          url: '/piano/level-3' },
    { stageId: 'piano-level-3-practise', url: '/piano/level-3/practise' },
    { stageId: 'piano-level-3-demo',     url: '/piano/level-3/demonstrate' },
    { stageId: 'piano-sharpening',       url: '/piano/sharpening-myself' },
    { stageId: 'piano-production-demo',  url: '/piano/production' },
  ],
  'visual-arts': [
    { stageId: 'va-virtual-canvas',   url: '/visual-arts/virtual-canvas' },
    { stageId: 'va-course-1',         url: '/visual-arts/course-1' },
    { stageId: 'va-course-2',         url: '/visual-arts/course-2' },
    { stageId: 'va-level-1',          url: '/visual-arts/level-1' },
    { stageId: 'va-level-1-practise', url: '/visual-arts/level-1/practise' },
    { stageId: 'va-level-1-demo',     url: '/visual-arts/level-1/demonstrate' },
    { stageId: 'va-level-2',          url: '/visual-arts/level-2' },
    { stageId: 'va-level-2-practise', url: '/visual-arts/level-2/practise' },
    { stageId: 'va-level-2-demo',     url: '/visual-arts/level-2/demonstrate' },
    { stageId: 'va-level-3',          url: '/visual-arts/level-3' },
    { stageId: 'va-level-3-practise', url: '/visual-arts/level-3/practise' },
    { stageId: 'va-level-3-demo',     url: '/visual-arts/level-3/demonstrate' },
    { stageId: 'va-sharpening',       url: '/visual-arts/sharpening' },
    { stageId: 'va-production-demo',  url: '/visual-arts/production' },
  ],
  'graphic-design': [
    { stageId: 'gd-virtual-studio',   url: '/graphic-design/virtual-studio' },
    { stageId: 'gd-course-1',         url: '/graphic-design/course-1' },
    { stageId: 'gd-course-2',         url: '/graphic-design/course-2' },
    { stageId: 'gd-level-1',          url: '/graphic-design/level-1' },
    { stageId: 'gd-level-1-practise', url: '/graphic-design/level-1/practise' },
    { stageId: 'gd-level-1-demo',     url: '/graphic-design/level-1/demonstrate' },
    { stageId: 'gd-level-2',          url: '/graphic-design/level-2' },
    { stageId: 'gd-level-2-practise', url: '/graphic-design/level-2/practise' },
    { stageId: 'gd-level-2-demo',     url: '/graphic-design/level-2/demonstrate' },
    { stageId: 'gd-level-3',          url: '/graphic-design/level-3' },
    { stageId: 'gd-level-3-practise', url: '/graphic-design/level-3/practise' },
    { stageId: 'gd-level-3-demo',     url: '/graphic-design/level-3/demonstrate' },
    { stageId: 'gd-sharpening',       url: '/graphic-design/sharpening' },
    { stageId: 'gd-production-demo',  url: '/graphic-design/production' },
  ],
}

const MILESTONES: Record<string, { label: string; stageIds: string[] }[]> = {
  piano: [
    { label: 'Courses',    stageIds: ['piano-understanding', 'piano-notes-chords'] },
    { label: 'Level 1',   stageIds: ['piano-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['piano-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['piano-level-3-demo'] },
    { label: 'Production', stageIds: ['piano-production-demo'] },
  ],
  guitar: [
    { label: 'Courses',    stageIds: ['guitar-intro', 'guitar-course-1', 'guitar-course-2'] },
    { label: 'Level 1',   stageIds: ['guitar-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['guitar-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['guitar-level-3-demo'] },
    { label: 'Production', stageIds: ['guitar-production-demo'] },
  ],
  voice: [
    { label: 'Courses',    stageIds: ['voice-studio', 'voice-course-1', 'voice-course-2'] },
    { label: 'Level 1',   stageIds: ['voice-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['voice-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['voice-level-3-demo'] },
    { label: 'Production', stageIds: ['voice-production-demo'] },
  ],
  'visual-arts': [
    { label: 'Courses',    stageIds: ['va-virtual-canvas', 'va-course-1', 'va-course-2'] },
    { label: 'Level 1',   stageIds: ['va-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['va-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['va-level-3-demo'] },
    { label: 'Production', stageIds: ['va-production-demo'] },
  ],
  'graphic-design': [
    { label: 'Courses',    stageIds: ['gd-virtual-studio', 'gd-course-1', 'gd-course-2'] },
    { label: 'Level 1',   stageIds: ['gd-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['gd-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['gd-level-3-demo'] },
    { label: 'Production', stageIds: ['gd-production-demo'] },
  ],
}

const STAGE_LABELS: Record<string, string> = {
  course1: 'Course 1',
  course2: 'Course 2',
  level1Learn: 'Level 1: Learn',
  level1Practise: 'Level 1: Practise',
  level1Demonstrate: 'Level 1: Demonstrate',
  level2Learn: 'Level 2: Learn',
  level2Practise: 'Level 2: Practise',
  level2Demonstrate: 'Level 2: Demonstrate',
  level3Learn: 'Level 3: Learn',
  level3Practise: 'Level 3: Practise',
  level3Demonstrate: 'Level 3: Demonstrate',
  sharpening: 'Sharpening',
  production: 'Production',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeContinueUrl(disc: DisciplineSummary): string {
  const stages = STAGE_URLS[disc.key]
  if (!stages) return DISC_FIRST_URL[disc.key] ?? '/disciplines'
  let lastIdx = -1
  for (let i = 0; i < stages.length; i++) {
    if (disc.completedStages.includes(stages[i].stageId)) lastIdx = i
  }
  if (lastIdx === -1) return DISC_FIRST_URL[disc.key] ?? stages[0].url
  return stages[Math.min(lastIdx + 1, stages.length - 1)].url
}

function formatSkillLevel(level: string): string {
  if (level === 'not-started') return 'Not Started'
  if (level === 'getting-started') return 'Getting Started'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function skillLabelClass(level: string): string {
  if (level === 'advanced') return 'text-secondary font-bold'
  if (level === 'intermediate') return 'text-primary font-bold'
  if (level === 'beginner') return 'text-text-primary font-semibold'
  return 'text-text-muted'
}

function gradeInfo(score: number | null): { label: string; color: string } {
  if (score === null) return { label: 'Not attempted', color: 'text-text-muted' }
  if (score >= 80) return { label: 'Excellent', color: 'text-secondary' }
  if (score >= 60) return { label: 'Good', color: 'text-primary' }
  if (score >= 40) return { label: 'Fair', color: 'text-text-secondary' }
  return { label: 'Needs Improvement', color: 'text-accent' }
}

function nextStepText(lastIdx: number): string {
  if (lastIdx === -1) return 'Start this discipline to begin your journey.'
  if (lastIdx === 0)  return 'Complete Level 1 to begin earning skill badges.'
  if (lastIdx === 1)  return 'Complete Level 2 to progress further.'
  if (lastIdx === 2)  return 'Complete Level 3 to reach Intermediate.'
  if (lastIdx === 3)  return 'Complete Production to reach Advanced.'
  return 'You have reached the highest level in this discipline.'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DisciplineDetailPage() {
  const { key } = useParams<{ key: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [disc, setDisc] = useState<DisciplineSummary | null>(null)
  const [scores, setScores] = useState<Record<string, number | null> | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !key) { navigate('/dashboard'); return }
    Promise.all([
      fetchProgressSummary(),
      fetchEngagementScores(key).catch(() => ({ data: {} })),
      fetchPortfolio().catch(() => ({ data: [] })),
    ]).then(([sumRes, engRes, portRes]) => {
      const found = (sumRes.data?.disciplines ?? []).find((d: DisciplineSummary) => d.key === key)
      setDisc(found ?? null)
      setScores(engRes.data ?? {})
      const items: PortfolioItem[] = (portRes.data ?? []).filter(
        (p: PortfolioItem) => p.discipline === key || p.discipline === 'music' && ['piano', 'guitar', 'voice'].includes(key)
      )
      setPortfolio(items)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user, key, navigate])

  if (!user) return null
  if (!key || !DISC_LABEL[key]) {
    navigate('/dashboard')
    return null
  }

  const label = DISC_LABEL[key]
  const milestones = MILESTONES[key] ?? []
  const overallEngagement = scores?.overallEngagement ?? null
  const continueUrl = disc ? computeContinueUrl(disc) : (DISC_FIRST_URL[key] ?? '/disciplines')
  const lastMilestoneIdx = milestones.reduce(
    (best, m, i) => m.stageIds.some(id => disc?.completedStages.includes(id)) ? i : best, -1
  )
  const totalStages = STAGE_URLS[key]?.length ?? 1
  const completedCount = disc?.completedStages.length ?? 0
  const pct = Math.min(Math.round((completedCount / totalStages) * 100), 100)
  const hours = Math.round(((disc?.totalMinutes ?? 0) / 60) * 10) / 10

  const attemptedStages = Object.entries(STAGE_LABELS).filter(
    ([k]) => scores && typeof scores[k] === 'number'
  )

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">
            Dashboard
          </button>
          <span>/</span>
          <span className="text-text-primary font-medium">{label}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">{label}</h1>
            {disc && (
              <span className={`text-sm ${skillLabelClass(disc.skillLevel)}`}>
                {formatSkillLevel(disc.skillLevel)}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(continueUrl)}
            className="flex-shrink-0 bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue Learning
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-surface-border rounded-2xl p-8 text-center">
            <p className="text-text-muted text-sm">Loading...</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Stats + Progress */}
            <div className="bg-white border border-surface-border rounded-2xl p-6">
              <h2 className="text-text-primary font-bold text-sm mb-5">Overview</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Skill Level</p>
                  <p className={`text-sm ${disc ? skillLabelClass(disc.skillLevel) : 'text-text-muted'}`}>
                    {disc ? formatSkillLevel(disc.skillLevel) : 'Not Started'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Sessions</p>
                  <p className="text-text-primary font-semibold text-sm">{disc?.totalSessions ?? 0}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Hours</p>
                  <p className="text-text-primary font-semibold text-sm">{hours}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Stages Done</p>
                  <p className="text-text-primary font-semibold text-sm">{completedCount} / {totalStages}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-1 flex justify-between text-[10px] text-text-muted">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-surface-warm rounded-full overflow-hidden mb-5">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              {/* Milestone path */}
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Progress Path</p>
              <div className="flex items-start gap-3 flex-wrap mb-4">
                {milestones.map((m, i) => {
                  const done = m.stageIds.some(id => disc?.completedStages.includes(id))
                  return (
                    <div key={m.label} className="flex items-center gap-3">
                      {i > 0 && <span className="text-surface-border text-xs">--</span>}
                      <div className="flex flex-col items-center gap-1">
                        <span className={`w-4 h-4 rounded-full border-2 inline-block ${done ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`} />
                        <span className="text-text-muted text-[9px] whitespace-nowrap">{m.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Next step */}
              <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Next Step</p>
              <p className="text-text-secondary text-sm">{nextStepText(lastMilestoneIdx)}</p>
            </div>

            {/* Engagement */}
            {overallEngagement !== null && (
              <div className="bg-white border border-surface-border rounded-2xl p-6">
                <h2 className="text-text-primary font-bold text-sm mb-4">Engagement</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-surface-warm rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(overallEngagement as number, 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    {overallEngagement}%
                  </span>
                  <span className="text-xs text-text-muted">
                    {(overallEngagement as number) >= 75 ? 'Excellent' : (overallEngagement as number) >= 50 ? 'Good' : (overallEngagement as number) >= 25 ? 'Building' : 'Low'}
                  </span>
                </div>
              </div>
            )}

            {/* Grades */}
            {attemptedStages.length > 0 && (
              <div className="bg-white border border-surface-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-text-primary font-bold text-sm">Grades</h2>
                  {scores?.overallEngagement != null && (
                    <span className={`text-xs font-bold ${gradeInfo(scores.overallEngagement as number).color}`}>
                      Overall: {scores.overallEngagement}% · {gradeInfo(scores.overallEngagement as number).label}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {attemptedStages.map(([k, stageLabel]) => {
                    const score = scores![k] as number
                    const { label: g, color } = gradeInfo(score)
                    return (
                      <div key={k} className="grid grid-cols-[160px_1fr_60px_110px] gap-3 items-center">
                        <p className="text-text-muted text-xs truncate">{stageLabel}</p>
                        <div className="h-1.5 bg-surface-warm rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-text-secondary text-right">{score}%</span>
                        <span className={`text-xs font-medium ${color}`}>{g}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white border border-surface-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-text-primary font-bold text-sm">Portfolio</h2>
                  <button
                    onClick={() => navigate('/portfolio')}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {portfolio.slice(0, 5).map(item => (
                    <div key={item._id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                      <div>
                        <p className="text-text-primary font-medium text-sm">{item.title}</p>
                        <p className="text-text-muted text-xs">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-text-muted text-xs uppercase">{item.fileType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {disc && !disc.completedStages.length && (
              <div className="bg-white border border-surface-border rounded-2xl p-8 text-center">
                <p className="text-text-muted text-sm">No activity recorded for this discipline yet.</p>
                <button
                  onClick={() => navigate(continueUrl)}
                  className="mt-4 bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Start Now
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </MainLayout>
  )
}
