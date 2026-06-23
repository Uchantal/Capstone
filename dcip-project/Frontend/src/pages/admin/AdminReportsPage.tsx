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

const MUSIC_SUBS = ['piano', 'guitar', 'voice']

const SUB_LABEL: Record<string, string> = {
  piano: 'Piano',
  guitar: 'Guitar',
  voice: 'Voice & Singing',
}

const TOP_LABEL: Record<string, string> = {
  music: 'Music',
  'visual-arts': 'Visual Arts',
  'graphic-design': 'Graphic Design',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminReports()
      .then((res) => setReports(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const buildRows = (sessionsByDiscipline: DisciplineCount[]) => {
    // Separate top-level disciplines from music sub-disciplines
    const topMap = new Map<string, number>()
    const subMap = new Map<string, number>()

    sessionsByDiscipline.forEach(({ _id, count }) => {
      if (MUSIC_SUBS.includes(_id)) {
        subMap.set(_id, count)
      } else {
        topMap.set(_id, count)
      }
    })

    const musicSubTotal = [...subMap.values()].reduce((s, c) => s + c, 0)
    const musicTop = (topMap.get('music') ?? 0) + musicSubTotal
    if (musicTop > 0) topMap.set('music', musicTop)

    // Build sorted top-level rows
    const rows = [...topMap.entries()]
      .filter(([key]) => key !== 'music' || musicTop > 0)
      .sort(([, a], [, b]) => b - a)

    return { rows, subMap, musicTotal: musicTop }
  }

  const total = reports?.totalSessions ?? 0
  const { rows, subMap, musicTotal } = reports
    ? buildRows(reports.sessionsByDiscipline)
    : { rows: [], subMap: new Map<string, number>(), musicTotal: 0 }

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 space-y-8">
        <div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Reports</h1>
          <p className="text-text-secondary text-sm">Programme statistics</p>
        </div>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {(
                [
                  ['Active Students', reports?.totalStudents],
                  ['Total Sessions', reports?.totalSessions],
                  ['Portfolio Items', reports?.totalPortfolioItems],
                  ['Active Schools', reports?.activeSchools],
                ] as [string, number | undefined][]
              ).map(([label, value]) => (
                <div key={label} className="bg-white border border-surface-border rounded-2xl p-6">
                  <p className="text-text-secondary text-xs mb-2">{label}</p>
                  <p className="text-text-primary font-bold text-3xl">{value ?? 'N/A'}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-surface-border rounded-2xl p-6">
              <h2 className="text-text-primary font-semibold mb-5">Sessions by Discipline</h2>
              {rows.length === 0 ? (
                <p className="text-text-secondary text-sm">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {rows.map(([disc, count]) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    const isMusic = disc === 'music'
                    const subs = isMusic
                      ? MUSIC_SUBS.filter((s) => subMap.has(s)).map((s) => ({ key: s, count: subMap.get(s)! }))
                      : []

                    return (
                      <div key={disc}>
                        {/* Top-level discipline row */}
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-text-secondary text-sm w-36 shrink-0">
                            {TOP_LABEL[disc] ?? disc}
                          </span>
                          <div className="flex-1 h-2 bg-surface-warm rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-text-primary text-sm font-medium w-32 text-right shrink-0">
                            {count} session{count !== 1 ? 's' : ''} · {pct}%
                          </span>
                        </div>

                        {/* Sub-discipline rows for Music */}
                        {subs.length > 0 && (
                          <div className="ml-6 mt-2 space-y-1.5">
                            {subs.map(({ key, count: sc }) => {
                              const spct = musicTotal > 0 ? Math.round((sc / musicTotal) * 100) : 0
                              return (
                                <div key={key} className="flex items-center justify-between gap-4">
                                  <span className="text-text-muted text-xs w-32 shrink-0">
                                    {SUB_LABEL[key]}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-surface-warm rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary/50 rounded-full transition-all duration-500"
                                      style={{ width: `${spct}%` }}
                                    />
                                  </div>
                                  <span className="text-text-secondary text-xs w-32 text-right shrink-0">
                                    {sc} session{sc !== 1 ? 's' : ''} · {spct}%
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
