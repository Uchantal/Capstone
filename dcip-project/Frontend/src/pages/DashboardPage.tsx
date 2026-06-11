import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchStats, fetchPortfolio } from '../services/api'
import TopNav from '../components/TopNav'
import ProgressStat from '../components/ProgressStat'
import PortfolioItemCard from '../components/PortfolioItemCard'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0 })
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    Promise.all([fetchStats(), fetchPortfolio()])
      .then(([statsRes, portfolioRes]) => {
        setStats(statsRes.data)
        setPortfolio(portfolioRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const disciplineLabel = user.discipline
    ? user.discipline.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'None selected'

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-text-primary font-bold text-2xl">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{user.school.name} · {user.school.district}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ProgressStat value={stats.totalSessions} label="Sessions completed" />
          <ProgressStat value={portfolio.length} label="Portfolio items" />
          <ProgressStat value={disciplineLabel} label="Current discipline" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => navigate(user.discipline ? `/session/${user.discipline}` : '/disciplines')}
            className="bg-primary text-white font-semibold text-sm py-4 rounded-xl hover:bg-primary-dark transition-colors text-left px-6"
          >
            <p className="text-lg mb-1">▶</p>
            Start a session
            <p className="font-normal text-xs text-yellow-200 mt-0.5">
              {user.discipline ? disciplineLabel : 'Choose a discipline first'}
            </p>
          </button>
          <button
            onClick={() => navigate('/disciplines')}
            className="bg-white border border-border text-text-primary font-semibold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors text-left px-6"
          >
            <p className="text-lg mb-1">🎯</p>
            Change discipline
            <p className="font-normal text-xs text-text-secondary mt-0.5">
              Music · Visual Arts · Graphic Design
            </p>
          </button>
        </div>

        {/* Recent portfolio */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-bold text-base">Recent work</h2>
            {portfolio.length > 3 && (
              <button
                onClick={() => navigate('/portfolio')}
                className="text-primary text-sm font-medium hover:underline"
              >
                View all →
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-text-secondary text-sm text-center py-8">Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🎨</p>
              <p className="text-text-primary font-semibold text-sm mb-1">No work saved yet</p>
              <p className="text-text-secondary text-xs mb-4">
                Start a session to create and save your first piece.
              </p>
              <button
                onClick={() => navigate('/disciplines')}
                className="bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Start now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.slice(0, 3).map((item, i) => (
                <PortfolioItemCard
                  key={item._id}
                  discipline={item.discipline}
                  title={item.title}
                  createdAt={item.createdAt}
                  syncStatus={item.syncStatus}
                  sessionNumber={portfolio.length - i}
                  onView={() => navigate('/portfolio')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
