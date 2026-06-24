import { useEffect, useState } from 'react'
import { getAdminReports } from '../../services/api'
import AdminLayout from '../../components/AdminLayout'

interface DisciplineCount {
  _id: string
  count: number
}

interface Reports {
  totalStudents: number
  totalSessions: number
  totalPortfolioItems: number
  activeSchools: number
  sessionsByDiscipline: DisciplineCount[]
}

const MUSIC_SUBS = ['piano', 'guitar', 'voice', 'music-piano', 'music-guitar', 'music-voice']
const toCanonical = (d: string) => d.replace(/^music-/, '')

const SUB_LABEL: Record<string, string> = { piano: 'Piano', guitar: 'Guitar', voice: 'Voice & Singing' }
const TOP_LABEL: Record<string, string> = { music: 'Music', 'visual-arts': 'Visual Arts', 'graphic-design': 'Graphic Design' }

const QUICK = [
  { value: '1m', label: 'Last Month' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function quickToRange(period: string): { startDate?: string; endDate?: string } {
  if (period === 'all') return {}
  const now = new Date()
  if (period === '1m') {
    // Previous complete calendar month (e.g. May 1–31 when today is June)
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
  const start = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
  return { startDate: start.toISOString() }
}

function monthToRange(ym: string): { startDate: string; endDate: string } {
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59, 999)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

function periodLabel(mode: 'quick' | 'month', period: string, month: string): string {
  if (mode === 'month' && month) {
    const [y, m] = month.split('-').map(Number)
    return `${MONTH_NAMES[m - 1]} ${y}`
  }
  return QUICK.find(q => q.value === period)?.label ?? 'All Time'
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'quick' | 'month'>('quick')
  const [period, setPeriod] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const getParams = () =>
    mode === 'month' ? monthToRange(selectedMonth) : quickToRange(period)

  useEffect(() => {
    setLoading(true)
    const params = getParams()
    getAdminReports(Object.keys(params).length ? params : undefined)
      .then(res => setReports(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [mode, period, selectedMonth])

  const buildRows = (sessionsByDiscipline: DisciplineCount[]) => {
    const topMap = new Map<string, number>()
    const subMap = new Map<string, number>()
    sessionsByDiscipline.forEach(({ _id, count }) => {
      if (MUSIC_SUBS.includes(_id)) {
        const canonical = toCanonical(_id)
        subMap.set(canonical, (subMap.get(canonical) ?? 0) + count)
      } else {
        topMap.set(_id, (topMap.get(_id) ?? 0) + count)
      }
    })
    const musicSubTotal = [...subMap.values()].reduce((s, c) => s + c, 0)
    const musicTop = (topMap.get('music') ?? 0) + musicSubTotal
    if (musicTop > 0) topMap.set('music', musicTop)
    const rows = [...topMap.entries()].filter(([k]) => k !== 'music' || musicTop > 0).sort(([, a], [, b]) => b - a)
    return { rows, subMap, musicTotal: musicTop }
  }

  const downloadCSV = () => {
    if (!reports) return
    const label = periodLabel(mode, period, selectedMonth)
    const date = new Date().toLocaleDateString('en-GB')
    const { rows, subMap } = buildRows(reports.sessionsByDiscipline)

    const lines: string[][] = [
      ['DCIP Programme Report'],
      ['Period', label],
      ['Generated', date],
      [],
      ['SUMMARY'],
      ['Active Students', String(reports.totalStudents)],
      ['Total Practice Sessions', String(reports.totalSessions)],
      ['Portfolio Items Submitted', String(reports.totalPortfolioItems)],
      ['Active Schools', String(reports.activeSchools)],
      [],
      ['SESSIONS BY DISCIPLINE', 'Sessions', '% of Total'],
    ]

    const total = reports.totalSessions
    rows.forEach(([disc, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0
      lines.push([TOP_LABEL[disc] ?? disc, String(count), `${pct}%`])
      if (disc === 'music') {
        MUSIC_SUBS.filter(s => subMap.has(s)).forEach(s => {
          const sc = subMap.get(s) ?? 0
          const sp = count > 0 ? Math.round((sc / count) * 100) : 0
          lines.push([`  › ${SUB_LABEL[s] ?? s}`, String(sc), `${sp}% of Music`])
        })
      }
    })

    const csv = lines.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DCIP-Report-${label.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = reports?.totalSessions ?? 0
  const { rows, subMap, musicTotal } = reports
    ? buildRows(reports.sessionsByDiscipline)
    : { rows: [], subMap: new Map<string, number>(), musicTotal: 0 }

  const label = periodLabel(mode, period, selectedMonth)

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-text-primary font-bold text-2xl mb-1">Reports</h1>
            <p className="text-text-secondary text-sm">
              Showing data for: <span className="font-semibold text-primary">{label}</span>
            </p>
          </div>
          <button
            onClick={downloadCSV}
            disabled={loading || !reports}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download CSV
          </button>
        </div>

        {/* Filter row */}
        <div className="bg-white border border-surface-border rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-surface-border overflow-hidden text-xs font-semibold shrink-0">
              <button
                onClick={() => setMode('quick')}
                className={`px-3 py-1.5 transition-colors ${mode === 'quick' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                Quick
              </button>
              <button
                onClick={() => setMode('month')}
                className={`px-3 py-1.5 border-l border-surface-border transition-colors ${mode === 'month' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                Specific Month
              </button>
            </div>

            {mode === 'quick' ? (
              <div className="flex items-center gap-2 flex-wrap">
                {QUICK.map(q => (
                  <button
                    key={q.value}
                    onClick={() => setPeriod(q.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      period === q.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-surface-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            ) : (() => {
              const selYear = parseInt(selectedMonth.split('-')[0], 10)
              const selMonthNum = parseInt(selectedMonth.split('-')[1], 10)
              const thisYear = new Date().getFullYear()
              const thisMonthNum = new Date().getMonth() + 1
              const yearOptions = Array.from({ length: thisYear - 2022 }, (_, i) => 2023 + i)
              return (
                <div className="flex items-center gap-2">
                  <select
                    value={selYear}
                    onChange={e => {
                      const y = parseInt(e.target.value, 10)
                      const m = y === thisYear && selMonthNum > thisMonthNum ? thisMonthNum : selMonthNum
                      setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`)
                    }}
                    className="border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    value={selMonthNum}
                    onChange={e => setSelectedMonth(`${selYear}-${String(e.target.value).padStart(2, '0')}`)}
                    className="border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i} value={i + 1} disabled={selYear === thisYear && i + 1 > thisMonthNum}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })()}
          </div>
        </div>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {([
                ['Active Students', reports?.totalStudents, 'Current registered students'],
                ['Practice Sessions', reports?.totalSessions, `Sessions in ${label}`],
                ['Portfolio Items', reports?.totalPortfolioItems, `Submitted in ${label}`],
                ['Active Schools', reports?.activeSchools, 'Currently active'],
              ] as [string, number | undefined, string][]).map(([lbl, value, sub]) => (
                <div key={lbl} className="bg-white border border-surface-border rounded-2xl p-6">
                  <p className="text-text-secondary text-xs mb-1">{lbl}</p>
                  <p className="text-text-primary font-bold text-3xl mb-1">{value ?? '—'}</p>
                  <p className="text-text-muted text-xs">{sub}</p>
                </div>
              ))}
            </div>

            {/* Sessions by discipline */}
            <div className="bg-white border border-surface-border rounded-2xl p-6">
              <h2 className="text-text-primary font-semibold mb-5">
                Practice Sessions by Discipline
                <span className="text-text-muted font-normal text-sm ml-2">— {label}</span>
              </h2>
              {rows.length === 0 ? (
                <p className="text-text-secondary text-sm">No sessions recorded in this period.</p>
              ) : (
                <div className="space-y-4">
                  {rows.map(([disc, count]) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    const isMusic = disc === 'music'
                    const subs = isMusic
                      ? MUSIC_SUBS.filter(s => subMap.has(s)).map(s => ({ key: s, count: subMap.get(s)! }))
                      : []
                    return (
                      <div key={disc}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-text-secondary text-sm w-36 shrink-0">{TOP_LABEL[disc] ?? disc}</span>
                          <div className="flex-1 h-2 bg-surface-warm rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-text-primary text-sm font-medium w-36 text-right shrink-0">
                            {count} session{count !== 1 ? 's' : ''} · {pct}% of total
                          </span>
                        </div>
                        {subs.length > 0 && (
                          <div className="ml-6 mt-2 space-y-1.5">
                            {subs.map(({ key, count: sc }) => {
                              const sp = musicTotal > 0 ? Math.round((sc / musicTotal) * 100) : 0
                              return (
                                <div key={key} className="flex items-center justify-between gap-4">
                                  <span className="text-text-muted text-xs w-32 shrink-0">{SUB_LABEL[key]}</span>
                                  <div className="flex-1 h-1.5 bg-surface-warm rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/50 rounded-full transition-all duration-500" style={{ width: `${sp}%` }} />
                                  </div>
                                  <span className="text-text-secondary text-xs w-36 text-right shrink-0">
                                    {sc} session{sc !== 1 ? 's' : ''} · {sp}% of Music
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AdminLayout>
  )
}
