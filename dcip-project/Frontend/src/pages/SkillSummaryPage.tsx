import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchProgressSummary, fetchPortfolio } from '../services/api'
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

interface PortfolioItem {
  _id: string
  discipline: string
  title: string
  createdAt: string
  fileType: string
}

// ── Milestone config ─────────────────────────────────────────────────────────

interface Milestone {
  label: string
  stageIds: string[]
}

const MILESTONES: Record<string, Milestone[]> = {
  piano: [
    { label: 'Courses',    stageIds: ['piano-level-1-practise'] },
    { label: 'Level 1',   stageIds: ['piano-level-1-demo'] },
    { label: 'Level 2',   stageIds: ['piano-level-2-demo'] },
    { label: 'Level 3',   stageIds: ['piano-level-3-demo'] },
    { label: 'Production', stageIds: ['piano-production-demo'] },
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
}

function isMilestoneDone(m: Milestone, stages: string[]): boolean {
  return m.stageIds.some(id => stages.includes(id))
}

function getLastDoneIdx(milestones: Milestone[], stages: string[]): number {
  return milestones.reduce((best, m, i) => isMilestoneDone(m, stages) ? i : best, -1)
}

function nextStepText(lastIdx: number): string {
  if (lastIdx === -1) return 'Start this discipline to begin your journey.'
  if (lastIdx === 0)  return 'Complete Level 1 to begin earning skill badges.'
  if (lastIdx === 1)  return 'Complete Level 2 to progress further.'
  if (lastIdx === 2)  return 'Complete Level 3 to reach Intermediate.'
  if (lastIdx === 3)  return 'Complete Production to reach Advanced.'
  return 'You have reached the highest level in this discipline.'
}

// ── Skill label display ──────────────────────────────────────────────────────

function formatSkillLevel(level: string): string {
  if (level === 'not-started')     return 'Not Started'
  if (level === 'getting-started') return 'Getting Started'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function skillLabelClass(level: string): string {
  if (level === 'advanced')        return 'text-[#2D6A4F] font-bold'
  if (level === 'intermediate')    return 'text-primary font-bold'
  if (level === 'beginner')        return 'text-text-primary font-semibold'
  if (level === 'getting-started') return 'text-text-secondary font-semibold'
  return 'text-text-muted font-normal'
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MilestonePath({ milestones, stages }: { milestones: Milestone[]; stages: string[] }) {
  return (
    <div className="flex items-start gap-2 flex-wrap">
      {milestones.map((m, i) => {
        const done = isMilestoneDone(m, stages)
        return (
          <div key={m.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-surface-border text-xs">--</span>}
            <div className="flex flex-col items-center gap-1">
              <span
                className={`w-4 h-4 rounded-full border-2 inline-block ${
                  done ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                }`}
              />
              <span className="text-text-muted text-[9px] leading-tight text-center whitespace-nowrap">
                {m.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DisciplineCard({ disc }: { disc: DisciplineSummary }) {
  const milestones = MILESTONES[disc.key] ?? []
  const lastIdx = getLastDoneIdx(milestones, disc.completedStages)
  const nextStep = nextStepText(lastIdx)
  const hours = Math.round((disc.totalMinutes / 60) * 10) / 10

  return (
    <div className="px-8 py-6 border-b border-surface-border last:border-b-0">
      <h3 className="text-text-primary font-bold text-base mb-4">{disc.label}</h3>

      <div className="grid grid-cols-3 gap-6 mb-4 md:grid-cols-1">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Skill Level</p>
          <p className={`text-sm ${skillLabelClass(disc.skillLevel)}`}>
            {formatSkillLevel(disc.skillLevel)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Next Step</p>
          <p className="text-text-secondary text-sm">{nextStep}</p>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="mb-4">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Progress Path</p>
          <MilestonePath milestones={milestones} stages={disc.completedStages} />
        </div>
      )}

      {(disc.totalSessions > 0 || disc.totalMinutes > 0) && (
        <div className="flex gap-6">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wide mb-0.5">Sessions</p>
            <p className="text-text-primary font-semibold text-sm">{disc.totalSessions}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wide mb-0.5">Hours</p>
            <p className="text-text-primary font-semibold text-sm">{hours}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const DISC_LABEL: Record<string, string> = {
  piano: 'Piano',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
  guitar: 'Guitar',
  voice: 'Voice and Singing',
}

export default function SkillSummaryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    Promise.all([fetchProgressSummary(), fetchPortfolio()])
      .then(([sumRes, portRes]) => {
        setSummary(sumRes.data)
        setPortfolio(portRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user) return null

  const disciplines = summary?.disciplines ?? []
  const totalHours = Math.round(
    (disciplines.reduce((s, d) => s + d.totalMinutes, 0) / 60) * 10
  ) / 10
  const disciplinesPracticed = disciplines.length
  const levelsCompleted = summary?.totalLevelsCompleted ?? 0
  const activeSince = summary?.activeSince
    ? new Date(summary.activeSince).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Not yet'

  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const recentPortfolio = portfolio.slice(0, 3)

  return (
    <MainLayout background="bg-[#F9F7F4]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {/* Print button */}
        <div className="flex justify-end mb-6 no-print">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Download / Print Summary
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-6">

          {/* Header */}
          <div className="bg-[#0E1117] px-8 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DC</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Digital Creative Infrastructure Platform</p>
                <p className="text-sm text-white/70">Skill Development Report</p>
              </div>
            </div>
            <h1 className="text-white font-bold text-2xl">Skill Development Summary</h1>
          </div>

          {/* Student info */}
          <div className="px-8 py-6 border-b border-surface-border">
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Student</p>
                <p className="text-text-primary font-semibold">{user.fullName}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">School</p>
                <p className="text-text-primary font-semibold">
                  {user.school?.name ?? ''}
                  {user.school?.district ? `, ${user.school.district}` : ''}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Date Generated</p>
                <p className="text-text-primary font-semibold">{today}</p>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="px-8 py-6 border-b border-surface-border">
            <h2 className="text-text-primary font-bold text-base mb-4">Summary</h2>
            <div className="grid grid-cols-4 gap-4 md:grid-cols-2">
              {[
                { label: 'Practice Hours', value: `${totalHours}h` },
                { label: 'Disciplines', value: disciplinesPracticed },
                { label: 'Levels Completed', value: levelsCompleted },
                { label: 'Active Since', value: activeSince },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F9F7F4] rounded-xl p-4">
                  <p className="text-text-muted text-xs mb-1">{label}</p>
                  <p className="text-text-primary font-bold text-lg">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-discipline sections */}
          {loading ? (
            <div className="px-8 py-8 text-text-secondary text-sm">Loading...</div>
          ) : disciplines.length === 0 ? (
            <div className="px-8 py-8 text-center">
              <p className="text-text-secondary text-sm">No activity recorded yet.</p>
            </div>
          ) : (
            disciplines.map(disc => <DisciplineCard key={disc.key} disc={disc} />)
          )}

          {/* Portfolio highlights */}
          {recentPortfolio.length > 0 && (
            <div className="px-8 py-6 border-t border-surface-border">
              <h2 className="text-text-primary font-bold text-base mb-4">Recent Portfolio Work</h2>
              <div className="space-y-2">
                {recentPortfolio.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 py-2">
                    <div>
                      <p className="text-text-primary font-medium text-sm">{item.title}</p>
                      <p className="text-text-secondary text-xs">
                        {DISC_LABEL[item.discipline] ?? item.discipline}
                        {' '}
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-[#F9F7F4] px-8 py-4 border-t border-surface-border">
            <p className="text-text-muted text-xs text-center">
              Generated by Digital Creative Infrastructure Platform
            </p>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
