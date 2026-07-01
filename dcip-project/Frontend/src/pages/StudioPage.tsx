import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import StudioCanvas, { CANVAS_FORMATS, StudioCanvasHandle } from '../components/studio/StudioCanvas'
import GuitarStudio, { GuitarStudioHandle } from '../components/studio/GuitarStudio'
import VoiceStudio, { VoiceStudioHandle } from '../components/studio/VoiceStudio'
import PianoStudio, { PianoStudioHandle } from '../components/studio/PianoStudio'
import api from '../services/api'
import DcipLogoLink from '../components/DcipLogoLink'
import Footer from '../components/Footer'

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
  fileUrl?: string
  folder?: string
  createdAt: string
}

interface StudioWorkFull extends StudioWorkMeta {
  fileData?: string
  fileUrl?: string
}

interface StudioFolder {
  _id: string
  name: string
}

function fetchWorks(folder?: string | null): Promise<StudioWorkMeta[]> {
  const params = folder === undefined ? {} : { folder: folder ?? 'none' }
  return api.get('/studio', { params }).then(r => r.data)
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
  folder?: string
  newFolderName?: string
}): Promise<StudioWorkFull> {
  return api.post('/studio', payload).then(r => r.data)
}

function deleteWork(id: string): Promise<void> {
  return api.delete(`/studio/${id}`).then(() => undefined)
}

function moveWork(id: string, folder: string | null): Promise<void> {
  return api.patch(`/studio/${id}/folder`, { folder }).then(() => undefined)
}

function fetchFolders(): Promise<StudioFolder[]> {
  return api.get('/studio/folders').then(r => r.data)
}

function createFolder(name: string): Promise<StudioFolder> {
  return api.post('/studio/folders', { name }).then(r => r.data)
}

