import { useEffect, useState } from 'react'
import AdminNav from '../../components/AdminNav'
import { getAdminReports } from '../../services/api'
import Footer from '../../components/Footer'

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

const disciplineLabel = (d: string) => {
  if (d === 'music') return 'Music'
  if (d === 'visual-arts') return 'Visual Arts'
  if (d === 'graphic-design') return 'Graphic Design'
  return d
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F4]">
      <AdminNav />
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
              {!reports?.sessionsByDiscipline.length ? (
                <p className="text-text-secondary text-sm">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {[...reports.sessionsByDiscipline]
                    .sort((a, b) => b.count - a.count)
                    .map((d) => {
                      const pct =
                        reports.totalSessions > 0
                          ? Math.round((d.count / reports.totalSessions) * 100)
                          : 0
                      return (
                        <div key={d._id} className="flex items-center justify-between gap-4">
                          <span className="text-text-secondary text-sm w-32 shrink-0">
                            {disciplineLabel(d._id)}
                          </span>
                          <span className="text-text-primary text-sm font-medium w-28 text-right shrink-0">
                            {d.count} session{d.count !== 1 ? 's' : ''} · {pct}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
