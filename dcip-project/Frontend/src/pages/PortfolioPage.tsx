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
  snapshot?: string
  durationMinutes: number
  syncStatus?: 'synced' | 'pending'
  createdAt: string
}

function getDisciplineGroup(d: string): 'music' | 'visual-arts' | 'graphic-design' | null {
  if (['piano', 'guitar', 'voice', 'music', 'music-piano', 'music-guitar', 'music-voice'].includes(d)) return 'music'
  if (d === 'visual-arts') return 'visual-arts'
  if (d === 'graphic-design') return 'graphic-design'
  return null
}

const DISCIPLINE_META = {
  music: {
    label: 'Music',
    sub: 'Piano, Guitar and Voice',
  },
  'visual-arts': {
    label: 'Visual Arts',
    sub: 'Drawing, Painting and Mixed media',
  },
  'graphic-design': {
    label: 'Graphic Design',
    sub: 'Posters, Layouts and Typography',
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

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}


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
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

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

  const handleEdit = async (item: PortfolioItem, e: React.MouseEvent) => {
    e.stopPropagation()
    let full = item
    if (!item.fileData || (!item.snapshot && item.discipline === 'graphic-design')) {
      try { full = (await fetchPortfolioItem(item._id)).data } catch { return }
    }
    if (item.discipline === 'visual-arts') {
      // Reconstruct snapshot from the composite PNG so the student can continue drawing
      const editSnapshot = JSON.stringify({
        drawData: full.fileData ?? '',
        eraseData: '',
        bgColor: '#F9F7F4',
        shapes: [],
      })
      navigate('/visual-arts/production', { state: { editSnapshot } })
    } else if (item.discipline === 'graphic-design') {
      navigate('/graphic-design/production', { state: { editSnapshot: full.snapshot ?? null } })
    }
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
    setSelectedDay(null)
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
                      className={`text-left bg-white border border-surface-border rounded-2xl p-6 transition-all ${
                        count > 0 ? 'hover:shadow-md hover:border-primary cursor-pointer' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-text-primary font-bold text-base mb-1">{meta.label}</p>
                      <p className="text-text-secondary text-xs mb-4">{meta.sub}</p>
                      <p className="text-sm font-semibold text-primary">
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

            {/* Level 3: Items with calendar */}
            {view === 'items' && activeDiscipline && activeMonth && (() => {
              const [yr, mo] = activeMonth.split('-').map(Number)
              const calCells = buildCalendar(yr, mo - 1)
              const monthItems = itemsForMonth(activeDiscipline, activeMonth)
              const daysWithItems = new Set(
                monthItems.map(i => {
                  const d = new Date(i.createdAt)
                  return d.getFullYear() === yr && d.getMonth() + 1 === mo ? d.getDate() : -1
                }).filter(d => d > 0)
              )
              const displayedItems = selectedDay
                ? monthItems.filter(i => {
                    const d = new Date(i.createdAt)
                    return d.getFullYear() === yr && d.getMonth() + 1 === mo && d.getDate() === selectedDay
                  })
                : monthItems
              const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

              return (
                <>
                  <Breadcrumb parts={[
                    { label: 'My Portfolio', onClick: goToDisciplines },
                    { label: DISCIPLINE_META[activeDiscipline].label, onClick: () => goToMonths(activeDiscipline) },
                    { label: formatMonthLabel(activeMonth) },
                  ]} />

                  <p className="text-text-secondary text-sm mb-4">
                    {selectedDay
                      ? `Showing ${displayedItems.length} item${displayedItems.length !== 1 ? 's' : ''} saved on ${new Date(yr, mo - 1, selectedDay).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : `Showing all ${monthItems.length} item${monthItems.length !== 1 ? 's' : ''} in ${formatMonthLabel(activeMonth)}`
                    }
                  </p>

                  {/* Mini calendar */}
                  <div className="bg-white border border-surface-border rounded-xl p-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => { setActiveMonth(shiftMonth(activeMonth, -1)); setSelectedDay(null); setSelected(null) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-warm transition-colors text-text-secondary hover:text-text-primary"
                        title="Previous month"
                      >
                        ‹
                      </button>
                      <div className="flex items-center gap-3">
                        <p className="text-text-primary font-bold text-sm">{formatMonthLabel(activeMonth)}</p>
                        {selectedDay && (
                          <button onClick={() => { setSelectedDay(null); setSelected(null) }} className="text-xs text-primary hover:underline">
                            Show all
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => { setActiveMonth(shiftMonth(activeMonth, 1)); setSelectedDay(null); setSelected(null) }}
                        disabled={activeMonth >= currentMonthKey()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-warm transition-colors text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Next month"
                      >
                        ›
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {DAY_LABELS.map(d => (
                        <span key={d} className="text-text-muted text-[10px] font-medium py-1">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {calCells.map((day, idx) => {
                        if (!day) return <span key={idx} />
                        const hasItems = daysWithItems.has(day)
                        const isSelected = selectedDay === day
                        return (
                          <button
                            key={idx}
                            onClick={() => { setSelectedDay(isSelected ? null : day); setSelected(null) }}
                            disabled={!hasItems}
                            className={`relative text-xs py-1.5 rounded-lg transition-colors font-medium
                              ${isSelected ? 'bg-primary text-white' : hasItems ? 'text-text-primary hover:bg-primary/10' : 'text-text-muted cursor-default opacity-40'}`}
                          >
                            {day}
                            {hasItems && !isSelected && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {displayedItems.length === 0 ? (
                    <div className="bg-white border border-surface-border rounded-xl p-8 text-center">
                      <p className="text-text-primary font-semibold text-sm mb-1">No saved work on this date</p>
                      <p className="text-text-muted text-xs">Try selecting a different day or click Show all.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {displayedItems.map(item => (
                        <div
                          key={item._id}
                          onClick={() => handleView(item._id)}
                          className={`bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                            selected?._id === item._id ? 'border-primary shadow-md' : 'border-surface-border hover:border-primary'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="aspect-square bg-[#F9F7F4] flex items-center justify-center overflow-hidden">
                            {item.fileType?.startsWith('image') && item.fileData ? (
                              <img src={item.fileData} alt={item.title} className="w-full h-full object-cover" />
                            ) : item.fileType?.startsWith('audio') ? (
                              <div className="flex flex-col items-center gap-1 text-text-muted">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                                </svg>
                                <span className="text-[10px]">Audio</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-text-muted">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-[10px]">Work</span>
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <p className="text-text-primary font-semibold text-xs truncate">{item.title}</p>
                            <p className="text-text-muted text-[10px] mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                            </p>
                            {item.syncStatus === 'pending' && (
                              <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-light text-primary">Pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview panel — shown below grid when item selected */}
                  {selected && (
                    <div className="mt-6 bg-white border border-surface-border rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-text-primary font-semibold text-sm">{selected.title}</p>
                          <p className="text-text-secondary text-xs">
                            {disciplineLabel(selected.discipline)} · {new Date(selected.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button onClick={() => setSelected(null)} className="text-text-secondary text-xl leading-none hover:text-text-primary">×</button>
                      </div>

                      {selected.fileType === 'result' && (
                        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-center mb-4">
                          <p className="text-secondary font-semibold text-sm mb-1">Demonstration Passed</p>
                          <p className="text-text-secondary text-xs">{selected.fileData}</p>
                        </div>
                      )}
                      {selected.fileType?.startsWith('image') && (
                        <img src={selected.fileData} alt={selected.title} className="w-full max-h-96 object-contain rounded-lg border border-surface-border mb-4" />
                      )}
                      {selected.fileType?.startsWith('audio') && (
                        <audio controls src={selected.fileData} className="w-full mb-4" />
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        {(selected.discipline === 'visual-arts' || selected.discipline === 'graphic-design') && (
                          <button onClick={e => handleEdit(selected, e)} className="bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                            Edit
                          </button>
                        )}
                        {selected.fileType !== 'result' && (
                          <button onClick={e => handleDownload(selected, e)} className="border border-surface-border text-text-secondary text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Download
                          </button>
                        )}
                        <button onClick={() => handleDelete(selected._id)} disabled={deleting} className="text-accent text-xs hover:underline disabled:opacity-40 ml-auto">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}

          </div>
        )}
      </div>
    </MainLayout>
  )
}
