import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchProgress, fetchPortfolio } from '../services/api'
import TopNav from '../components/TopNav'

interface ProgressDoc {
  discipline: string
  currentLevel: number
  sessionsAtCurrentLevel: number
  totalSessions: number
  totalMinutes: number
  levelBadges: { level: number; discipline: string; earnedAt: string }[]
  streakDays: number
  skillLabel: string
  createdAt: string
}

interface PortfolioItem {
  _id: string
  discipline: string
  title: string
  createdAt: string
  fileType: string
}

const DISC_LABEL: Record<string, string> = {
  music: 'Music',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
}


function LevelCircles({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <span className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-4 h-4 rounded-full border-2 inline-block ${
            i < current
              ? 'bg-primary border-primary'
              : 'bg-white border-gray-300'
          }`}
        />
      ))}
    </span>
  )
}

export default function SkillSummaryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [progress, setProgress] = useState<ProgressDoc[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    Promise.all([fetchProgress(), fetchPortfolio()])
      .then(([progRes, portRes]) => {
        setProgress(progRes.data)
        setPortfolio(portRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const totalHours = Math.round(
    (progress.reduce((sum, p) => sum + p.totalMinutes, 0) / 60) * 10
  ) / 10

  const disciplinesPracticed = progress.length
  const levelsCompleted = progress.reduce((sum, p) => sum + p.levelBadges.length, 0)
  const activeSince = progress.length > 0
    ? new Date(
        Math.min(...progress.map((p) => new Date(p.createdAt).getTime()))
      ).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const recentPortfolio = portfolio.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <div className="no-print">
        <TopNav />
      </div>

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
        <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">

          {/* Header */}
          <div className="bg-[#0E1117] px-8 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DC</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Digital Creative Infrastructure Platform</p>
                <p className="text-white/60 text-xs">Digital Creative Infrastructure Platform</p>
              </div>
            </div>
            <h1 className="text-white font-bold text-2xl">Skill Development Summary</h1>
          </div>

          {/* Student info */}
          <div className="px-8 py-6 border-b border-border">
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Student</p>
                <p className="text-text-primary font-semibold">{user.fullName}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">School</p>
                <p className="text-text-primary font-semibold">
                  {user.school?.name ?? 'N/A'}
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
          <div className="px-8 py-6 border-b border-border">
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
          ) : progress.length === 0 ? (
            <div className="px-8 py-8 text-center">
              <p className="text-text-secondary text-sm">No sessions completed yet.</p>
            </div>
          ) : (
            progress.map((p) => (
              <div key={p.discipline} className="px-8 py-6 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-text-primary font-bold text-base">
                    {DISC_LABEL[p.discipline] ?? p.discipline}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-4 md:grid-cols-1">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Skill Label</p>
                    <p className="text-text-primary font-semibold text-sm">{p.skillLabel}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Level Reached</p>
                    <div className="flex items-center gap-2 mt-1">
                      <LevelCircles current={p.currentLevel} />
                      <span className="text-text-secondary text-xs">{p.currentLevel}/5</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Sessions</p>
                      <p className="text-text-primary font-bold text-lg">{p.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Hours</p>
                      <p className="text-text-primary font-bold text-lg">
                        {Math.round(p.totalMinutes / 60 * 10) / 10}
                      </p>
                    </div>
                  </div>
                </div>

                {p.levelBadges.length > 0 && (
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Badges Earned</p>
                    <div className="flex flex-wrap gap-2">
                      {p.levelBadges.map((b) => (
                        <span
                          key={b.level}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full"
                        >
                          ★ Level {b.level} Complete
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Portfolio highlights */}
          {recentPortfolio.length > 0 && (
            <div className="px-8 py-6 border-t border-border">
              <h2 className="text-text-primary font-bold text-base mb-4">Recent Portfolio Work</h2>
              <div className="space-y-2">
                {recentPortfolio.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 py-2">
                    <div>
                      <p className="text-text-primary font-medium text-sm">{item.title}</p>
                      <p className="text-text-secondary text-xs">
                        {DISC_LABEL[item.discipline] ?? item.discipline} ·{' '}
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
          <div className="bg-[#F9F7F4] px-8 py-4 border-t border-border">
            <p className="text-text-muted text-xs text-center">
              Generated by Digital Creative Infrastructure Platform
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
