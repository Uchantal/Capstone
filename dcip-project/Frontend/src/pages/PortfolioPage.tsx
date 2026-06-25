import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchPortfolio, fetchPortfolioItem, deletePortfolioItem } from '../services/api'
import MainLayout from '../components/MainLayout'

interface PortfolioItem {
  _id: string
  discipline: string
  title: string
  fileType: string
  fileData: string
  durationMinutes: number
  syncStatus?: 'synced' | 'pending'
  createdAt: string
}

function getDisciplineGroup(d: string): 'music' | 'visual-arts' | 'graphic-design' | null {
  if (['piano', 'guitar', 'voice', 'music'].includes(d)) return 'music'
  if (d === 'visual-arts') return 'visual-arts'
  if (d === 'graphic-design') return 'graphic-design'
  return null
}

const DISCIPLINE_META = {
  music: {
    label: 'Music',
    sub: 'Piano, Guitar and Voice',
    cardBg: 'bg-primary-light',
    cardBorder: 'border-primary/30',
    countColor: 'text-primary',
  },
  'visual-arts': {
    label: 'Visual Arts',
    sub: 'Drawing, Painting and Mixed media',
    cardBg: 'bg-secondary/10',
    cardBorder: 'border-secondary/30',
    countColor: 'text-secondary',
  },
  'graphic-design': {
    label: 'Graphic Design',
    sub: 'Posters, Layouts and Typography',
    cardBg: 'bg-surface-warm',
    cardBorder: 'border-surface-border',
    countColor: 'text-text-secondary',
  },
} as const

type DisciplineKey = keyof typeof DISCIPLINE_META

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

