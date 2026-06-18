import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { fetchStats, fetchProgress, fetchAnalytics } from '../services/api'
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
}

interface Analytics {
  weeklyActivity: { week: string; sessions: number; minutes: number }[]
  disciplineBreakdown: { discipline: string; sessions: number; percentage: number }[]
  sessionQuality: { short: number; standard: number; deep: number }
}

const DISC_COLORS: Record<string, string> = {
  music: '#C8960C',
  'visual-arts': '#2D6A4F',
  'graphic-design': '#3B82F6',
}


const DISC_LABEL: Record<string, string> = {
  music: 'Music',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
}

function LevelDots({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <span className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`text-base ${i < current ? 'text-primary' : 'text-gray-300'}`}>
          ●
        </span>
      ))}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0 })
  const [progress, setProgress] = useState<ProgressDoc[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    Promise.all([fetchStats(), fetchProgress(), fetchAnalytics()])
      .then(([statsRes, progressRes, analyticsRes]) => {
        setStats(statsRes.data)
        setProgress(progressRes.data)
        setAnalytics(analyticsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const totalHours = Math.round((stats.totalMinutes / 60) * 10) / 10
  const levelsCompleted = progress.reduce((sum, p) => sum + p.levelBadges.length, 0)
  const maxStreak = progress.reduce((max, p) => Math.max(max, p.streakDays), 0)

  const qualityTotal =
    (analytics?.sessionQuality.short ?? 0) +
    (analytics?.sessionQuality.standard ?? 0) +
    (analytics?.sessionQuality.deep ?? 0) || 1

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-text-primary font-bold text-2xl">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {user.school?.name}{user.school?.district ? ` · ${user.school.district}` : ''}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8 md:grid-cols-1 lg:grid-cols-3">
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Total Practice</p>
            <p className="text-primary font-bold text-3xl">
              {totalHours}<span className="text-base font-normal text-text-secondary ml-1">hrs</span>
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Current Streak</p>
            <p className="text-primary font-bold text-3xl">
              {maxStreak}<span className="text-base font-normal text-text-secondary ml-1">days</span>
            </p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Levels Completed</p>
            <p className="text-primary font-bold text-3xl">{levelsCompleted}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 lg:grid-cols-1">

          {/* Left — charts (2/3 width) */}
          <div className="col-span-2 space-y-6 lg:col-span-1">

            {/* Weekly bar chart */}
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-text-primary font-bold text-base mb-4">Weekly Practice Activity</h2>
              {loading ? (
                <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics?.weeklyActivity ?? []} barGap={4}>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: '#888888' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#888888' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E8E4DC', borderRadius: 8, fontSize: 12 }}
                      formatter={(value, name) =>
                        name === 'minutes'
                          ? [`${Number(value)} min`, 'Minutes' as string]
                          : [Number(value), 'Sessions' as string]
                      }
                    />
                    <Bar dataKey="sessions" fill="#C8960C" radius={[4, 4, 0, 0]} name="sessions" />
                    <Bar dataKey="minutes" fill="#2D6A4F" radius={[4, 4, 0, 0]} name="minutes" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie + session quality side by side */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
              <div className="bg-white border border-border rounded-2xl p-6">
                <h2 className="text-text-primary font-bold text-base mb-4">Time by Discipline</h2>
                {loading || !analytics?.disciplineBreakdown.length ? (
                  <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analytics.disciplineBreakdown}
                        dataKey="sessions"
                        nameKey="discipline"
                        cx="50%"
                        cy="45%"
                        outerRadius={70}
                        label={({ percent }) =>
                          percent !== undefined ? `${Math.round(percent * 100)}%` : ''
                        }
                        labelLine={false}
                      >
                        {analytics.disciplineBreakdown.map((entry) => (
                          <Cell
                            key={entry.discipline}
                            fill={DISC_COLORS[entry.discipline] ?? '#888888'}
                          />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value: string) => DISC_LABEL[value] ?? value}
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Session quality */}
              <div className="bg-white border border-border rounded-2xl p-6">
                <h2 className="text-text-primary font-bold text-base mb-4">Session Quality</h2>
                {loading ? (
                  <p className="text-text-secondary text-sm">Loading...</p>
                ) : (
                  <div className="space-y-5 mt-2">
                    {([
                      { label: 'Short (under 10 min)', key: 'short', color: 'bg-gray-300' },
                      { label: 'Standard (10-30 min)', key: 'standard', color: 'bg-primary' },
                      { label: 'Deep (over 30 min)', key: 'deep', color: 'bg-secondary' },
                    ] as { label: string; key: keyof Analytics['sessionQuality']; color: string }[]).map(
                      ({ label, key, color }) => {
                        const count = analytics?.sessionQuality[key] ?? 0
                        const pct = Math.round((count / qualityTotal) * 100)
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                              <span>{label}</span>
                              <span className="font-medium text-text-primary">{count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`${color} h-2 rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — quick actions + level progress cards */}
          <div className="col-span-1 space-y-4 lg:col-span-1">

            {/* Quick actions */}
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

            {/* Level progress per discipline */}
            {loading ? (
              <div className="bg-white border border-border rounded-2xl p-6">
                <p className="text-text-secondary text-sm">Loading progress...</p>
              </div>
            ) : progress.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-6 text-center">
                <p className="text-text-primary font-semibold text-sm mb-1">No sessions yet</p>
                <p className="text-text-secondary text-xs">
                  Complete a session to start tracking your progress.
                </p>
              </div>
            ) : (
              progress.map((p) => {
                const pct = Math.round((p.sessionsAtCurrentLevel / 5) * 100)
                const nextLevel = Math.min(p.currentLevel + 1, 5)
                return (
                  <div key={p.discipline} className="bg-white border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-semibold text-sm">
                          {DISC_LABEL[p.discipline] ?? p.discipline}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">{p.skillLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <LevelDots current={p.currentLevel} />
                      <span className="text-xs text-text-muted">Level {p.currentLevel}/5</span>
                    </div>

                    {p.currentLevel < 5 && (
                      <>
                        <p className="text-xs text-text-secondary mb-1.5">
                          {p.sessionsAtCurrentLevel} / 5 sessions to Level {nextLevel}
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    )}

                    {p.levelBadges.length > 0 && (
                      <div className="flex gap-1 mb-3">
                        {p.levelBadges.map((b) => (
                          <span
                            key={b.level}
                            className="text-primary text-sm"
                            title={`Level ${b.level} badge`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/session/${p.discipline}`)}
                      className="w-full border border-primary text-primary text-xs font-semibold py-2 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Continue →
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