function deleteFolderApi(id: string): Promise<void> {
  return api.delete(`/studio/folders/${id}`).then(() => undefined)
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

async function downloadFile(src: string, filename: string) {
  let href = src
  if (src.startsWith('http')) {
    const res = await fetch(src)
    href = URL.createObjectURL(await res.blob())
  }
  const a = document.createElement('a')
  a.href     = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (href !== src) URL.revokeObjectURL(href)
}

// ---------------------------------------------------------------------------
// Save dialog
// ---------------------------------------------------------------------------

interface SaveDialogProps {
  discipline: string
  format: string
  folders: StudioFolder[]
  onSave: (title: string, folderOpts: { folder?: string; newFolderName?: string }) => void
  onCancel: () => void
  saving: boolean
}

function SaveDialog({ discipline, format, folders, onSave, onCancel, saving }: SaveDialogProps) {
  const [title, setTitle] = useState('')
  // '' = Uncategorized, '__new__' = creating a new folder, otherwise an existing folder id
  const [folderChoice, setFolderChoice] = useState('')
  const [newFolderName, setNewFolderName] = useState('')

  const creatingNew = folderChoice === '__new__'
  const canSave = title.trim().length > 0 && (!creatingNew || newFolderName.trim().length > 0) && !saving

  function submit() {
    if (!canSave) return
    const folderOpts = creatingNew
      ? { newFolderName: newFolderName.trim() }
      : folderChoice ? { folder: folderChoice } : {}
    onSave(title.trim(), folderOpts)
  }

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
          onKeyDown={e => { if (e.key === 'Enter' && !creatingNew) submit() }}
          placeholder="e.g. Abstract Landscape Study"
          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary mb-3"
          autoFocus
        />
        <label className="block text-text-secondary text-xs font-medium mb-1">Folder</label>
        <select
          value={folderChoice}
          onChange={e => setFolderChoice(e.target.value)}
          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="">Uncategorized</option>
          {folders.map(f => (
            <option key={f._id} value={f._id}>{f.name}</option>
          ))}
          <option value="__new__">+ Create new folder...</option>
        </select>
        {creatingNew && (
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="New folder name"
            className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary mt-2"
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 border border-surface-border text-text-secondary rounded-lg py-2 text-sm hover:bg-surface-warm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
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
  onEdit: (work: StudioWorkFull) => void
  folders: StudioFolder[]
  activeFolder: string | null | undefined
  onSelectFolder: (folder: string | null | undefined) => void
  onCreateFolder: (name: string) => void
  onDeleteFolder: (id: string) => void
  onMove: (id: string, folder: string | null) => void
}

function LibraryView({
  works, loading, onDelete, onDownload, onEdit,
  folders, activeFolder, onSelectFolder, onCreateFolder, onDeleteFolder, onMove,
}: LibraryViewProps) {
  const [previewWork, setPreviewWork] = useState<StudioWorkFull | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [editLoading, setEditLoading] = useState<string | null>(null)

  function handleNewFolder() {
    const name = window.prompt('Folder name:')
    if (name && name.trim()) onCreateFolder(name.trim())
  }

  function handleDeleteFolderClick(folder: StudioFolder) {
    if (window.confirm(`Delete folder "${folder.name}"? Works inside it will move to Uncategorized, not be deleted.`)) {
      onDeleteFolder(folder._id)
    }
  }

  const tabBase = 'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap'
  const tabActive   = `${tabBase} bg-primary text-white`
  const tabInactive = `${tabBase} bg-surface-warm text-text-secondary hover:bg-surface-border`

  const folderBar = (
    <div className="flex items-center gap-2 px-6 pt-4 pb-2 overflow-x-auto flex-shrink-0">
      <button onClick={() => onSelectFolder(undefined)} className={activeFolder === undefined ? tabActive : tabInactive}>
        All Works
      </button>
      <button onClick={() => onSelectFolder(null)} className={activeFolder === null ? tabActive : tabInactive}>
        Uncategorized
      </button>
      {folders.map(folder => (
        <div key={folder._id} className="flex items-center gap-1">
          <button onClick={() => onSelectFolder(folder._id)} className={activeFolder === folder._id ? tabActive : tabInactive}>
            {folder.name}
          </button>
          {activeFolder === folder._id && (
            <button
              onClick={() => handleDeleteFolderClick(folder)}
              className="text-text-muted hover:text-accent text-xs px-1"
              title={`Delete folder "${folder.name}"`}
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <button onClick={handleNewFolder} className={`${tabBase} border border-dashed border-surface-border text-text-secondary hover:border-primary hover:text-primary`}>
        + New Folder
      </button>
    </div>
  )

  async function handlePreview(id: string) {
    setPreviewLoading(true)
    try {
      const work = await fetchWork(id)
      setPreviewWork(work)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleEdit(id: string) {
    setEditLoading(id)
    try {
      const work = await fetchWork(id)
      onEdit(work)
    } finally {
      setEditLoading(null)
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {folderBar}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">Loading your studio works...</p>
        </div>
      </div>
    )
  }

  if (works.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {folderBar}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-surface-warm border border-surface-border rounded-2xl px-10 py-12 text-center max-w-sm">
            <p className="text-text-primary font-semibold text-base mb-2">
              {activeFolder === undefined ? 'No studio works yet' : 'This folder is empty'}
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              {activeFolder === undefined
                ? 'Your saved studio works will appear here. Create something and save it to build your professional archive.'
                : 'Move some works into this folder, or switch to "All Works" to find them.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {folderBar}
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
              <select
                value={work.folder ?? ''}
                onChange={e => onMove(work._id, e.target.value || null)}
                className="w-full mt-1.5 text-[10px] border border-surface-border rounded px-1.5 py-1 text-text-secondary bg-white"
              >
                <option value="">Uncategorized</option>
                {folders.map(folder => (
                  <option key={folder._id} value={folder._id}>{folder.name}</option>
                ))}
              </select>
              <div className="flex gap-1 mt-2">
                {!work.fileType?.startsWith('audio/') && (
                  <button
                    onClick={() => handleEdit(work._id)}
                    disabled={editLoading === work._id}
                    className="flex-1 text-[10px] py-1 rounded bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors font-medium disabled:opacity-50"
                  >
                    {editLoading === work._id ? '...' : 'Edit'}
                  </button>
                )}
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
                {!previewWork.fileType?.startsWith('audio/') && (
                  <button
                    onClick={() => { onEdit(previewWork); setPreviewWork(null) }}
                    className="bg-secondary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    const src = previewWork.fileUrl ?? previewWork.fileData ?? ''
                    const ext = previewWork.fileType?.startsWith('audio/') ? 'wav' : 'png'
                    downloadFile(src, `${previewWork.title.replace(/\s+/g, '-')}.${ext}`)
                  }}
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
                    src={previewWork.fileUrl ?? previewWork.fileData}
                    className="w-full max-w-lg"
                  />
                  <p className="text-text-muted text-sm text-center">
                    Click Download to save this recording and share it with teachers or friends.
                  </p>
                </div>
              ) : (
                <img
                  src={previewWork.fileUrl ?? previewWork.fileData}
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

const DISCIPLINES = [
  { value: 'visual-arts',    label: 'Visual Arts',    description: 'Painting, drawing, mixed media, and visual composition', image: '/images/visual-arts.jpg' },
  { value: 'graphic-design', label: 'Graphic Design', description: 'Layouts, branding, typography, and digital design',      image: '/images/graphic-design.jpg' },
  { value: 'guitar',         label: 'Guitar',         description: 'Compositions, chord progressions, and sheet notation',   image: '/images/guitar.jpg' },
  { value: 'voice',          label: 'Voice',          description: 'Vocal arrangements, lyrics, and performance pieces',     image: '/images/voice.jpg' },
  { value: 'piano',          label: 'Piano',          description: 'Piano compositions, sheet music, and arrangements',      image: '/images/piano.jpg' },
]

// ---------------------------------------------------------------------------
// Main StudioPage
// ---------------------------------------------------------------------------

type StudioView = 'choose' | 'workspace' | 'library'

export default function StudioPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
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
  const [folders,      setFolders]       = useState<StudioFolder[]>([])
  // undefined = All works, null = Uncategorized, string = a specific folder id
  const [activeFolder, setActiveFolder]  = useState<string | null | undefined>(undefined)
  const [discipline,   setDiscipline]    = useState('')
  const [editWork,     setEditWork]      = useState<{ src: string; format: typeof CANVAS_FORMATS[number] } | null>(null)

  function handleEditWork(work: StudioWorkFull) {
    const fmt = CANVAS_FORMATS.find(f => f.label === work.format) ?? CANVAS_FORMATS[0]
    const src = work.fileUrl ?? work.fileData ?? ''
    setDiscipline(work.discipline)
    setEditWork({ src, format: fmt })
    setView('workspace')
  }

  const disciplineLabel = DISCIPLINES.find(d => d.value === discipline)?.label ?? discipline

  // Fetch works (optionally scoped to a folder) and the folder list when switching to library
  const loadWorks = useCallback(async () => {
    setWorksLoading(true)
    try { setWorks(await fetchWorks(activeFolder)) } finally { setWorksLoading(false) }
  }, [activeFolder])

  const loadFolders = useCallback(async () => {
    setFolders(await fetchFolders())
  }, [])

  useEffect(() => {
    if (view === 'library') loadWorks()
  }, [view, loadWorks])

  useEffect(() => {
    if (view === 'library' || showSave) loadFolders()
  }, [view, showSave, loadFolders])

  async function handleCreateFolder(name: string) {
    const folder = await createFolder(name)
    setFolders(prev => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)))
    setActiveFolder(folder._id)
  }

  async function handleDeleteFolder(id: string) {
    await deleteFolderApi(id)
    setFolders(prev => prev.filter(f => f._id !== id))
    if (activeFolder === id) setActiveFolder(undefined)
    else loadWorks()
  }

  async function handleMoveWork(id: string, folder: string | null) {
    await moveWork(id, folder)
    // The work no longer belongs in the currently active folder view (unless moved within "All")
    if (activeFolder !== undefined) setWorks(prev => prev.filter(w => w._id !== id))
    else loadWorks()
  }

  // Save work — audio studios save audio when a recording exists, otherwise fall back to PNG
  async function handleSave(title: string, folderOpts: { folder?: string; newFolderName?: string }) {
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
        ...folderOpts,
      })
      setShowSave(false)
      setIsDirty(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      canvasRef.current?.clearDraft()
      if (folderOpts.newFolderName) loadFolders()
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
    const src = work.fileUrl ?? work.fileData ?? ''
    downloadFile(src, `${title.replace(/\s+/g, '-')}.${ext}`)
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
        <DcipLogoLink />
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
                onClick={() => { setView('choose'); setEditWork(null) }}
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
          <div className="flex-1 overflow-y-auto bg-surface-warm">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-10 pb-6">
              <h2 className="text-text-primary font-bold text-2xl sm:text-3xl mb-2">Choose Your Studio</h2>
              <p className="text-text-secondary text-sm sm:text-base">
                Select a discipline to begin your session.
              </p>
            </div>
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {DISCIPLINES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => { setDiscipline(d.value); setView('workspace') }}
                    className="bg-white border border-surface-border rounded-2xl overflow-hidden text-left hover:border-primary hover:shadow-lg transition-all group"
                  >
                    <div className="h-1 w-full bg-primary group-hover:bg-primary transition-colors" />
                    <div className="p-6 lg:p-8">
                      <p className="text-text-primary font-bold text-base lg:text-lg mb-2">{d.label}</p>
                      <p className="text-text-secondary text-sm leading-relaxed">{d.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <Footer />
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
            initialFormat={editWork?.format ?? CANVAS_FORMATS[0]}
            onDirty={() => setIsDirty(true)}
            draftKey={editWork ? undefined : `${user?.id ?? 'anon'}:studio:${discipline}`}
            initialDrawImage={editWork?.src}
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
              onEdit={handleEditWork}
              folders={folders}
              activeFolder={activeFolder}
              onSelectFolder={setActiveFolder}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onMove={handleMoveWork}
            />
          </div>
        )}
      </div>

      {/* Save dialog */}
      {showSave && (
        <SaveDialog
          discipline={disciplineLabel}
          format={activeStudio()?.getFormat().label ?? ''}
          folders={folders}
          onSave={handleSave}
          onCancel={() => setShowSave(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