function disciplineLabel(d: string) {
  if (d === 'piano') return 'Piano'
  if (d === 'guitar') return 'Guitar'
  if (d === 'voice') return 'Voice and Singing'
  if (d === 'visual-arts') return 'Visual Arts'
  if (d === 'graphic-design') return 'Graphic Design'
  return d.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function Breadcrumb({ parts }: { parts: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-text-muted">/</span>}
          {p.onClick ? (
            <button onClick={p.onClick} className="text-primary hover:underline font-medium">
              {p.label}
            </button>
          ) : (
            <span className="text-text-secondary font-medium">{p.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

type View = 'disciplines' | 'months' | 'items'

export default function PortfolioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PortfolioItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [view, setView] = useState<View>('disciplines')
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineKey | null>(null)
  const [activeMonth, setActiveMonth] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchPortfolio()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

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
      setItems(prev => prev.filter(i => i._id !== id))
      if (selected?._id === id) setSelected(null)
    } catch {}
    setDeleting(false)
  }

  const handleDownload = async (item: PortfolioItem, e: React.MouseEvent) => {
    e.stopPropagation()
    let fileData = item.fileData
    let fileType = item.fileType
    if (!fileData) {
      try {
        const res = await fetchPortfolioItem(item._id)
        fileData = res.data.fileData
        fileType = res.data.fileType
      } catch { return }
    }
    const ext = fileType?.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
    const link = document.createElement('a')
    link.href = fileData
    link.download = `${item.title}.${ext}`
    link.click()
  }

  const goToDisciplines = () => {
    setView('disciplines')
    setActiveDiscipline(null)
    setActiveMonth(null)
    setSelected(null)
  }

  const goToMonths = (disc: DisciplineKey) => {
    setActiveDiscipline(disc)
    setActiveMonth(null)
    setSelected(null)
    setView('months')
  }

  const goToItems = (month: string) => {
    setActiveMonth(month)
    setSelected(null)
    setView('items')
  }

  const byDiscipline = (key: DisciplineKey) =>
    items.filter(i => getDisciplineGroup(i.discipline) === key)

  const monthsFor = (key: DisciplineKey) => {
    const grouped: Record<string, PortfolioItem[]> = {}
    byDiscipline(key).forEach(i => {
      const mk = monthKey(i.createdAt)
      ;(grouped[mk] ??= []).push(i)
    })
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }

  const itemsForMonth = (key: DisciplineKey, month: string) =>
    byDiscipline(key).filter(i => monthKey(i.createdAt) === month)

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10">

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-text-primary font-bold text-2xl">My Portfolio</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''} saved across all disciplines
            </p>
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
          <div className="bg-white border border-surface-border rounded-xl p-12 text-center mt-6">
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
          <div className="mt-6">

            {/* Level 1: Discipline cards */}
            {view === 'disciplines' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.keys(DISCIPLINE_META) as DisciplineKey[]).map(key => {
                  const meta = DISCIPLINE_META[key]
                  const count = byDiscipline(key).length
                  return (
                    <button
                      key={key}
                      onClick={() => count > 0 && goToMonths(key)}
                      disabled={count === 0}
                      className={`text-left border rounded-2xl p-6 transition-all ${meta.cardBg} ${meta.cardBorder} ${
                        count > 0 ? 'hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-text-primary font-bold text-base mb-1">{meta.label}</p>
                      <p className="text-text-secondary text-xs mb-4">{meta.sub}</p>
                      <p className={`text-sm font-semibold ${meta.countColor}`}>
                        {count} item{count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Level 2: Month list */}
            {view === 'months' && activeDiscipline && (
              <>
                <Breadcrumb parts={[
                  { label: 'My Portfolio', onClick: goToDisciplines },
                  { label: DISCIPLINE_META[activeDiscipline].label },
                ]} />
                <div className="space-y-3">
                  {monthsFor(activeDiscipline).map(([mk, monthItems]) => (
                    <button
                      key={mk}
                      onClick={() => goToItems(mk)}
                      className="w-full text-left bg-white border border-surface-border rounded-xl px-6 py-4 hover:border-primary transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-text-primary font-semibold text-sm">{formatMonthLabel(mk)}</p>
                        <p className="text-text-secondary text-xs mt-0.5">
                          {monthItems.length} item{monthItems.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-primary text-xs font-semibold">View</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Level 3: Items */}
            {view === 'items' && activeDiscipline && activeMonth && (
              <>
                <Breadcrumb parts={[
                  { label: 'My Portfolio', onClick: goToDisciplines },
                  { label: DISCIPLINE_META[activeDiscipline].label, onClick: () => goToMonths(activeDiscipline) },
                  { label: formatMonthLabel(activeMonth) },
                ]} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {itemsForMonth(activeDiscipline, activeMonth).map(item => (
                      <div
                        key={item._id}
                        onClick={() => handleView(item._id)}
                        className="bg-white border border-surface-border rounded-xl px-5 py-4 flex items-center gap-3 hover:border-primary transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-semibold text-sm truncate">{item.title}</p>
                          <p className="text-text-secondary text-xs mt-0.5">
                            {disciplineLabel(item.discipline)}, {new Date(item.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {item.syncStatus && (
                            <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              item.syncStatus === 'synced'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-primary-light text-primary'
                            }`}>
                              {item.syncStatus === 'synced' ? 'Synced' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={e => handleDownload(item, e)}
                            className="text-secondary text-xs font-semibold hover:underline"
                          >
                            Download
                          </button>
                          <span className="text-primary text-xs font-semibold">View</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preview panel */}
                  {selected && (
                    <div className="bg-white border border-surface-border rounded-xl p-5 sticky top-6 h-fit">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-text-primary font-semibold text-sm">{selected.title}</p>
                          <p className="text-text-secondary text-xs">
                            {disciplineLabel(selected.discipline)} · {new Date(selected.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button onClick={() => setSelected(null)} className="text-text-secondary text-xl leading-none hover:text-text-primary">x</button>
                      </div>

                      {selected.fileType?.startsWith('image') && (
                        <img src={selected.fileData} alt={selected.title} className="w-full rounded-lg border border-surface-border mb-4" />
                      )}
                      {selected.fileType?.startsWith('audio') && (
                        <audio controls src={selected.fileData} className="w-full mb-4" />
                      )}
                      {(!selected.fileType || selected.fileType === 'audio/wav') && !selected.fileData?.startsWith('data:') && (
                        <div className="bg-surface-warm rounded-lg p-4 text-center text-text-secondary text-sm mb-4">
                          Audio session recorded
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <button
                          onClick={e => handleDownload(selected, e)}
                          className="text-secondary text-xs font-semibold hover:underline"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(selected._id)}
                          disabled={deleting}
                          className="text-accent text-xs hover:underline disabled:opacity-40"
                        >
                          Delete this item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </MainLayout>
  )
}
