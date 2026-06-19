import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchProgressSummary } from '../services/api'
import TopNav from '../components/TopNav'
import Footer from '../components/Footer'

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
  'graphic-design': '/graphic-design/virtual-studio',
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
            {i > 0 && <span className="text-border text-xs">--</span>}
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
    <div className="bg-white border border-border rounded-2xl p-5">
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

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchProgressSummary()
      .then(res => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user) return null

  const disciplines = summary?.disciplines ?? []
  const totalHours = Math.round(
    (disciplines.reduce((s, d) => s + d.totalMinutes, 0) / 60) * 10
  ) / 10
  const levelsCompleted = summary?.totalLevelsCompleted ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-text-primary font-bold text-2xl">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {user.school?.name}{user.school?.district ? ` · ${user.school.district}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 md:grid-cols-1 lg:grid-cols-3">
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Total Practice</p>
            <p className="text-primary font-bold text-3xl">
              {totalHours}<span className="text-base font-normal text-text-secondary ml-1">hrs</span>
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Disciplines Active</p>
            <p className="text-primary font-bold text-3xl">{disciplines.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Levels Completed</p>
            <p className="text-primary font-bold text-3xl">{levelsCompleted}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 lg:grid-cols-1">

          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-text-primary font-bold text-base mb-4">Your Disciplines</h2>
            {loading ? (
              <div className="bg-white border border-border rounded-2xl p-6">
                <p className="text-text-secondary text-sm">Loading progress...</p>
              </div>
            ) : disciplines.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-6 text-center">
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
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-text-primary font-bold text-base mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/disciplines')}
                  className="w-full bg-primary text-white font-semibold text-sm py-3 rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Start Practice
                </button>
                <button
                  onClick={() => navigate('/portfolio')}
                  className="w-full bg-white border border-border text-text-primary font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  View Portfolio
                </button>
                <button
                  onClick={() => navigate('/skill-summary')}
                  className="w-full bg-white border border-border text-text-primary font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  View Skill Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
