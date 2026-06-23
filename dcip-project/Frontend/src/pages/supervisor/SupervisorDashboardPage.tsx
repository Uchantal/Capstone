import { useEffect, useRef, useState } from 'react'
import MainLayout from '../../components/MainLayout'
import {
  getSupervisorLiveActivity,
  getSupervisorSchoolAnalytics,
  getSessionStatus,
  openLabSession,
  closeLabSession,
} from '../../services/api'

interface LiveSession {
  _id: string
  studentName: string
  discipline: string
  durationMinutes: number
  createdAt: string
  currentLevel: number
  skillLabel: string
}

interface DisciplineStat {
  discipline: string
  studentCount: number
  totalSessions: number
  avgLevel: number
}

interface StudentRow {
  id: string
  name: string
  discipline: string
  currentLevel: number
  skillLabel: string
  totalSessions: number
  lastActive: string | null
  status: 'Active' | 'Inactive' | 'Dormant'
}

interface SchoolAnalytics {
  totalStudents: number
  activeThisWeek: number
  totalPracticeHours: number
  avgSessionsPerStudent: number
  disciplineStats: DisciplineStat[]
  studentProgress: StudentRow[]
}


const DISC_LABEL: Record<string, string> = {
  music: 'Music',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
}

const DISC_BORDER: Record<string, string> = {
  music: 'border-t-primary',
  'visual-arts': 'border-t-secondary',
  'graphic-design': 'border-t-surface-border',
}

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-secondary/10 text-secondary',
  Inactive: 'bg-surface-warm text-text-secondary',
  Dormant: 'bg-accent/10 text-accent',
}

