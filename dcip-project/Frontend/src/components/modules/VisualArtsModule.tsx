import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>
  step: number
  onInteraction?: () => void
}

type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'ruler'
type ShapeMode = 'outline' | 'fill'

interface HistoryEntry {
  snapshot: string
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

export default function VisualArtsModule({ canvasRef, step, onInteraction }: Props) {
  const [tool,        setTool]        = useState<Tool>('brush')
  const [colour,      setColour]      = useState('#1A1A1A')
  const [bgColour,    setBgColour]    = useState('#FAFAF7')
  const [size,        setSize]        = useState(6)
  const [shapeMode,   setShapeMode]   = useState<ShapeMode>('fill')
  const [showConfirm, setShowConfirm] = useState(false)
  const [canUndo,     setCanUndo]     = useState(false)
  const [canRedo,     setCanRedo]     = useState(false)

  // Two visible layers: background canvas (bottom) and drawing canvas (top).
  // The prop canvasRef is kept as a hidden composite used only for toDataURL().
  const bgCanvasRef   = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)

  // Mutable refs for hot-path drawing; avoids stale closures in event handlers
  const overlayRef    = useRef<HTMLCanvasElement>(null)
  const drawing       = useRef(false)
  const lastPos       = useRef({ x: 0, y: 0 })
  const startPos      = useRef({ x: 0, y: 0 })
  const previewData   = useRef<ImageData | null>(null)
  const historyRef    = useRef<HistoryEntry[]>([])
  const historyIdx    = useRef(-1)
  const bgRef         = useRef('#FAFAF7')
  const toolRef       = useRef<Tool>('brush')
  const colourRef     = useRef('#1A1A1A')
  const sizeRef       = useRef(6)
  const shapeModeRef  = useRef<ShapeMode>('outline')

  useEffect(() => { toolRef.current      = tool      }, [tool])
  useEffect(() => { colourRef.current    = colour    }, [colour])
  useEffect(() => { sizeRef.current      = size      }, [size])
  useEffect(() => { shapeModeRef.current = shapeMode }, [shapeMode])

