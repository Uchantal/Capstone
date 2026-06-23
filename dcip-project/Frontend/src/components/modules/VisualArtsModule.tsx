import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import VisualArtsToolbar from '../canvas/VisualArtsToolbar'
import SessionNotepad from '../canvas/SessionNotepad'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>
  step: number
  onInteraction?: () => void
  onColourUsed?: (colour: string) => void
  onToolChange?: (tool: string) => void
  sidebarFooter?: React.ReactNode
}

type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle'
type ShapeMode = 'outline' | 'fill'

interface HistoryEntry {
  drawSnapshot:  string
  shapeSnapshot: string
}

const MAX_HISTORY = 30

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

export default function VisualArtsModule({ canvasRef, step: _step, onInteraction, onColourUsed, onToolChange, sidebarFooter }: Props) {
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [tool,        setTool]        = useState<Tool>('brush')
  const [colour,      setColour]      = useState('#1A1A1A')
  const [bgColour,    setBgColour]    = useState('#EFEFEF')
  const [size,        setSize]        = useState(6)
  const [shapeMode,   setShapeMode]   = useState<ShapeMode>('fill')
  const [showConfirm, setShowConfirm] = useState(false)
  const [canUndo,     setCanUndo]     = useState(false)
  const [canRedo,     setCanRedo]     = useState(false)
  const [shapeDim, setShapeDim] = useState<{ cx: number; bottom: number; w: number; h: number } | null>(null)

  // Canvas layers (bottom to top):
  //   bgCanvasRef    — solid background colour fill
  //   shapeCanvasRef — shape tool strokes (line/rect/circle); eraser cannot touch this layer
  //   drawCanvasRef  — freehand brush and eraser strokes
  //   canvasRef      — hidden composite used only for toDataURL() saves (prop from parent)
  const bgCanvasRef    = useRef<HTMLCanvasElement>(null)
  const shapeCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef  = useRef<HTMLCanvasElement>(null)

  // Container div reference for ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null)

  // Mutable refs for hot-path drawing; avoids stale closures in event handlers
  const drawing       = useRef(false)
  const lastPos       = useRef({ x: 0, y: 0 })
  const startPos      = useRef({ x: 0, y: 0 })
  const previewData   = useRef<ImageData | null>(null)
  const historyRef    = useRef<HistoryEntry[]>([])
  const historyIdx    = useRef(-1)
  const bgRef         = useRef('#EFEFEF')
  const toolRef       = useRef<Tool>('brush')
  const colourRef     = useRef('#1A1A1A')
  const sizeRef       = useRef(6)
  const shapeModeRef  = useRef<ShapeMode>('outline')

  useEffect(() => { toolRef.current      = tool      }, [tool])
  useEffect(() => { colourRef.current    = colour    }, [colour])
  useEffect(() => { sizeRef.current      = size      }, [size])
  useEffect(() => { shapeModeRef.current = shapeMode }, [shapeMode])

  // ── Composite render ──────────────────────────────────────────────────────
  const renderComposite = useCallback(() => {
    const bg    = bgCanvasRef.current
    const shape = shapeCanvasRef.current
    const draw  = drawCanvasRef.current
    const out   = canvasRef.current
    if (!bg || !shape || !draw || !out) return
    const ctx = out.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, out.width, out.height)
    ctx.drawImage(bg,    0, 0)
    ctx.drawImage(shape, 0, 0)
    ctx.drawImage(draw,  0, 0)
  }, [canvasRef])

  // ── History ───────────────────────────────────────────────────────────────
  const saveToHistory = useCallback(() => {
    const draw  = drawCanvasRef.current
    const shape = shapeCanvasRef.current
    if (!draw || !shape) return
    const entry: HistoryEntry = {
      drawSnapshot:  draw.toDataURL(),
      shapeSnapshot: shape.toDataURL(),
    }
    const next = historyRef.current.slice(0, historyIdx.current + 1)
    next.push(entry)
    if (next.length > MAX_HISTORY) next.shift()
    historyRef.current = next
    historyIdx.current = next.length - 1
    setCanUndo(historyIdx.current > 0)
    setCanRedo(false)
  }, [])

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    const draw  = drawCanvasRef.current
    const shape = shapeCanvasRef.current
    if (!draw || !shape) return
    const drawCtx  = draw.getContext('2d', { willReadFrequently: true })
    const shapeCtx = shape.getContext('2d', { willReadFrequently: true })
    Promise.all([loadImage(entry.drawSnapshot), loadImage(entry.shapeSnapshot)])
      .then(([drawImg, shapeImg]) => {
        drawCtx?.clearRect(0, 0, draw.width, draw.height)
        drawCtx?.drawImage(drawImg, 0, 0)
        shapeCtx?.clearRect(0, 0, shape.width, shape.height)
        shapeCtx?.drawImage(shapeImg, 0, 0)
        renderComposite()
        setCanUndo(historyIdx.current > 0)
        setCanRedo(historyIdx.current < historyRef.current.length - 1)
      })
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

  // ── Initialise and keep canvas dimensions synced to container ────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let firstResize = true

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return

      const w = Math.round(width)
      const h = Math.round(height)

      const bg    = bgCanvasRef.current
      const shape = shapeCanvasRef.current
      const draw  = drawCanvasRef.current
      const out   = canvasRef.current

      // Save content from both drawing layers before resize
      const drawCtx  = draw?.getContext('2d', { willReadFrequently: true })
      const shapeCtx = shape?.getContext('2d', { willReadFrequently: true })
      const savedDraw =
        !firstResize && draw && draw.width > 0 && draw.height > 0 && drawCtx
          ? drawCtx.getImageData(0, 0, draw.width, draw.height)
          : null
      const savedShape =
        !firstResize && shape && shape.width > 0 && shape.height > 0 && shapeCtx
          ? shapeCtx.getImageData(0, 0, shape.width, shape.height)
          : null

      // Resize background canvas and refill with current bg colour
      if (bg) {
        bg.width  = w
        bg.height = h
        const bgCtx = bg.getContext('2d', { willReadFrequently: true })
        if (bgCtx) {
          bgCtx.fillStyle = bgRef.current
          bgCtx.fillRect(0, 0, w, h)
        }
      }

      // Resize shape canvas, restore saved content
      if (shape) {
        shape.width  = w
        shape.height = h
        if (savedShape && shapeCtx) shapeCtx.putImageData(savedShape, 0, 0)
      }

      // Resize draw canvas, restore saved content
      if (draw) {
        draw.width  = w
        draw.height = h
        if (savedDraw && drawCtx) drawCtx.putImageData(savedDraw, 0, 0)
      }

      // Resize hidden composite canvas
      if (out) { out.width = w; out.height = h }

      renderComposite()

      // Initialise history on first valid resize only
      if (firstResize && draw && shape) {
        const entry: HistoryEntry = {
          drawSnapshot:  draw.toDataURL(),
          shapeSnapshot: shape.toDataURL(),
        }
        historyRef.current = [entry]
        historyIdx.current = 0
        setCanUndo(false)
        setCanRedo(false)
        firstResize = false
      }
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drawing ───────────────────────────────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const draw  = drawCanvasRef.current
    const shape = shapeCanvasRef.current
    if (!draw) return
    drawing.current  = true
    const pos        = getPos(e, draw)
    startPos.current = pos
    lastPos.current  = pos
    const t = toolRef.current
    // For shape tools, capture the current shape layer as the undo baseline
    if (t === 'line' || t === 'rect' || t === 'circle') {
      const shapeCtx = shape?.getContext('2d', { willReadFrequently: true })
      if (shapeCtx && shape) {
        previewData.current = shapeCtx.getImageData(0, 0, shape.width, shape.height)
      }
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const drawCanvas  = drawCanvasRef.current
    const shapeCanvas = shapeCanvasRef.current
    if (!drawCanvas) return
    const ctx      = drawCanvas.getContext('2d', { willReadFrequently: true })
    const shapeCtx = shapeCanvas?.getContext('2d', { willReadFrequently: true })
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
        // destination-out removes pixels from the draw layer only.
        // shapeCanvasRef is intentionally untouched — shapes survive the eraser.
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
        if (!previewData.current || !shapeCtx || !shapeCanvas) break
        shapeCtx.putImageData(previewData.current, 0, 0)
        shapeCtx.save()
        shapeCtx.beginPath()
        shapeCtx.strokeStyle = colourRef.current
        shapeCtx.lineWidth   = sizeRef.current
        shapeCtx.lineCap     = 'round'
        shapeCtx.moveTo(startPos.current.x, startPos.current.y)
        shapeCtx.lineTo(pos.x, pos.y)
        shapeCtx.stroke()
        shapeCtx.restore()
        break
      }
      case 'rect': {
        if (!previewData.current || !shapeCtx || !shapeCanvas) break
        shapeCtx.putImageData(previewData.current, 0, 0)
        const rw = pos.x - startPos.current.x
        const rh = pos.y - startPos.current.y
        shapeCtx.save()
        shapeCtx.globalCompositeOperation = 'source-over'
        shapeCtx.globalAlpha = 1
        if (shapeModeRef.current === 'fill') {
          shapeCtx.fillStyle = colourRef.current
          shapeCtx.fillRect(startPos.current.x, startPos.current.y, rw, rh)
        } else {
          shapeCtx.strokeStyle = colourRef.current
          shapeCtx.lineWidth   = sizeRef.current
          shapeCtx.strokeRect(startPos.current.x, startPos.current.y, rw, rh)
        }
        shapeCtx.restore()
        setShapeDim({
          cx: startPos.current.x + rw / 2,
          bottom: Math.max(startPos.current.y, startPos.current.y + rh),
          w: Math.abs(rw),
          h: Math.abs(rh),
        })
        break
      }
      case 'circle': {
        if (!previewData.current || !shapeCtx || !shapeCanvas) break
        shapeCtx.putImageData(previewData.current, 0, 0)
        const rx = Math.abs(pos.x - startPos.current.x) / 2
        const ry = Math.abs(pos.y - startPos.current.y) / 2
        const cx = (startPos.current.x + pos.x) / 2
        const cy = (startPos.current.y + pos.y) / 2
        shapeCtx.save()
        shapeCtx.globalCompositeOperation = 'source-over'
        shapeCtx.globalAlpha = 1
        shapeCtx.beginPath()
        shapeCtx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        if (shapeModeRef.current === 'fill') {
          shapeCtx.fillStyle = colourRef.current
          shapeCtx.fill()
        } else {
          shapeCtx.strokeStyle = colourRef.current
          shapeCtx.lineWidth   = sizeRef.current
          shapeCtx.stroke()
        }
        shapeCtx.restore()
        setShapeDim({
          cx: (startPos.current.x + pos.x) / 2,
          bottom: Math.max(startPos.current.y, pos.y),
          w: Math.abs(pos.x - startPos.current.x),
          h: Math.abs(pos.y - startPos.current.y),
        })
        break
      }
    }
  }

  const stopDraw = () => {
    if (!drawing.current) return
    drawing.current     = false
    previewData.current = null
    saveToHistory()
    renderComposite()
    onInteraction?.()
    if (toolRef.current !== 'eraser') {
      onColourUsed?.(colourRef.current)
    }
  }

  // ── Background colour ─────────────────────────────────────────────────────
  const changeBgColour = (newBg: string) => {
    bgRef.current = newBg
    setBgColour(newBg)
    const bg = bgCanvasRef.current
    if (!bg) return
    const ctx = bg.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.fillStyle = newBg
    ctx.fillRect(0, 0, bg.width, bg.height)
    renderComposite()
    onInteraction?.()
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  const confirmClear = () => {
    const draw  = drawCanvasRef.current
    const shape = shapeCanvasRef.current
    if (!draw || !shape) return
    draw.getContext('2d', { willReadFrequently: true })?.clearRect(0, 0, draw.width, draw.height)
    shape.getContext('2d', { willReadFrequently: true })?.clearRect(0, 0, shape.width, shape.height)
    renderComposite()
    saveToHistory()
    setShowConfirm(false)
  }

  useEffect(() => {
    if (tool !== 'rect' && tool !== 'circle') setShapeDim(null)
  }, [tool])

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-surface-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <p className="text-text-primary font-semibold text-sm mb-2">Clear the entire canvas?</p>
            <p className="text-text-secondary text-xs mb-5">
              This removes all drawn content. You can undo it immediately after with Ctrl+Z.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-border text-text-secondary hover:border-primary/40 hover:bg-white transition-colors font-medium"
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

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* ── Instructions panel (leftmost, 40%) ── */}
        {sidebarFooter && (
          <div
            className="flex-shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden"
            style={{ width: panelCollapsed ? '2rem' : '40%', minWidth: panelCollapsed ? 'auto' : '320px', transition: 'width 200ms ease' }}
          >
            <div className="h-8 flex-shrink-0 flex items-center justify-end px-1 border-b border-surface-border">
              <button
                onClick={() => setPanelCollapsed(p => !p)}
                title={panelCollapsed ? 'Show instructions' : 'Hide instructions'}
                className="w-6 h-6 flex items-center justify-center border border-[#C8960C] bg-white text-[#1A1A1A] rounded hover:bg-[#C8960C]/10 transition-colors flex-shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {panelCollapsed
                    ? <polyline points="9 18 15 12 9 6" />
                    : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
            </div>
            {!panelCollapsed && (
              <div className="flex-1 overflow-y-auto p-6">
                {sidebarFooter}
              </div>
            )}
          </div>
        )}

        {/* ── Toolbar + Canvas (right 60%) ── */}
        <div className="flex-1 flex flex-row overflow-hidden">
        {/* ── Icon toolbar ── */}
        <VisualArtsToolbar
          activeTool={tool}
          onToolChange={(t) => { setTool(t); onToolChange?.(t) }}
          shapeMode={shapeMode}
          onShapeModeChange={setShapeMode}
          colour={colour}
          onColourChange={setColour}
          bgColour={bgColour}
          onBgColourChange={changeBgColour}
          brushSize={size}
          onBrushSizeChange={setSize}
          canUndo={canUndo}
          onUndo={undo}
          canRedo={canRedo}
          onRedo={redo}
          onClear={() => setShowConfirm(true)}
        />

        {/* ── Canvas area ──────────────────────────────────────────────────────
            Layer 1 (bgCanvasRef)    — solid background colour fill
            Layer 2 (shapeCanvasRef) — shape tools; eraser cannot reach this layer
            Layer 3 (drawCanvasRef)  — freehand brush and eraser strokes
            Layer 4 (canvasRef)      — hidden composite for toDataURL() saves
        ── */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#EFEFEF]">
          <canvas ref={bgCanvasRef}    className="absolute inset-0 block" />
          <canvas ref={shapeCanvasRef} className="absolute inset-0 pointer-events-none" />
          <canvas
            ref={drawCanvasRef}
            className="absolute inset-0 touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Dimension label — shown while drawing or after completing a rect/circle */}
          {(tool === 'rect' || tool === 'circle') && shapeDim !== null && (
            <div
              style={{
                position: 'absolute',
                left: shapeDim.cx,
                top: shapeDim.bottom,
                transform: 'translateX(-50%) translateY(4px)',
                background: 'rgba(255,255,255,0.88)',
                color: '#C9A84C',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'sans-serif',
                padding: '2px 5px',
                borderRadius: 3,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 25,
                lineHeight: 1,
              }}
            >
              {Math.round(shapeDim.w)} x {Math.round(shapeDim.h)}
            </div>
          )}

          <SessionNotepad />
        </div>
        </div>
      </div>
    </>
  )
}
