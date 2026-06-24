import { useEffect, useState } from 'react'
import MainLayout from '../../components/MainLayout'
import { getSupervisorSchoolAnalytics } from '../../services/api'

interface SubDisciplineStat {
  discipline: string
  studentCount: number
  totalSessions: number
  avgLevel: number | null
}

interface DisciplineStat {
  discipline: string
  studentCount: number
  totalSessions: number
  avgLevel: number | null
  subDisciplines?: SubDisciplineStat[]
}

interface StudentRow {
  id: string
  name: string
  discipline: string
  subDiscipline: string | null
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
  piano: 'Piano',
  guitar: 'Guitar',
  voice: 'Voice & Singing',
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

const PERIODS = [
  { value: '1m', label: 'Last Month' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
]

export default function SupervisorDashboardPage() {
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [studentFilter, setStudentFilter] = useState('')
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    setAnalyticsLoading(true)
    getSupervisorSchoolAnalytics(period === 'all' ? undefined : period)
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false))
  }, [period])

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

  // ── Percentage helpers ──────────────────────────────────────────────────────

  // % of ALL registered students who were active this week
  const activePercent = analytics?.totalStudents
    ? Math.round((analytics.activeThisWeek / analytics.totalStudents) * 100)
    : 0

  // denominator = only students who have actually chosen a discipline
  // e.g. 5 Music + 15 VA + 10 GD = 30 → Music = 5/30 × 100 = 17%
  const totalWithDiscipline = (analytics?.disciplineStats ?? []).reduce(
    (sum, d) => sum + d.studentCount, 0
  )

  const discPercent = (count: number) =>
    totalWithDiscipline > 0
      ? Math.round((count / totalWithDiscipline) * 100)
      : 0

  // ── CSV report download ────────────────────────────────────────────────────
  const downloadReport = () => {
    if (!analytics) return

    const date = new Date().toLocaleDateString('en-GB')
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const rows: string[][] = [
      ['DCIP School Progress Report'],
      [`Generated: ${date} at ${time}`],
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Registered Students', String(analytics.totalStudents)],
      ['Active This Week', `${analytics.activeThisWeek} (${activePercent}%)`],
      ['Total Practice Hours', `${analytics.totalPracticeHours} h`],
      ['Avg Sessions per Student', String(analytics.avgSessionsPerStudent)],
      [],
      ['DISCIPLINE BREAKDOWN'],
      ['Discipline', 'Students', 'Share (%)', 'Sessions', 'Avg Level'],
      ...(['music', 'visual-arts', 'graphic-design'] as const).flatMap((disc) => {
        const stat = analytics.disciplineStats.find((d) => d.discipline === disc)
        const rows: string[][] = [
          [
            DISC_LABEL[disc],
            String(stat?.studentCount ?? 0),
            `${discPercent(stat?.studentCount ?? 0)}%`,
            String(stat?.totalSessions ?? 0),
            stat?.avgLevel != null ? String(stat.avgLevel) : '—',
          ],
        ]
        if (disc === 'music' && stat?.subDisciplines) {
          stat.subDisciplines.forEach((sd) => {
            rows.push([
              `  ${DISC_LABEL[sd.discipline]}`,
              String(sd.studentCount),
              stat.studentCount > 0
                ? `${Math.round((sd.studentCount / stat.studentCount) * 100)}%`
                : '0%',
              String(sd.totalSessions),
              sd.avgLevel != null ? String(sd.avgLevel) : '—',
            ])
          })
        }
        return rows
      }),
      [],
      ['STUDENT PROGRESS'],
      ['Name', 'Discipline', 'Level', 'Skill', 'Sessions', 'Last Active', 'Status'],
      ...analytics.studentProgress.map((s) => [
        s.name,
        s.discipline === 'music' && s.subDiscipline
          ? `Music › ${DISC_LABEL[s.subDiscipline] ?? s.subDiscipline}`
          : (DISC_LABEL[s.discipline] ?? s.discipline),
        String(s.currentLevel),
        s.skillLabel,
        String(s.totalSessions),
        fmtRelative(s.lastActive),
        s.status,
      ]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DCIP-School-Report-${date.replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* School Progress Analytics */}
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h2 className="text-text-primary font-bold text-lg">School Progress Analytics</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    period === p.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-text-secondary border-surface-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={downloadReport}
                disabled={analyticsLoading || !analytics}
                className="inline-flex items-center gap-2 border border-secondary text-secondary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>

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
                { label: 'Registered Students', value: analytics?.totalStudents ?? 0, sub: null },
                { label: 'Active This Week',    value: analytics?.activeThisWeek ?? 0, sub: `${activePercent}% of registered students` },
                { label: 'Total Hours',         value: `${analytics?.totalPracticeHours ?? 0} h`, sub: null },
                { label: 'Avg Sessions / Student', value: analytics?.avgSessionsPerStudent ?? 0, sub: null },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white border border-surface-border rounded-2xl p-5">
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-text-primary font-bold text-2xl">{value}</p>
                  {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
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
                  <p className="text-text-primary font-semibold text-sm mb-3">{DISC_LABEL[disc]}</p>
                  <div className="space-y-1 mb-4">
                    <p className="text-text-secondary text-xs">
                      <span className="font-medium text-text-primary">{stat?.studentCount ?? 0}</span> students
                    </p>
                    <p className="text-text-secondary text-xs">
                      <span className="font-medium text-text-primary">{stat?.totalSessions ?? 0}</span> sessions
                    </p>
                    {stat?.avgLevel != null && (
                      <p className="text-text-secondary text-xs">
                        Avg level <span className="font-medium text-text-primary">{stat.avgLevel}</span>
                      </p>
                    )}
                  </div>

                  {/* Sub-discipline breakdown for Music */}
                  {disc === 'music' && stat?.subDisciplines && (
                    <div className="border-t border-surface-border pt-3 mb-4 space-y-2">
                      {stat.subDisciplines.map((sd) => (
                        <div key={sd.discipline}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-text-secondary text-xs">{DISC_LABEL[sd.discipline]}</span>
                            <span className="text-text-primary text-xs font-medium">
                              {sd.studentCount} student{sd.studentCount !== 1 ? 's' : ''}
                              {sd.avgLevel != null ? ` · Lvl ${sd.avgLevel}` : ''}
                            </span>
                          </div>
                          <div className="h-1 bg-surface-warm rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all duration-500"
                              style={{
                                width: stat.studentCount > 0
                                  ? `${Math.round((sd.studentCount / stat.studentCount) * 100)}%`
                                  : '0%',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Share of all disciplined students */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-muted text-xs">Engagement</span>
                      <span className="text-text-primary text-xs font-semibold">
                        {discPercent(stat?.studentCount ?? 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${discPercent(stat?.studentCount ?? 0)}%` }}
                      />
                    </div>
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
                          {s.discipline === 'music' && s.subDiscipline
                            ? `Music › ${DISC_LABEL[s.subDiscipline] ?? s.subDiscipline}`
                            : (DISC_LABEL[s.discipline] ?? s.discipline)}
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