  // ── Composite render ──────────────────────────────────────────────────────
  // Composites both visible layers onto canvasRef so the parent can call
  // canvasRef.current.toDataURL() and receive the full artwork including
  // background colour. Called after every completed stroke and bg change.
  const renderComposite = useCallback(() => {
    const bg   = bgCanvasRef.current
    const draw = drawCanvasRef.current
    const out  = canvasRef.current
    if (!bg || !draw || !out) return
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, out.width, out.height)
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(draw, 0, 0)
  }, [canvasRef])

  // ── History ───────────────────────────────────────────────────────────────
  // Only the drawing layer is snapshotted. Background colour changes are
  // intentional and separate; they are not part of the undo stack.
  const saveToHistory = useCallback(() => {
    const draw = drawCanvasRef.current
    if (!draw) return
    const entry: HistoryEntry = { snapshot: draw.toDataURL() }
    const next = historyRef.current.slice(0, historyIdx.current + 1)
    next.push(entry)
    if (next.length > MAX_HISTORY) next.shift()
    historyRef.current = next
    historyIdx.current = next.length - 1
    setCanUndo(historyIdx.current > 0)
    setCanRedo(false)
  }, [])

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    const draw = drawCanvasRef.current
    if (!draw) return
    const ctx = draw.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, draw.width, draw.height)
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
    const bg   = bgCanvasRef.current
    const draw = drawCanvasRef.current
    if (!bg || !draw) return
    const bgCtx = bg.getContext('2d')
    if (bgCtx) {
      bgCtx.fillStyle = bgRef.current
      bgCtx.fillRect(0, 0, bg.width, bg.height)
    }
    // Drawing canvas starts fully transparent — no fill needed
    renderComposite()
    const entry: HistoryEntry = { snapshot: draw.toDataURL() }
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
    const draw = drawCanvasRef.current
    if (!draw) return
    drawing.current  = true
    const pos        = getPos(e, draw)
    startPos.current = pos
    lastPos.current  = pos
    const t = toolRef.current
    if (t === 'line' || t === 'rect' || t === 'circle') {
      const ctx = draw.getContext('2d')
      if (ctx) previewData.current = ctx.getImageData(0, 0, draw.width, draw.height)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    const ctx = drawCanvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, drawCanvas)
    const t   = toolRef.current

    switch (t) {
      case 'brush': {
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.beginPath()
        ctx.strokeStyle = colourRef.current
        ctx.lineWidth   = sizeRef.current
        ctx.lineCap     = 'round'
        ctx.lineJoin    = 'round'
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.restore()
        lastPos.current = pos
        break
      }
      case 'eraser': {
        // destination-out removes pixels from the drawing layer, revealing
        // the background canvas beneath without destroying any drawn content
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
        ctx.beginPath()
        ctx.lineWidth = sizeRef.current
        ctx.lineCap   = 'round'
        ctx.lineJoin  = 'round'
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.restore()
        lastPos.current = pos
        break
      }
      case 'line': {
        if (!previewData.current) break
        ctx.putImageData(previewData.current, 0, 0)
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = colourRef.current
        ctx.lineWidth   = sizeRef.current
        ctx.lineCap     = 'round'
        ctx.moveTo(startPos.current.x, startPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'rect': {
        if (!previewData.current) break
        ctx.putImageData(previewData.current, 0, 0)
        const rw = pos.x - startPos.current.x
        const rh = pos.y - startPos.current.y
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        if (shapeModeRef.current === 'fill') {
          ctx.fillStyle = colourRef.current
          ctx.fillRect(startPos.current.x, startPos.current.y, rw, rh)
        } else {
          ctx.strokeStyle = colourRef.current
          ctx.lineWidth   = sizeRef.current
          ctx.strokeRect(startPos.current.x, startPos.current.y, rw, rh)
        }
        ctx.restore()
        break
      }
      case 'circle': {
        if (!previewData.current) break
        ctx.putImageData(previewData.current, 0, 0)
        const rx = Math.abs(pos.x - startPos.current.x) / 2
        const ry = Math.abs(pos.y - startPos.current.y) / 2
        const cx = (startPos.current.x + pos.x) / 2
        const cy = (startPos.current.y + pos.y) / 2
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        if (shapeModeRef.current === 'fill') {
          ctx.fillStyle = colourRef.current
          ctx.fill()
        } else {
          ctx.strokeStyle = colourRef.current
          ctx.lineWidth   = sizeRef.current
          ctx.stroke()
        }
        ctx.restore()
        break
      }
    }
    // No renderComposite() here — the drawing canvas is visible directly;
    // visual feedback is immediate without any re-compositing step
  }

  const stopDraw = () => {
    if (!drawing.current) return
    drawing.current    = false
    previewData.current = null
    saveToHistory()
    renderComposite()
    onInteraction?.()
  }

  // ── Background colour ─────────────────────────────────────────────────────
  // Fills only the background canvas. The drawing layer is completely untouched.
  // Background changes are not added to the undo history.
  const changeBgColour = (newBg: string) => {
    bgRef.current = newBg
    setBgColour(newBg)
    const bg = bgCanvasRef.current
    if (!bg) return
    const ctx = bg.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = newBg
    ctx.fillRect(0, 0, bg.width, bg.height)
    renderComposite()
    onInteraction?.()
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  const confirmClear = () => {
    const draw = drawCanvasRef.current
    if (!draw) return
    const ctx = draw.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, draw.width, draw.height)
    renderComposite()
    saveToHistory()
    setShowConfirm(false)
  }

  // ── Ruler (overlay canvas) ────────────────────────────────────────────────
  // Temporary dashed guide drawn on the overlay; cleared on mouse-up or
  // tool switch without touching the artwork canvases.
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
            <>
              <button
                onClick={() => setShapeMode('fill')}
                className={`${BTN_BASE} ${shapeMode === 'fill' ? BTN_ACTIVE : BTN_INACTIVE}`}
              >
                Fill
              </button>
              <button
                onClick={() => setShapeMode('outline')}
                className={`${BTN_BASE} ${shapeMode === 'outline' ? BTN_ACTIVE : BTN_INACTIVE}`}
              >
                Outline
              </button>
            </>
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

      {/* ── Canvas stack ────────────────────────────────────────────────────────
          Border and rounding live on the container so all layers clip together.

          Layer 1 (bgCanvasRef)   — background colour fill, sets container height
          Layer 2 (drawCanvasRef) — all drawing content, transparent background
          Layer 3 (overlayRef)    — ruler guide overlay only
          Layer 4 (canvasRef)     — hidden composite kept for toDataURL() saves
      ── */}
      <div className="relative border border-border rounded-xl overflow-hidden">
        <canvas
          ref={bgCanvasRef}
          width={700}
          height={400}
          className="w-full block"
        />
        <canvas
          ref={drawCanvasRef}
          width={700}
          height={400}
          className={`absolute inset-0 w-full h-full touch-none ${
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
        <canvas
          ref={overlayRef}
          width={700}
          height={400}
          className={`absolute inset-0 w-full h-full ${
            tool === 'ruler' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
          }`}
          onMouseDown={tool  === 'ruler' ? startRuler : undefined}
          onMouseMove={tool  === 'ruler' ? drawRuler  : undefined}
          onMouseUp={tool    === 'ruler' ? stopRuler  : undefined}
          onMouseLeave={tool === 'ruler' ? stopRuler  : undefined}
        />
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="hidden"
        />
      </div>

    </div>
  )
}
