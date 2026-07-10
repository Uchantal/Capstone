import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../services/api'

interface StudioWorkMeta {
  _id: string
  title: string
  discipline: string
  format: string
  width: number
  height: number
  createdAt: string
  user: {
    fullName: string
    username: string
    discipline: string | null
    school: { name: string; district: string } | null
  }
}

interface StudioWorkFull extends StudioWorkMeta {
  fileData: string
}

interface StudioStats {
  totalWorks: number
  graduatedCount: number
  byDiscipline: { _id: string; count: number }[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function disciplineLabel(d: string): string {
  return d.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AdminStudioPage() {
  const [works,        setWorks]        = useState<StudioWorkMeta[]>([])
  const [stats,        setStats]        = useState<StudioStats | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [preview,      setPreview]      = useState<StudioWorkFull | null>(null)
  const [previewLoad,  setPreviewLoad]  = useState(false)
  const [filterDisc,   setFilterDisc]   = useState<string>('all')
  const [search,       setSearch]       = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/admin/studio').then(r => r.data as StudioWorkMeta[]),
      api.get('/admin/studio/stats').then(r => r.data as StudioStats),
    ])
      .then(([w, s]) => { setWorks(w); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  async function openPreview(id: string) {
    setPreviewLoad(true)
    try {
      const work = await api.get(`/admin/studio/${id}`).then(r => r.data as StudioWorkFull)
      setPreview(work)
    } finally {
      setPreviewLoad(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}" permanently?`)) return
    await api.delete(`/admin/studio/${id}`)
    setWorks(prev => prev.filter(w => w._id !== id))
    if (preview?._id === id) setPreview(null)
  }

  function handleDownload(work: StudioWorkFull) {
    const a = document.createElement('a')
    a.href     = work.fileData
    a.download = `${work.title.replace(/\s+/g, '-')}-${work.user.username}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const disciplines = Array.from(new Set(works.map(w => w.discipline)))

  const filtered = works.filter(w => {
    const matchDisc   = filterDisc === 'all' || w.discipline === filterDisc
    const matchSearch = !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.user?.fullName?.toLowerCase().includes(search.toLowerCase())
    return matchDisc && matchSearch
  })

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-text-primary font-bold text-xl">Studio</h1>
          <p className="text-text-secondary text-sm mt-0.5">Professional works created by graduated students</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-surface-border rounded-xl px-4 py-3">
              <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold">Total Works</p>
              <p className="text-text-primary font-bold text-2xl mt-1">{stats.totalWorks}</p>
            </div>
            <div className="bg-white border border-surface-border rounded-xl px-4 py-3">
              <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold">Graduated Students</p>
              <p className="text-text-primary font-bold text-2xl mt-1">{stats.graduatedCount}</p>
            </div>
            {stats.byDiscipline.map(d => (
              <div key={d._id} className="bg-white border border-surface-border rounded-xl px-4 py-3">
                <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold">{disciplineLabel(d._id)}</p>
                <p className="text-text-primary font-bold text-2xl mt-1">{d.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by title or student name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary bg-white"
          />
          <select
            value={filterDisc}
            onChange={e => setFilterDisc(e.target.value)}
            className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary bg-white focus:outline-none focus:border-primary"
          >
            <option value="all">All disciplines</option>
            {disciplines.map(d => (
              <option key={d} value={d}>{disciplineLabel(d)}</option>
            ))}
          </select>
        </div>

        {/* Works table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-text-muted text-sm">Loading studio works...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-surface-border rounded-xl py-14 text-center">
            <p className="text-text-primary font-semibold text-sm mb-1">No studio works found</p>
            <p className="text-text-muted text-xs">
              {works.length === 0
                ? 'No graduated students have saved studio work yet.'
                : 'No works match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-warm border-b border-surface-border">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Title</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Student</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Discipline</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Format</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Saved</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wide font-semibold text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filtered.map(work => (
                    <tr key={work._id} className="hover:bg-surface-warm/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm font-medium">{work.title}</p>
                        <p className="text-text-muted text-[10px] mt-0.5">{work.width} x {work.height}px</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm">{work.user?.fullName ?? 'Unknown student'}</p>
                        <p className="text-text-muted text-[10px]">@{work.user?.username ?? '-'}</p>
                        {work.user?.school && (
                          <p className="text-text-muted text-[10px]">{work.user.school.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">{disciplineLabel(work.discipline)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">{work.format}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted">{formatDate(work.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPreview(work._id)}
                            disabled={previewLoad}
                            className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(work._id, work.title)}
                            className="text-xs text-accent hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-surface-border bg-surface-warm/30">
              <p className="text-text-muted text-[10px]">{filtered.length} of {works.length} works</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-surface-border">
              <div>
                <p className="text-text-primary font-bold text-base">{preview.title}</p>
                <p className="text-text-secondary text-xs mt-0.5">
                  {preview.user.fullName} &middot; {disciplineLabel(preview.discipline)} &middot; {preview.format}
                </p>
                {preview.user.school && (
                  <p className="text-text-muted text-xs">{preview.user.school.name}, {preview.user.school.district}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => handleDownload(preview)}
                  className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => { handleDelete(preview._id, preview.title) }}
                  className="border border-accent text-accent text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="border border-surface-border text-text-secondary text-xs px-4 py-1.5 rounded-lg hover:bg-surface-warm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 bg-surface-warm/40 flex items-center justify-center">
              <img
                src={preview.fileData}
                alt={preview.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
