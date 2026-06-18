import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchPortfolio, fetchPortfolioItem, deletePortfolioItem } from '../services/api'
import TopNav from '../components/TopNav'
import PortfolioItemCard from '../components/PortfolioItemCard'

export default function PortfolioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchPortfolio()
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleView = async (id: string) => {
    try {
      const res = await fetchPortfolioItem(id)
      setSelected(res.data)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    try {
      await deletePortfolioItem(id)
      setItems((prev) => prev.filter((i) => i._id !== id))
      if (selected?._id === id) setSelected(null)
    } catch {}
    setDeleting(false)
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-text-primary font-bold text-2xl">My Portfolio</h1>
            <p className="text-text-secondary text-sm mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button
            onClick={() => navigate('/disciplines')}
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            + New session
          </button>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary text-sm py-16">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <p className="text-4xl mb-3"></p>
            <p className="text-text-primary font-semibold mb-2">No work yet</p>
            <p className="text-text-secondary text-sm mb-6">Complete a session to save your first piece.</p>
            <button
              onClick={() => navigate('/disciplines')}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Start a session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {items.map((item, i) => (
                <PortfolioItemCard
                  key={item._id}
                  discipline={item.discipline}
                  title={item.title}
                  createdAt={item.createdAt}
                  syncStatus={item.syncStatus}
                  sessionNumber={items.length - i}
                  onView={() => handleView(item._id)}
                />
              ))}
            </div>

            {/* Preview panel */}
            {selected && (
              <div className="bg-white border border-border rounded-xl p-5 sticky top-6 h-fit">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-text-primary font-semibold text-sm">{selected.title}</p>
                    <p className="text-text-secondary text-xs">
                      {selected.discipline.replace('-', ' ')} ·{' '}
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-text-secondary text-lg leading-none hover:text-text-primary"
                  >
                    ×
                  </button>
                </div>

                {selected.fileType?.startsWith('image') && (
                  <img
                    src={selected.fileData}
                    alt={selected.title}
                    className="w-full rounded-lg border border-border mb-4"
                  />
                )}
                {selected.fileType?.startsWith('audio') && (
                  <audio controls src={selected.fileData} className="w-full mb-4" />
                )}
                {(!selected.fileType || selected.fileType === 'audio/wav') && !selected.fileData?.startsWith('data:') && (
                  <div className="bg-bg-page rounded-lg p-4 text-center text-text-secondary text-sm mb-4">
                    Audio session recorded
                  </div>
                )}

                <button
                  onClick={() => handleDelete(selected._id)}
                  disabled={deleting}
                  className="text-accent text-xs hover:underline disabled:opacity-40"
                >
                  Delete this item
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