export default function SupervisorDashboardPage() {
  const [labActive, setLabActive] = useState<boolean>(false)
  const [labStartedAt, setLabStartedAt] = useState<Date | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionSaving, setSessionSaving] = useState(false)

  const [liveActivity, setLiveActivity] = useState<LiveSession[]>([])
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [studentFilter, setStudentFilter] = useState('')
  const [now, setNow] = useState(new Date())

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLive = async () => {
    try {
      const res = await getSupervisorLiveActivity()
      setLiveActivity(res.data)
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    getSessionStatus()
      .then((res) => {
        setLabActive(res.data.isOpen)
        setLabStartedAt(res.data.openedAt ? new Date(res.data.openedAt) : null)
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false))

    fetchLive()
    getSupervisorSchoolAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false))

    refreshRef.current = setInterval(fetchLive, 30_000)
    clockRef.current = setInterval(() => setNow(new Date()), 1_000)

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
      if (clockRef.current) clearInterval(clockRef.current)
    }
  }, [])

  const openLab = async () => {
    setSessionSaving(true)
    try {
      const res = await openLabSession()
      setLabActive(res.data.isOpen)
      setLabStartedAt(res.data.openedAt ? new Date(res.data.openedAt) : null)
    } catch {
      // non-critical; UI stays unchanged
    } finally {
      setSessionSaving(false)
    }
  }

  const closeLab = async () => {
    setSessionSaving(true)
    try {
      await closeLabSession()
      setLabActive(false)
      setLabStartedAt(null)
    } catch {
      // non-critical
    } finally {
      setSessionSaving(false)
    }
  }

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const fmtRelative = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff} days ago`
  }

  const filteredStudents = (analytics?.studentProgress ?? []).filter((s) =>
    studentFilter === '' || s.name.toLowerCase().includes(studentFilter.toLowerCase())
  )

  return (
    <MainLayout>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Section 1: Lab Session Control */}
        <section className="bg-white border border-surface-border rounded-2xl p-6">
          <h2 className="text-text-primary font-bold text-lg mb-1">Laboratory Session</h2>
          <p className="text-text-secondary text-sm mb-5">
            {fmtDate(now)}, {fmtTime(now)}
          </p>

          {sessionLoading ? (
            <div className="h-10 flex items-center">
              <span className="text-text-muted text-sm">Loading session status...</span>
            </div>
          ) : labActive ? (
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
                disabled={sessionSaving}
                className="border border-accent text-accent text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sessionSaving ? 'Closing...' : 'Close Session'}
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
                disabled={sessionSaving}
                className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sessionSaving ? 'Opening...' : 'Open Lab Session'}
              </button>
            </div>
          )}
        </section>

        {/* Section 2: Live Activity Feed */}
        <section className="bg-white border border-surface-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-text-primary font-bold text-lg">Live Student Activity</h2>
            <span className="text-text-muted text-xs">Refreshes every 30 s</span>
          </div>
          <p className="text-text-secondary text-xs mb-5">Sessions saved in the last 2 hours</p>

          {liveActivity.length === 0 ? (
            <p className="text-text-secondary text-sm">No active sessions in the last 2 hours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-[#F9F7F4] border-b border-surface-border">
                  <tr>
                    <th className="text-left text-text-muted font-medium px-4 py-3 uppercase text-xs tracking-wide">Student</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3 uppercase text-xs tracking-wide">Discipline</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3 uppercase text-xs tracking-wide">Level</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3 uppercase text-xs tracking-wide">Duration</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3 uppercase text-xs tracking-wide">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {liveActivity.map((s) => (
                    <tr key={s._id}>
                      <td className="px-4 py-3 text-text-primary font-medium">{s.studentName}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {DISC_LABEL[s.discipline] ?? s.discipline}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        Level {s.currentLevel}: {s.skillLabel}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{s.durationMinutes} min</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {new Date(s.createdAt).toLocaleTimeString('en-GB', {
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

        {/* Section 3: School Progress Analytics */}
        <section className="space-y-6">
          <h2 className="text-text-primary font-bold text-lg">School Progress Analytics</h2>

          {/* Row 1: Stat cards */}
          <div className="grid grid-cols-4 gap-4 md:grid-cols-2">
            {analyticsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-surface-border rounded-2xl p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded mb-2 w-2/3" />
                  <div className="h-8 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : (
              [
                { label: 'Registered Students', value: analytics?.totalStudents ?? 0 },
                { label: 'Active This Week', value: analytics?.activeThisWeek ?? 0 },
                { label: 'Total Practice Hours', value: `${analytics?.totalPracticeHours ?? 0}h` },
                { label: 'Avg Sessions / Student', value: analytics?.avgSessionsPerStudent ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-surface-border rounded-2xl p-5">
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-text-primary font-bold text-2xl">{value}</p>
                </div>
              ))
            )}
          </div>

          {/* Row 2: Discipline Distribution */}
          <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
            {['music', 'visual-arts', 'graphic-design'].map((disc) => {
              const stat = analytics?.disciplineStats.find((d) => d.discipline === disc)
              return (
                <div
                  key={disc}
                  className={`bg-white border border-surface-border border-t-4 ${DISC_BORDER[disc]} rounded-2xl p-5`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-text-primary font-semibold text-sm">{DISC_LABEL[disc]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-secondary text-xs">
                      <span className="font-medium text-text-primary">{stat?.studentCount ?? 0}</span> students
                    </p>
                    <p className="text-text-secondary text-xs">
                      <span className="font-medium text-text-primary">{stat?.totalSessions ?? 0}</span> sessions
                    </p>
                    <p className="text-text-secondary text-xs">
                      Avg level <span className="font-medium text-text-primary">{stat?.avgLevel ?? 1}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Row 3: Student Progress Table */}
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-wrap gap-3">
              <h3 className="text-text-primary font-bold text-base">Student Progress Overview</h3>
              <input
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Filter by name…"
                className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary w-48"
              />
            </div>

            {analyticsLoading ? (
              <p className="text-text-secondary text-sm px-6 py-6">Loading...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-text-secondary text-sm px-6 py-6">No students found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-[#F9F7F4] border-b border-surface-border">
                    <tr>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Student</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Discipline</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Level</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Skill</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Sessions</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Last Active</th>
                      <th className="text-left text-text-muted font-medium px-6 py-3 uppercase text-xs tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 text-text-primary font-medium">{s.name}</td>
                        <td className="px-6 py-4 text-text-secondary">
                          {DISC_LABEL[s.discipline] ?? s.discipline}
                        </td>
                        <td className="px-6 py-4 text-text-primary">{s.currentLevel}</td>
                        <td className="px-6 py-4 text-text-secondary">{s.skillLabel}</td>
                        <td className="px-6 py-4 text-text-primary">{s.totalSessions}</td>
                        <td className="px-6 py-4 text-text-secondary">{fmtRelative(s.lastActive)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[s.status] ?? ''}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </MainLayout>
  )
}
