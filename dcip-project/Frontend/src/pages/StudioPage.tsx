import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudioCanvas, { CANVAS_FORMATS, StudioCanvasHandle } from '../components/studio/StudioCanvas'
import GuitarStudio, { GuitarStudioHandle } from '../components/studio/GuitarStudio'
import VoiceStudio, { VoiceStudioHandle } from '../components/studio/VoiceStudio'
import PianoStudio, { PianoStudioHandle } from '../components/studio/PianoStudio'
import api from '../services/api'

// Shared handle interface — all studio components expose these methods
interface StudioHandle {
  captureImage(): string
  getFormat(): { label: string; width: number; height: number }
  captureAudio?: () => Promise<{ dataUrl: string; mimeType: string } | null>
}

// ---------------------------------------------------------------------------
// API helpers (inline to avoid extra file)
// ---------------------------------------------------------------------------

interface StudioWorkMeta {
  _id: string
  title: string
  discipline: string
  format: string
  width: number
  height: number
  fileType: string
  createdAt: string
}

interface StudioWorkFull extends StudioWorkMeta {
  fileData: string
}

function fetchWorks(): Promise<StudioWorkMeta[]> {
  return api.get('/studio').then(r => r.data)
}

function fetchWork(id: string): Promise<StudioWorkFull> {
  return api.get(`/studio/${id}`).then(r => r.data)
}

function saveWork(payload: {
  title: string
  discipline: string
  fileData: string
  fileType: string
  width: number
  height: number
  format: string
}): Promise<StudioWorkFull> {
  return api.post('/studio', payload).then(r => r.data)
}

