import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>
  step: number
}

type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'ruler'
type ShapeMode = 'outline' | 'fill'

interface HistoryEntry {
  snapshot: string
  bg: string
}

const QUICK_COLOURS = [
  '#1A1A1A', '#D62828', '#C8960C', '#2D6A4F',
  '#3B82F6', '#9333EA', '#F97316', '#FFFFFF',
]

const BG_PRESETS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Cream', value: '#FAFAF7' },
  { label: 'Grey',  value: '#D1D5DB' },
  { label: 'Black', value: '#111111' },
]

const TOOL_LIST: { id: Tool; label: string }[] = [
  { id: 'brush',  label: 'Brush'     },
  { id: 'eraser', label: 'Eraser'    },
  { id: 'line',   label: 'Line'      },
  { id: 'rect',   label: 'Rectangle' },
  { id: 'circle', label: 'Ellipse'   },
  { id: 'ruler',  label: 'Ruler'     },
]

const MAX_HISTORY = 30
const BTN_BASE     = 'text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium'
const BTN_ACTIVE   = 'bg-primary text-white border-primary'
const BTN_INACTIVE = 'border-border text-text-secondary hover:border-primary/40 hover:bg-white'

function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width  / rect.width
  const sy = canvas.height / rect.height
  if ('touches' in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * sx,
      y: (e.touches[0].clientY - rect.top)  * sy,
    }
  }
  return {
    x: (e.clientX - rect.left) * sx,
    y: (e.clientY - rect.top)  * sy,
  }
}

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  )
}

