import { useEffect, useRef, useState } from 'react'
import TopNav from '../../components/TopNav'
import { getSupervisorActiveSessions, getSupervisorProgress } from '../../services/api'

interface ActiveSession {
  _id: string
  user: { username: string; fullName: string }
  discipline: string
  durationMinutes: number
  createdAt: string
}

interface StudentProgress {
  id: string
  username: string
  fullName: string
  discipline: string | null
  sessions: number
  portfolioItems: number
}

const disciplineLabel = (d: string | null) => {
  if (d === 'music') return 'Music'
  if (d === 'visual-arts') return 'Visual Arts'
  if (d === 'graphic-design') return 'Graphic Design'
  return d ?? 'N/A'
}

export default function SupervisorDashboardPage() {
  const [labActive, setLabActive] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('dcip-lab-session') ?? 'null')?.active === true
    } catch {
      return false
    }
  })
  const [labStartedAt, setLabStartedAt] = useState<Date | null>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('dcip-lab-session') ?? 'null')
      return raw?.startedAt ? new Date(raw.startedAt) : null
    } catch {
      return null
    }
  })

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [progress, setProgress] = useState<StudentProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSessions = async () => {
    try {
      const res = await getSupervisorActiveSessions()
      setActiveSessions(res.data)
    } catch {
      // network errors are non-critical here
    }
  }

  useEffect(() => {
    fetchSessions()
    getSupervisorProgress()
      .then((res) => setProgress(res.data))
      .catch(() => {})
      .finally(() => setProgressLoading(false))

    refreshRef.current = setInterval(fetchSessions, 30_000)
    clockRef.current = setInterval(() => setNow(new Date()), 1_000)

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
      if (clockRef.current) clearInterval(clockRef.current)
    }
  }, [])

  const openLab = () => {
    const startedAt = new Date()
    localStorage.setItem('dcip-lab-session', JSON.stringify({ active: true, startedAt: startedAt.toISOString() }))
    setLabActive(true)
    setLabStartedAt(startedAt)
  }

  const closeLab = () => {
    localStorage.removeItem('dcip-lab-session')
    setLabActive(false)
    setLabStartedAt(null)
  }

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const totalSessions = progress.reduce((sum, s) => sum + s.sessions, 0)

  const topDiscipline = (() => {
    const counts: Record<string, number> = {}
    progress.forEach((s) => {
      if (s.discipline) counts[s.discipline] = (counts[s.discipline] ?? 0) + s.sessions
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  })()

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Section 1 — Lab Session */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="text-text-primary font-bold text-lg mb-1">Laboratory Session</h2>
          <p className="text-text-secondary text-sm mb-5">
            {fmtDate(now)}, {fmtTime(now)}
          </p>

          {labActive ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-status-synced animate-pulse block" />
                <span className="text-text-primary font-semibold text-sm">Session Open</span>
              </div>
              {labStartedAt && (
                <p className="text-text-secondary text-sm">Opened at {fmtTime(labStartedAt)}</p>
              )}
              <button
                onClick={closeLab}
                className="border border-accent text-accent text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Close Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 block" />
                <span className="text-text-secondary font-medium text-sm">Session Closed</span>
              </div>
              <button
                onClick={openLab}
                className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
              >
                Open Lab Session
              </button>
            </div>
          )}
        </section>

        {/* Section 2 — Recent Activity */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="text-text-primary font-bold text-lg mb-1">Recent Activity</h2>
          <p className="text-text-secondary text-xs mb-5">Sessions saved in the last 2 hours · refreshes every 30 s</p>

          {activeSessions.length === 0 ? (
            <p className="text-text-secondary text-sm">No activity in the last 2 hours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Student</th>
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Discipline</th>
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Duration</th>
                    <th className="text-left text-text-secondary font-medium pb-3">Saved at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeSessions.map((session) => (
                    <tr key={session._id}>
                      <td className="py-3 pr-6 text-text-primary">{session.user.fullName}</td>
                      <td className="py-3 pr-6 text-text-secondary">{disciplineLabel(session.discipline)}</td>
                      <td className="py-3 pr-6 text-text-secondary">{session.durationMinutes} min</td>
                      <td className="py-3 text-text-secondary">
                        {new Date(session.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 3 — Progress Summary */}
        <section className="bg-white border border-border rounded-2xl p-6">
          <h2 className="text-text-primary font-bold text-lg mb-5">School Progress Summary</h2>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-bg-page rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Total Students</p>
              <p className="text-text-primary font-bold text-2xl">{progress.length}</p>
            </div>
            <div className="bg-bg-page rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Total Sessions</p>
              <p className="text-text-primary font-bold text-2xl">{totalSessions}</p>
            </div>
            <div className="bg-bg-page rounded-xl p-4">
              <p className="text-text-secondary text-xs mb-1">Top Discipline</p>
              <p className="text-text-primary font-bold text-xl">{disciplineLabel(topDiscipline)}</p>
            </div>
          </div>

          {progressLoading ? (
            <p className="text-text-secondary text-sm">Loading...</p>
          ) : progress.length === 0 ? (
            <p className="text-text-secondary text-sm">No students registered at this school yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Student</th>
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Username</th>
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Discipline</th>
                    <th className="text-left text-text-secondary font-medium pb-3 pr-6">Sessions</th>
                    <th className="text-left text-text-secondary font-medium pb-3">Portfolio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {progress.map((student) => (
                    <tr key={student.id}>
                      <td className="py-3 pr-6 text-text-primary">{student.fullName}</td>
                      <td className="py-3 pr-6 text-text-secondary">{student.username}</td>
                      <td className="py-3 pr-6 text-text-secondary">{disciplineLabel(student.discipline)}</td>
                      <td className="py-3 pr-6 text-text-primary font-medium">{student.sessions}</td>
                      <td className="py-3 text-text-primary font-medium">{student.portfolioItems}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