function deleteWork(id: string): Promise<void> {
  return api.delete(`/studio/${id}`).then(() => undefined)
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

function downloadFile(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href     = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ---------------------------------------------------------------------------
// Save dialog
// ---------------------------------------------------------------------------

interface SaveDialogProps {
  discipline: string
  format: string
  onSave: (title: string) => void
  onCancel: () => void
  saving: boolean
}

function SaveDialog({ discipline, format, onSave, onCancel, saving }: SaveDialogProps) {
  const [title, setTitle] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-text-primary font-bold text-base mb-1">Save to Studio</h3>
        <p className="text-text-muted text-xs mb-4">
          {discipline} &middot; {format}
        </p>
        <label className="block text-text-secondary text-xs font-medium mb-1">Work Title</label>
        <input
          id="studio-work-title"
          name="studio-work-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && title.trim()) onSave(title.trim()) }}
          placeholder="e.g. Abstract Landscape Study"
          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 border border-surface-border text-text-secondary rounded-lg py-2 text-sm hover:bg-surface-warm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (title.trim()) onSave(title.trim()) }}
            disabled={!title.trim() || saving}
            className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Work'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Library view
// ---------------------------------------------------------------------------

interface LibraryViewProps {
  works: StudioWorkMeta[]
  loading: boolean
  onRefresh: () => void
  onDelete: (id: string) => void
  onDownload: (id: string, title: string) => void
}

function LibraryView({ works, loading, onDelete, onDownload }: LibraryViewProps) {
  const [previewWork, setPreviewWork] = useState<StudioWorkFull | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  async function handlePreview(id: string) {
    setPreviewLoading(true)
    try {
      const work = await fetchWork(id)
      setPreviewWork(work)
    } finally {
      setPreviewLoading(false)
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading your studio works...</p>
      </div>
    )
  }

  if (works.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-surface-warm border border-surface-border rounded-2xl px-10 py-12 text-center max-w-sm">
          <p className="text-text-primary font-semibold text-base mb-2">No studio works yet</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Your saved studio works will appear here. Create something and save it to build your professional archive.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {works.map(work => (
          <div
            key={work._id}
            className="bg-white rounded-xl border border-surface-border overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <button
              onClick={() => handlePreview(work._id)}
              className="w-full aspect-video bg-surface-warm flex flex-col items-center justify-center hover:bg-surface-border transition-colors gap-2"
            >
              {work.fileType?.startsWith('audio/') ? (
                <>
                  <div className="flex items-end gap-0.5 h-7">
                    {[3,5,7,5,8,6,4,7,5,3,6,4].map((h, i) => (
                      <div key={i} className="w-1 rounded-sm" style={{ height: `${h * 3}px`, background: '#C8960C', opacity: 0.5 + (h / 16) }} />
                    ))}
                  </div>
                  <span className="text-text-muted text-[10px]">Audio</span>
                </>
              ) : (
                <span className="text-text-muted text-xs">{previewLoading ? 'Loading...' : 'View'}</span>
              )}
            </button>

            <div className="p-2.5">
              <p className="text-text-primary font-semibold text-xs leading-snug truncate">{work.title}</p>
              <p className="text-text-muted text-[10px] mt-0.5">{work.format} &middot; {formatDate(work.createdAt)}</p>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => onDownload(work._id, work.title)}
                  className="flex-1 text-[10px] py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors font-medium"
                >
                  Download
                </button>
                <button
                  onClick={() => { if (window.confirm(`Delete "${work.title}"?`)) onDelete(work._id) }}
                  className="flex-1 text-[10px] py-1 rounded bg-surface-warm text-accent hover:bg-accent hover:text-white transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {previewWork && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewWork(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <div>
                <p className="text-text-primary font-semibold text-sm">{previewWork.title}</p>
                <p className="text-text-muted text-xs">{previewWork.format} &middot; {new Date(previewWork.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile(previewWork.fileData, `${previewWork.title.replace(/\s+/g, '-')}.png`)}
                  className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setPreviewWork(null)}
                  className="border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-surface-warm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6 bg-surface-warm/50">
              {previewWork.fileType?.startsWith('audio/') ? (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="flex items-end gap-1 h-12">
                    {[4,7,10,8,12,9,6,10,8,5,9,7,11,8,5].map((h, i) => (
                      <div key={i} className="w-2 rounded-sm" style={{ height: `${h * 4}px`, background: '#C8960C', opacity: 0.4 + (h / 20) }} />
                    ))}
                  </div>
                  <audio
                    controls
                    src={previewWork.fileData}
                    className="w-full max-w-lg"
                  />
                  <p className="text-text-muted text-sm text-center">
                    Click Download to save this recording and share it with teachers or friends.
                  </p>
                </div>
              ) : (
                <img
                  src={previewWork.fileData}
                  alt={previewWork.title}
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Discipline definitions (module-level constant)
// ---------------------------------------------------------------------------

function DisciplineIcon({ discipline }: { discipline: string }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (discipline === 'visual-arts') return (
    <svg {...p}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1-.23-.27-.38-.62-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
      <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
  if (discipline === 'graphic-design') return (
    <svg {...p}>
      <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5l-5 1 1-5L17 3z"/>
      <path d="M15 5l4 4"/>
    </svg>
  )
  if (discipline === 'guitar') return (
    <svg {...p}>
      <path d="M9.5 2.5h5l.5 5"/>
      <path d="M9.5 2.5l-.5 5"/>
      <ellipse cx="12" cy="14.5" rx="5" ry="5.5"/>
      <path d="M12 7.5v2"/>
      <path d="M9.5 14.5h5"/>
      <circle cx="12" cy="14.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
  if (discipline === 'voice') return (
    <svg {...p}>
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <path d="M12 17v4M9 21h6"/>
    </svg>
  )
  if (discipline === 'piano') return (
    <svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="1.5"/>
      <path d="M7 5v8M12 5v8M17 5v8"/>
      <rect x="4.5" y="5" width="3.5" height="7" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="9.5" y="5" width="3.5" height="7" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="14.5" y="5" width="3.5" height="7" rx="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
  return null
}

const DISCIPLINES = [
  { value: 'visual-arts',    label: 'Visual Arts',    description: 'Painting, drawing, mixed media, and visual composition' },
  { value: 'graphic-design', label: 'Graphic Design', description: 'Layouts, branding, typography, and digital design' },
  { value: 'guitar',         label: 'Guitar',         description: 'Compositions, chord progressions, and sheet notation' },
  { value: 'voice',          label: 'Voice',          description: 'Vocal arrangements, lyrics, and performance pieces' },
  { value: 'piano',          label: 'Piano',          description: 'Piano compositions, sheet music, and arrangements' },
]

// ---------------------------------------------------------------------------
// Main StudioPage
// ---------------------------------------------------------------------------

type StudioView = 'choose' | 'workspace' | 'library'

export default function StudioPage() {
  const navigate     = useNavigate()
  // Separate typed refs per studio type — React forwardRef requires concrete types
  const canvasRef    = useRef<StudioCanvasHandle>(null)
  const guitarRef    = useRef<GuitarStudioHandle>(null)
  const voiceRef     = useRef<VoiceStudioHandle>(null)
  const pianoRef     = useRef<PianoStudioHandle>(null)

  // Returns the active studio handle regardless of which component is mounted
  function activeStudio(): StudioHandle | null {
    if (discipline === 'guitar')  return guitarRef.current
    if (discipline === 'voice')   return voiceRef.current
    if (discipline === 'piano')   return pianoRef.current
    return canvasRef.current
  }

  const [view,         setView]         = useState<StudioView>('choose')
  const [isDirty,      setIsDirty]      = useState(false)
  const [showSave,     setShowSave]      = useState(false)
  const [saving,       setSaving]        = useState(false)
  const [saveSuccess,  setSaveSuccess]   = useState(false)
  const [works,        setWorks]         = useState<StudioWorkMeta[]>([])
  const [worksLoading, setWorksLoading]  = useState(false)
  const [discipline,   setDiscipline]    = useState('')

  const disciplineLabel = DISCIPLINES.find(d => d.value === discipline)?.label ?? discipline

  // Fetch works when switching to library
  const loadWorks = useCallback(async () => {
    setWorksLoading(true)
    try { setWorks(await fetchWorks()) } finally { setWorksLoading(false) }
  }, [])

  useEffect(() => {
    if (view === 'library') loadWorks()
  }, [view, loadWorks])

  // Save work — audio studios save audio when a recording exists, otherwise fall back to PNG
  async function handleSave(title: string) {
    const studio = activeStudio()
    if (!studio) return
    setSaving(true)
    try {
      const fmt = studio.getFormat()
      let fileData: string
      let fileType: string

      if (studio.captureAudio) {
        const audio = await studio.captureAudio()
        if (audio) {
          fileData = audio.dataUrl
          fileType = audio.mimeType
        } else {
          fileData = studio.captureImage()
          fileType = 'image/png'
        }
      } else {
        fileData = studio.captureImage()
        fileType = 'image/png'
      }

      await saveWork({
        title,
        discipline,
        fileData,
        fileType,
        width:  fmt.width,
        height: fmt.height,
        format: fmt.label,
      })
      setShowSave(false)
      setIsDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Download a saved work from the library
  async function handleDownload(id: string, title: string) {
    const work = await fetchWork(id)
    const ext = work.fileType?.startsWith('audio/')
      ? (work.fileType.includes('wav') ? 'wav' : work.fileType.includes('ogg') ? 'ogg' : 'webm')
      : 'png'
    downloadFile(work.fileData, `${title.replace(/\s+/g, '-')}.${ext}`)
  }

  // Delete a saved work
  async function handleDelete(id: string) {
    await deleteWork(id)
    setWorks(prev => prev.filter(w => w._id !== id))
  }

  // Download current workspace content directly
  function handleDownloadCurrent() {
    const studio = activeStudio()
    if (!studio) return
    const data = studio.captureImage()
    const fmt  = studio.getFormat()
    downloadFile(data, `${disciplineLabel}-${Date.now()}-${fmt.label.replace(/\s+/g, '-')}.png`)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        {/* Left: breadcrumb + active discipline */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Dashboard
          </button>
          <span className="text-text-muted text-xs">/</span>

          {view === 'choose' && (
            <span className="text-xs text-text-primary font-medium">Studio</span>
          )}

          {view === 'workspace' && (
            <>
              <button
                onClick={() => setView('choose')}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Studio
              </button>
              <span className="text-text-muted text-xs">/</span>
              {/* Prominent discipline badge */}
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {disciplineLabel} Studio
              </span>
            </>
          )}

          {view === 'library' && (
            <>
              <button
                onClick={() => setView('choose')}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Studio
              </button>
              <span className="text-text-muted text-xs">/</span>
              <span className="text-xs text-text-primary font-medium">My Works</span>
            </>
          )}
        </div>

        {/* Save feedback */}
        {saveSuccess && view === 'workspace' && (
          <span className="text-secondary text-xs font-medium">Saved successfully</span>
        )}

        {/* View toggle — hidden on the choose screen */}
        {view !== 'choose' && (
          <div className="flex border border-surface-border rounded-lg overflow-hidden text-xs font-medium">
            <button
              onClick={() => discipline ? setView('workspace') : setView('choose')}
              className={`px-3 py-1.5 transition-colors ${view === 'workspace' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-warm'}`}
            >
              Workspace
            </button>
            <button
              onClick={() => setView('library')}
              className={`px-3 py-1.5 border-l border-surface-border transition-colors ${view === 'library' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-warm'}`}
            >
              My Works
            </button>
          </div>
        )}

        {/* My Works button on choose screen */}
        {view === 'choose' && (
          <button
            onClick={() => setView('library')}
            className="text-xs border border-surface-border text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-warm transition-colors"
          >
            My Works
          </button>
        )}

        {/* Actions */}
        {view === 'workspace' && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCurrent}
              disabled={!isDirty}
              className={`border text-xs px-3 py-1.5 rounded-lg transition-colors ${isDirty ? 'border-surface-border text-text-secondary hover:bg-surface-warm' : 'border-surface-border text-text-muted opacity-40 cursor-not-allowed'}`}
            >
              Download
            </button>
            <button
              onClick={() => setShowSave(true)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${isDirty ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-surface-warm text-text-muted border border-surface-border'}`}
            >
              Save Work
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Discipline selection screen */}
        {view === 'choose' && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 bg-surface-warm">
            <div className="w-full max-w-3xl">
              <h2 className="text-text-primary font-bold text-2xl mb-2 text-center">Choose Your Studio</h2>
              <p className="text-text-muted text-sm text-center mb-10">
                Select a discipline to begin your session.
              </p>
              <div className="grid grid-cols-6 gap-5">
                {DISCIPLINES.map((d, i) => (
                  <button
                    key={d.value}
                    onClick={() => { setDiscipline(d.value); setView('workspace') }}
                    className={`${i < 3 ? 'col-span-2' : 'col-span-3'} bg-white border border-surface-border rounded-2xl p-6 text-left hover:border-primary hover:shadow-lg transition-all group`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <DisciplineIcon discipline={d.value} />
                    </div>
                    <p className="text-text-primary font-bold text-sm mb-1">{d.label}</p>
                    <p className="text-text-muted text-xs leading-relaxed">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'workspace' && discipline === 'guitar' && (
          <GuitarStudio ref={guitarRef} onDirty={() => setIsDirty(true)} />
        )}
        {view === 'workspace' && discipline === 'voice' && (
          <VoiceStudio ref={voiceRef} onDirty={() => setIsDirty(true)} />
        )}
        {view === 'workspace' && discipline === 'piano' && (
          <PianoStudio ref={pianoRef} onDirty={() => setIsDirty(true)} />
        )}
        {view === 'workspace' && (discipline === 'visual-arts' || discipline === 'graphic-design') && (
          <StudioCanvas
            ref={canvasRef}
            initialFormat={CANVAS_FORMATS[0]}
            onDirty={() => setIsDirty(true)}
          />
        )}

        {view === 'library' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <h2 className="text-text-primary font-bold text-base">My Studio Works</h2>
              <p className="text-text-secondary text-xs mt-0.5">
                Your archived professional work &middot; {works.length} {works.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <LibraryView
              works={works}
              loading={worksLoading}
              onRefresh={loadWorks}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          </div>
        )}
      </div>

      {/* Save dialog */}
      {showSave && (
        <SaveDialog
          discipline={disciplineLabel}
          format={activeStudio()?.getFormat().label ?? ''}
          onSave={handleSave}
          onCancel={() => setShowSave(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