export default function VisualArtsModule({ canvasRef, step }: Props) {
  const [tool,        setTool]        = useState<Tool>('brush')
  const [colour,      setColour]      = useState('#1A1A1A')
  const [bgColour,    setBgColour]    = useState('#FAFAF7')
  const [size,        setSize]        = useState(6)
  const [shapeMode,   setShapeMode]   = useState<ShapeMode>('outline')
  const [showConfirm, setShowConfirm] = useState(false)
  const [canUndo,     setCanUndo]     = useState(false)
  const [canRedo,     setCanRedo]     = useState(false)

  // Mutable refs for hot-path drawing; avoids stale closures in event handlers
  const overlayRef   = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const drawing      = useRef(false)
  const lastPos      = useRef({ x: 0, y: 0 })
  const startPos     = useRef({ x: 0, y: 0 })
  const previewData  = useRef<ImageData | null>(null)
  const historyRef   = useRef<HistoryEntry[]>([])
  const historyIdx   = useRef(-1)
  const bgRef        = useRef('#FAFAF7')
  const toolRef      = useRef<Tool>('brush')
  const colourRef    = useRef('#1A1A1A')
  const sizeRef      = useRef(6)
  const shapeModeRef = useRef<ShapeMode>('outline')

  useEffect(() => { toolRef.current      = tool      }, [tool])
  useEffect(() => { colourRef.current    = colour    }, [colour])
  useEffect(() => { sizeRef.current      = size      }, [size])
  useEffect(() => { shapeModeRef.current = shapeMode }, [shapeMode])

  // ── Composite render ──────────────────────────────────────────────────────
  // Paints background fill + offscreen drawing onto the visible canvas (canvasRef).
  // SessionPage calls canvasRef.current.toDataURL() to save — it always captures
  // the full composite including background colour and all drawn content.
  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current
    const off    = offscreenRef.current
    if (!canvas || !off) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgRef.current
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(off, 0, 0)
  }, [canvasRef])

  // ── History ───────────────────────────────────────────────────────────────
  const saveToHistory = useCallback(() => {
    const off = offscreenRef.current
    if (!off) return
    const entry: HistoryEntry = { snapshot: off.toDataURL(), bg: bgRef.current }
    const next = historyRef.current.slice(0, historyIdx.current + 1)
    next.push(entry)
    if (next.length > MAX_HISTORY) next.shift()
    historyRef.current = next
    historyIdx.current = next.length - 1
    setCanUndo(historyIdx.current > 0)
    setCanRedo(false)
  }, [])

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    const off = offscreenRef.current
    if (!off) return
    const ctx = off.getContext('2d')
    if (!ctx) return
    bgRef.current = entry.bg
    setBgColour(entry.bg)
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, off.width, off.height)
      ctx.drawImage(img, 0, 0)
      renderComposite()
      setCanUndo(historyIdx.current > 0)
      setCanRedo(historyIdx.current < historyRef.current.length - 1)
    }
    img.src = entry.snapshot
  }, [renderComposite])

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return
    historyIdx.current--
    applyHistoryEntry(historyRef.current[historyIdx.current])
  }, [applyHistoryEntry])

  const redo = useCallback(() => {
    if (historyIdx.current >= historyRef.current.length - 1) return
    historyIdx.current++
    applyHistoryEntry(historyRef.current[historyIdx.current])
  }, [applyHistoryEntry])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return
      if (e.shiftKey && (e.key === 'Z' || e.key === 'z')) { e.preventDefault(); redo() }
      else if (!e.shiftKey && e.key === 'z')               { e.preventDefault(); undo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ── Initialise ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const off = document.createElement('canvas')
    off.width  = canvas.width
    off.height = canvas.height
    offscreenRef.current = off
    renderComposite()
    const entry: HistoryEntry = { snapshot: off.toDataURL(), bg: bgRef.current }
    historyRef.current = [entry]
    historyIdx.current = 0
    setCanUndo(false)
    setCanRedo(false)
  // renderComposite is stable; intentionally run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Clear ruler overlay on tool switch ────────────────────────────────────
  useEffect(() => {
    if (tool !== 'ruler') {
      const ov  = overlayRef.current
      const ctx = ov?.getContext('2d')
      if (ctx && ov) ctx.clearRect(0, 0, ov.width, ov.height)
      drawing.current = false
    }
  }, [tool])

  // ── Drawing ───────────────────────────────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const off    = offscreenRef.current
    if (!canvas || !off) return
    drawing.current  = true
    const pos        = getPos(e, canvas)
    startPos.current = pos
    lastPos.current  = pos
    const t = toolRef.current
    if (t === 'line' || t === 'rect' || t === 'circle') {
      const offCtx = off.getContext('2d')
      if (offCtx) previewData.current = offCtx.getImageData(0, 0, off.width, off.height)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const off    = offscreenRef.current
    if (!canvas || !off) return
    const offCtx = off.getContext('2d')
    if (!offCtx) return
    const pos = getPos(e, canvas)
    const t   = toolRef.current

    switch (t) {
      case 'brush': {
        offCtx.save()
        offCtx.globalCompositeOperation = 'source-over'
        offCtx.beginPath()
        offCtx.strokeStyle = colourRef.current
        offCtx.lineWidth   = sizeRef.current
        offCtx.lineCap     = 'round'
        offCtx.lineJoin    = 'round'
        offCtx.moveTo(lastPos.current.x, lastPos.current.y)
        offCtx.lineTo(pos.x, pos.y)
        offCtx.stroke()
        offCtx.restore()
        lastPos.current = pos
        break
      }
      case 'eraser': {
        // destination-out removes offscreen pixels, revealing the background
        // fill from the composite step rather than painting over it
        offCtx.save()
        offCtx.globalCompositeOperation = 'destination-out'
        offCtx.beginPath()
        offCtx.lineWidth = sizeRef.current
        offCtx.lineCap   = 'round'
        offCtx.lineJoin  = 'round'
        offCtx.moveTo(lastPos.current.x, lastPos.current.y)
        offCtx.lineTo(pos.x, pos.y)
        offCtx.stroke()
        offCtx.restore()
        lastPos.current = pos
        break
      }
      case 'line': {
        if (!previewData.current) break
        offCtx.putImageData(previewData.current, 0, 0)
        offCtx.save()
        offCtx.beginPath()
        offCtx.strokeStyle = colourRef.current
        offCtx.lineWidth   = sizeRef.current
        offCtx.lineCap     = 'round'
        offCtx.moveTo(startPos.current.x, startPos.current.y)
        offCtx.lineTo(pos.x, pos.y)
        offCtx.stroke()
        offCtx.restore()
        break
      }
      case 'rect': {
        if (!previewData.current) break
        offCtx.putImageData(previewData.current, 0, 0)
        const rw = pos.x - startPos.current.x
        const rh = pos.y - startPos.current.y
        offCtx.save()
        if (shapeModeRef.current === 'fill') {
          offCtx.fillStyle = colourRef.current
          offCtx.fillRect(startPos.current.x, startPos.current.y, rw, rh)
        } else {
          offCtx.strokeStyle = colourRef.current
          offCtx.lineWidth   = sizeRef.current
          offCtx.strokeRect(startPos.current.x, startPos.current.y, rw, rh)
        }
        offCtx.restore()
        break
      }
      case 'circle': {
        if (!previewData.current) break
        offCtx.putImageData(previewData.current, 0, 0)
        const rx = Math.abs(pos.x - startPos.current.x) / 2
        const ry = Math.abs(pos.y - startPos.current.y) / 2
        const cx = (startPos.current.x + pos.x) / 2
        const cy = (startPos.current.y + pos.y) / 2
        offCtx.save()
        offCtx.beginPath()
        offCtx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        if (shapeModeRef.current === 'fill') {
          offCtx.fillStyle = colourRef.current
          offCtx.fill()
        } else {
          offCtx.strokeStyle = colourRef.current
          offCtx.lineWidth   = sizeRef.current
          offCtx.stroke()
        }
        offCtx.restore()
        break
      }
    }
    renderComposite()
  }

  const stopDraw = () => {
    if (!drawing.current) return
    drawing.current    = false
    previewData.current = null
    saveToHistory()
  }

  // ── Background colour ─────────────────────────────────────────────────────
  // Only updates bgRef and re-renders the composite; the offscreen drawing
  // layer is left untouched so existing strokes are preserved.
  const changeBgColour = (newBg: string) => {
    bgRef.current = newBg
    setBgColour(newBg)
    renderComposite()
    saveToHistory()
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  const confirmClear = () => {
    const off = offscreenRef.current
    if (!off) return
    const ctx = off.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, off.width, off.height)
    renderComposite()
    saveToHistory()
    setShowConfirm(false)
  }

  // ── Ruler (overlay canvas) ────────────────────────────────────────────────
  // Temporary dashed guide drawn on the overlay; cleared on mouse-up or
  // tool switch without touching the artwork canvas.
  const startRuler = (e: React.MouseEvent) => {
    const ov = overlayRef.current
    if (!ov) return
    drawing.current  = true
    const rect        = ov.getBoundingClientRect()
    startPos.current  = {
      x: (e.clientX - rect.left) * (ov.width  / rect.width),
      y: (e.clientY - rect.top)  * (ov.height / rect.height),
    }
  }

  const drawRuler = (e: React.MouseEvent) => {
    if (!drawing.current) return
    const ov = overlayRef.current
    if (!ov) return
    const ctx  = ov.getContext('2d')
    if (!ctx) return
    const rect = ov.getBoundingClientRect()
    const pos  = {
      x: (e.clientX - rect.left) * (ov.width  / rect.width),
      y: (e.clientY - rect.top)  * (ov.height / rect.height),
    }
    ctx.clearRect(0, 0, ov.width, ov.height)
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = '#D62828'
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    ctx.moveTo(startPos.current.x, startPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.setLineDash([])
    const dx   = pos.x - startPos.current.x
    const dy   = pos.y - startPos.current.y
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
    const mx   = (startPos.current.x + pos.x) / 2
    const my   = (startPos.current.y + pos.y) / 2
    ctx.font      = 'bold 11px sans-serif'
    ctx.fillStyle = '#D62828'
    ctx.fillText(`${dist}px`, mx + 6, my - 6)
    ctx.restore()
  }

  const stopRuler = () => {
    drawing.current = false
    const ov  = overlayRef.current
    const ctx = ov?.getContext('2d')
    if (ctx && ov) ctx.clearRect(0, 0, ov.width, ov.height)
  }

  const isShapeTool = tool === 'rect' || tool === 'circle'

  return (
    <div>
      {/* ── Clear confirmation dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <p className="text-text-primary font-semibold text-sm mb-2">Clear the entire canvas?</p>
            <p className="text-text-secondary text-xs mb-5">
              This removes all drawn content. You can undo it immediately after with Ctrl+Z.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className={`${BTN_BASE} ${BTN_INACTIVE}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-[#F9F7F4] border border-border rounded-xl p-3 mb-3 flex flex-wrap gap-x-5 gap-y-3 items-start">

        {/* Tools */}
        <ToolGroup label="Tool">
          {TOOL_LIST.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`${BTN_BASE} ${tool === t.id ? BTN_ACTIVE : BTN_INACTIVE}`}
            >
              {t.label}
            </button>
          ))}
          {isShapeTool && (
            <button
              onClick={() => setShapeMode(m => m === 'outline' ? 'fill' : 'outline')}
              className={`${BTN_BASE} border-border text-text-secondary hover:bg-white`}
            >
              {shapeMode === 'outline' ? 'Outline' : 'Fill'}
            </button>
          )}
        </ToolGroup>

        {/* Colour */}
        <ToolGroup label="Colour">
          {QUICK_COLOURS.map(c => (
            <button
              key={c}
              onClick={() => setColour(c)}
              title={c}
              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-transform ${
                colour === c
                  ? 'border-text-primary scale-110'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={colour}
            onChange={e => setColour(e.target.value)}
            title="Custom colour"
            className="w-6 h-6 cursor-pointer rounded border-0 p-0"
          />
          <span
            className="w-6 h-6 rounded-full border-2 border-primary flex-shrink-0"
            style={{ backgroundColor: colour }}
            title="Active colour"
          />
        </ToolGroup>

        {/* Background */}
        <ToolGroup label="Background">
          {BG_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => changeBgColour(p.value)}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                bgColour === p.value
                  ? 'border-primary text-primary bg-primary/5 font-medium'
                  : 'border-border text-text-muted hover:border-primary/40'
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="color"
            value={bgColour}
            onChange={e => changeBgColour(e.target.value)}
            title="Custom background"
            className="w-6 h-6 cursor-pointer rounded border-0 p-0"
          />
        </ToolGroup>

        {/* Size */}
        <ToolGroup label="Size">
          <input
            type="range"
            min={2}
            max={40}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-text-secondary text-xs w-8">{size}px</span>
        </ToolGroup>

        {/* History */}
        <ToolGroup label="History">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`${BTN_BASE} ${BTN_INACTIVE} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={`${BTN_BASE} ${BTN_INACTIVE} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Redo
          </button>
        </ToolGroup>

        {/* Actions */}
        <ToolGroup label="Actions">
          <button
            onClick={() => setShowConfirm(true)}
            className={`${BTN_BASE} border-border text-text-secondary hover:text-accent hover:border-accent`}
          >
            Clear
          </button>
        </ToolGroup>
      </div>

      {/* ── Canvas stack ── */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className={`w-full border border-border rounded-xl touch-none block ${
            tool === 'ruler' ? 'pointer-events-none' : 'cursor-crosshair'
          }`}
          onMouseDown={tool  !== 'ruler' ? startDraw : undefined}
          onMouseMove={tool  !== 'ruler' ? draw      : undefined}
          onMouseUp={tool    !== 'ruler' ? stopDraw  : undefined}
          onMouseLeave={tool !== 'ruler' ? stopDraw  : undefined}
          onTouchStart={tool !== 'ruler' ? startDraw : undefined}
          onTouchMove={tool  !== 'ruler' ? draw      : undefined}
          onTouchEnd={tool   !== 'ruler' ? stopDraw  : undefined}
        />
        {/* Overlay: ruler guides only — pointer-events toggled by tool selection */}
        <canvas
          ref={overlayRef}
          width={700}
          height={400}
          className={`absolute inset-0 w-full h-full rounded-xl ${
            tool === 'ruler' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
          }`}
          onMouseDown={tool  === 'ruler' ? startRuler : undefined}
          onMouseMove={tool  === 'ruler' ? drawRuler  : undefined}
          onMouseUp={tool    === 'ruler' ? stopRuler  : undefined}
          onMouseLeave={tool === 'ruler' ? stopRuler  : undefined}
        />
      </div>

      {step >= 3 && (
        <p className="text-text-secondary text-xs mt-3">
          Try adding darker shading by using a darker colour on the same shape
        </p>
      )}
    </div>
  )
}
