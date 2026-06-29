import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import VisualArtsToolbar from '../canvas/VisualArtsToolbar'
import SessionNotepad from '../canvas/SessionNotepad'

interface Props {
  step: number
  onInteraction?: () => void
  onColourUsed?: (colour: string) => void
  onToolChange?: (tool: string) => void
  sidebarFooter?: React.ReactNode
  initialSnapshot?: string
}

export interface VisualArtsModuleHandle {
  captureCleanImage: () => string
  getSnapshot: () => string
  loadSnapshot: (data: string) => void
}

export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'select' | 'ruler'
type ShapeMode = 'outline' | 'fill'

export interface Shape {
  id: string
  type: 'rect' | 'circle' | 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  lineWidth: number
  mode: ShapeMode
}

interface HistoryEntry {
  drawSnapshot:  string
  eraseSnapshot: string
  shapes: Shape[]
}

const MAX_HISTORY = 30

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  if ('touches' in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * sx,
      y: (e.touches[0].clientY - rect.top) * sy,
    }
  }
  return {
    x: (e.clientX - rect.left) * sx,
    y: (e.clientY - rect.top) * sy,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

function paintShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  if (s.type === 'rect') {
    const rw = s.x2 - s.x1
    const rh = s.y2 - s.y1
    if (s.mode === 'fill') {
      ctx.fillStyle = s.color
      ctx.fillRect(s.x1, s.y1, rw, rh)
    } else {
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.lineWidth
      ctx.strokeRect(s.x1, s.y1, rw, rh)
    }
  } else if (s.type === 'circle') {
    const rx = Math.abs(s.x2 - s.x1) / 2
    const ry = Math.abs(s.y2 - s.y1) / 2
    const cx = (s.x1 + s.x2) / 2
    const cy = (s.y1 + s.y2) / 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
    if (s.mode === 'fill') {
      ctx.fillStyle = s.color
      ctx.fill()
    } else {
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.lineWidth
      ctx.stroke()
    }
  } else if (s.type === 'line') {
    ctx.beginPath()
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.lineWidth
    ctx.lineCap = 'round'
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
  }
  ctx.restore()
}

function hitTestShape(s: Shape, x: number, y: number, pad = 8): boolean {
  const PAD = pad
  if (s.type === 'rect') {
    const minX = Math.min(s.x1, s.x2) - PAD
    const maxX = Math.max(s.x1, s.x2) + PAD
    const minY = Math.min(s.y1, s.y2) - PAD
    const maxY = Math.max(s.y1, s.y2) + PAD
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  if (s.type === 'circle') {
    const cx = (s.x1 + s.x2) / 2
    const cy = (s.y1 + s.y2) / 2
    const rx = Math.abs(s.x2 - s.x1) / 2 + PAD
    const ry = Math.abs(s.y2 - s.y1) / 2 + PAD
    if (rx <= 0 || ry <= 0) return false
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
  }
  if (s.type === 'line') {
    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const len2 = dx * dx + dy * dy
    if (len2 === 0) return Math.hypot(x - s.x1, y - s.y1) < PAD
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / len2))
    return Math.hypot(x - (s.x1 + t * dx), y - (s.y1 + t * dy)) < PAD
  }
  return false
}

const VisualArtsModule = forwardRef<VisualArtsModuleHandle, Props>(function VisualArtsModule({
  step: _step, onInteraction, onColourUsed, onToolChange, sidebarFooter, initialSnapshot,
}, ref) {
  const [panelCollapsed, setPanelCollapsed] = useState(() => window.innerWidth < 640)
  const [tool,        setTool]        = useState<Tool>('brush')
  const [colour,      setColour]      = useState('#1A1A1A')
  const [bgColour,    setBgColour]    = useState('#EFEFEF')
  const [size,        setSize]        = useState(6)
  const [shapeMode,   setShapeMode]   = useState<ShapeMode>('fill')
  const [showConfirm, setShowConfirm] = useState(false)
  const [canUndo,     setCanUndo]     = useState(false)
  const [canRedo,     setCanRedo]     = useState(false)
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [shapeDim,    setShapeDim]    = useState<{ cx: number; bottom: number; w: number; h: number } | null>(null)
  const [rulerLine,   setRulerLine]   = useState<{ x1: number; y1: number; x2: number; y2: number; dist: number } | null>(null)

  const bgCanvasRef      = useRef<HTMLCanvasElement>(null)
  const shapeCanvasRef   = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef    = useRef<HTMLCanvasElement>(null)
  const eraseCanvasRef   = useRef<HTMLCanvasElement>(null)
  const compositeRef     = useRef<HTMLCanvasElement>(null)  // hidden; export-only composite
  const containerRef     = useRef<HTMLDivElement>(null)

  // Hot-path refs (avoid stale closure in event handlers)
  const drawing           = useRef(false)
  const lastPos           = useRef({ x: 0, y: 0 })
  const startPos          = useRef({ x: 0, y: 0 })
  const historyRef        = useRef<HistoryEntry[]>([])
  const historyIdx        = useRef(-1)
  const bgRef             = useRef('#EFEFEF')
  const toolRef           = useRef<Tool>('brush')
  const colourRef         = useRef('#1A1A1A')
  const sizeRef           = useRef(6)
  const shapeModeRef      = useRef<ShapeMode>('fill')
  const shapesRef         = useRef<Shape[]>([])
  const selectedIdRef     = useRef<string | null>(null)
  const previewShapeRef   = useRef<Shape | null>(null)  // shape being drawn (not yet committed)
  const previewBaseRef    = useRef<ImageData | null>(null) // shapeCanvas state before preview
  const isDraggingShape   = useRef(false)
  const dragOffset        = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 640) setPanelCollapsed(true) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => { toolRef.current      = tool      }, [tool])
  useEffect(() => { colourRef.current    = colour    }, [colour])
  useEffect(() => { sizeRef.current      = size      }, [size])
  useEffect(() => { shapeModeRef.current = shapeMode }, [shapeMode])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  // Clear ruler when tool changes away from ruler
  useEffect(() => { if (tool !== 'ruler') setRulerLine(null) }, [tool])
  useEffect(() => { if (tool !== 'rect' && tool !== 'circle') setShapeDim(null) }, [tool])

  // ── Render shapes from object model onto shapeCanvasRef ───────────────────
  const renderShapes = useCallback((shapes: Shape[], selId: string | null) => {
    const shapeCanvas = shapeCanvasRef.current
    const eraseCanvas = eraseCanvasRef.current
    if (!shapeCanvas) return
    const ctx = shapeCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height)
    for (const s of shapes) paintShape(ctx, s)
    // Draw preview shape (being drawn, not yet committed)
    if (previewShapeRef.current) paintShape(ctx, previewShapeRef.current)
    // Apply eraser mask: punch out pixels where the eraser has painted
    if (eraseCanvas) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.drawImage(eraseCanvas, 0, 0)
      ctx.restore()
    }
    // Selection highlight (drawn after erase mask so handles are always visible)
    if (selId) {
      const sel = shapes.find(s => s.id === selId)
      if (sel) {
        ctx.save()
        ctx.setLineDash([6, 3])
        ctx.strokeStyle = '#C8960C'
        ctx.lineWidth = 1.5
        const minX = Math.min(sel.x1, sel.x2)
        const maxX = Math.max(sel.x1, sel.x2)
        const minY = Math.min(sel.y1, sel.y2)
        const maxY = Math.max(sel.y1, sel.y2)
        ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10)
        ctx.setLineDash([])
        ctx.fillStyle = '#C8960C'
        for (const [hx, hy] of [
          [minX - 5, minY - 5], [maxX + 5, minY - 5],
          [minX - 5, maxY + 5], [maxX + 5, maxY + 5],
        ]) ctx.fillRect(hx - 3, hy - 3, 6, 6)
        ctx.restore()
      }
    }
  }, [])

  // ── Composite ─────────────────────────────────────────────────────────────
  const renderComposite = useCallback(() => {
    const bg    = bgCanvasRef.current
    const shape = shapeCanvasRef.current
    const draw  = drawCanvasRef.current
    const out   = compositeRef.current
    if (!bg || !shape || !draw || !out) return
    const ctx = out.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, out.width, out.height)
    ctx.drawImage(bg,    0, 0)
    ctx.drawImage(shape, 0, 0)
    ctx.drawImage(draw,  0, 0)
  }, [])

  // ── History ───────────────────────────────────────────────────────────────
  const saveToHistory = useCallback(() => {
    const draw  = drawCanvasRef.current
    const erase = eraseCanvasRef.current
    if (!draw) return
    const entry: HistoryEntry = {
      drawSnapshot:  draw.toDataURL(),
      eraseSnapshot: erase ? erase.toDataURL() : '',
      shapes: shapesRef.current.map(s => ({ ...s })),
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
    const erase = eraseCanvasRef.current
    if (!draw) return
    const drawCtx  = draw.getContext('2d',  { willReadFrequently: true })
    const eraseCtx = erase?.getContext('2d', { willReadFrequently: true })
    const promises: Promise<HTMLImageElement>[] = [loadImage(entry.drawSnapshot)]
    if (entry.eraseSnapshot) promises.push(loadImage(entry.eraseSnapshot))
    Promise.all(promises).then(([drawImg, eraseImg]) => {
      drawCtx?.clearRect(0, 0, draw.width, draw.height)
      drawCtx?.drawImage(drawImg, 0, 0)
      if (erase && eraseCtx) {
        eraseCtx.clearRect(0, 0, erase.width, erase.height)
        if (eraseImg) eraseCtx.drawImage(eraseImg, 0, 0)
      }
      shapesRef.current = entry.shapes.map(s => ({ ...s }))
      setSelectedId(null)
      selectedIdRef.current = null
      renderShapes(shapesRef.current, null)
      renderComposite()
      setCanUndo(historyIdx.current > 0)
      setCanRedo(historyIdx.current < historyRef.current.length - 1)
    })
  }, [renderShapes, renderComposite])

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
      // Ignore if focused in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.ctrlKey) {
        if (e.shiftKey && (e.key === 'Z' || e.key === 'z')) { e.preventDefault(); redo() }
        else if (e.key === 'z') { e.preventDefault(); undo() }
        return
      }

      // Delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        e.preventDefault()
        shapesRef.current = shapesRef.current.filter(s => s.id !== selectedIdRef.current)
        setSelectedId(null)
        selectedIdRef.current = null
        renderShapes(shapesRef.current, null)
        renderComposite()
        saveToHistory()
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedId(null)
        selectedIdRef.current = null
        renderShapes(shapesRef.current, null)
        renderComposite()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, renderShapes, renderComposite, saveToHistory])

  // ── Canvas resize ─────────────────────────────────────────────────────────
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
      const erase = eraseCanvasRef.current
      const out   = compositeRef.current

      const drawCtx  = draw?.getContext('2d',  { willReadFrequently: true })
      const eraseCtx = erase?.getContext('2d', { willReadFrequently: true })
      const savedDraw = !firstResize && draw && draw.width > 0 && draw.height > 0 && drawCtx
        ? drawCtx.getImageData(0, 0, draw.width, draw.height) : null
      const savedErase = !firstResize && erase && erase.width > 0 && erase.height > 0 && eraseCtx
        ? eraseCtx.getImageData(0, 0, erase.width, erase.height) : null

      if (bg) {
        bg.width = w; bg.height = h
        const bgCtx = bg.getContext('2d', { willReadFrequently: true })
        if (bgCtx) { bgCtx.fillStyle = bgRef.current; bgCtx.fillRect(0, 0, w, h) }
      }
      if (shape) { shape.width = w; shape.height = h }
      if (draw)  { draw.width  = w; draw.height  = h; if (savedDraw  && drawCtx)  drawCtx.putImageData(savedDraw,   0, 0) }
      if (erase) { erase.width = w; erase.height = h; if (savedErase && eraseCtx) eraseCtx.putImageData(savedErase, 0, 0) }
      if (out)   { out.width   = w; out.height   = h }

      // Shapes re-rendered from object model — erase mask re-applied inside renderShapes
      renderShapes(shapesRef.current, selectedIdRef.current)
      renderComposite()

      if (firstResize && draw) {
        const entry: HistoryEntry = { drawSnapshot: draw.toDataURL(), eraseSnapshot: '', shapes: [] }
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
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    drawing.current = true
    const pos = getPos(e, drawCanvas)
    startPos.current = pos
    lastPos.current  = pos
    const t = toolRef.current

    if (t === 'select') {
      // Hit-test shapes in reverse order (topmost first)
      const found = [...shapesRef.current].reverse().find(s => hitTestShape(s, pos.x, pos.y))
      if (found) {
        setSelectedId(found.id)
        selectedIdRef.current = found.id
        isDraggingShape.current = true
        dragOffset.current = { x: pos.x - found.x1, y: pos.y - found.y1 }
      } else {
        setSelectedId(null)
        selectedIdRef.current = null
        isDraggingShape.current = false
      }
      renderShapes(shapesRef.current, selectedIdRef.current)
      renderComposite()
      return
    }

    if (t === 'ruler') return  // ruler only tracks on mousemove

    if (t === 'line' || t === 'rect' || t === 'circle') {
      // Snapshot current shapeCanvas state as the base for live preview
      const shapeCanvas = shapeCanvasRef.current
      const shapeCtx = shapeCanvas?.getContext('2d', { willReadFrequently: true })
      if (shapeCtx && shapeCanvas) {
        previewBaseRef.current = shapeCtx.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height)
      }
    }
  }

  const onDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    const ctx = drawCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const pos = getPos(e, drawCanvas)
    const t = toolRef.current

    // ── Select: drag-to-move ─────────────────────────────────────────────
    if (t === 'select') {
      if (!isDraggingShape.current || !selectedIdRef.current) return
      shapesRef.current = shapesRef.current.map(s => {
        if (s.id !== selectedIdRef.current) return s
        const w = s.x2 - s.x1
        const h = s.y2 - s.y1
        const newX1 = pos.x - dragOffset.current.x
        const newY1 = pos.y - dragOffset.current.y
        return { ...s, x1: newX1, y1: newY1, x2: newX1 + w, y2: newY1 + h }
      })
      renderShapes(shapesRef.current, selectedIdRef.current)
      renderComposite()
      return
    }

    // ── Ruler: live distance overlay ─────────────────────────────────────
    if (t === 'ruler') {
      const dist = Math.round(Math.hypot(pos.x - startPos.current.x, pos.y - startPos.current.y))
      setRulerLine({ x1: startPos.current.x, y1: startPos.current.y, x2: pos.x, y2: pos.y, dist })
      return
    }

    // ── Brush ─────────────────────────────────────────────────────────────
    if (t === 'brush') {
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
      renderComposite()
      return
    }

    // ── Eraser ────────────────────────────────────────────────────────────
    if (t === 'eraser') {
      const prevPos = lastPos.current
      lastPos.current = pos

      // Erase freehand brush strokes on draw canvas
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.beginPath()
      ctx.lineWidth = sizeRef.current
      ctx.lineCap   = 'round'
      ctx.lineJoin  = 'round'
      ctx.moveTo(prevPos.x, prevPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.restore()

      // Paint the same stroke onto the erase canvas — renderShapes applies it
      // as destination-out to punch pixel-accurate holes through shapes
      const eraseCanvas = eraseCanvasRef.current
      const eraseCtx = eraseCanvas?.getContext('2d', { willReadFrequently: true })
      if (eraseCtx) {
        eraseCtx.save()
        eraseCtx.strokeStyle = 'rgba(0,0,0,1)'
        eraseCtx.beginPath()
        eraseCtx.lineWidth = sizeRef.current
        eraseCtx.lineCap   = 'round'
        eraseCtx.lineJoin  = 'round'
        eraseCtx.moveTo(prevPos.x, prevPos.y)
        eraseCtx.lineTo(pos.x, pos.y)
        eraseCtx.stroke()
        eraseCtx.restore()
      }

      renderShapes(shapesRef.current, selectedIdRef.current)
      renderComposite()
      return
    }

    // ── Shape preview ─────────────────────────────────────────────────────
    if (t === 'line' || t === 'rect' || t === 'circle') {
      const shapeCanvas = shapeCanvasRef.current
      const shapeCtx = shapeCanvas?.getContext('2d', { willReadFrequently: true })
      if (!shapeCtx || !shapeCanvas || !previewBaseRef.current) return

      // Restore the baseline (already-committed shapes), then draw the live preview on top
      shapeCtx.putImageData(previewBaseRef.current, 0, 0)

      previewShapeRef.current = {
        id: '__preview__',
        type: t as 'line' | 'rect' | 'circle',
        x1: startPos.current.x,
        y1: startPos.current.y,
        x2: pos.x,
        y2: pos.y,
        color: colourRef.current,
        lineWidth: sizeRef.current,
        mode: shapeModeRef.current,
      }
      paintShape(shapeCtx, previewShapeRef.current)
      renderComposite()

      // Update dimension indicator
      if (t === 'rect') {
        const rw = pos.x - startPos.current.x
        const rh = pos.y - startPos.current.y
        setShapeDim({
          cx:     startPos.current.x + rw / 2,
          bottom: Math.max(startPos.current.y, startPos.current.y + rh),
          w:      Math.abs(rw),
          h:      Math.abs(rh),
        })
      } else if (t === 'circle') {
        setShapeDim({
          cx:     (startPos.current.x + pos.x) / 2,
          bottom: Math.max(startPos.current.y, pos.y),
          w:      Math.abs(pos.x - startPos.current.x),
          h:      Math.abs(pos.y - startPos.current.y),
        })
      }
    }
  }

  const stopDraw = () => {
    if (!drawing.current) return
    drawing.current = false
    const t = toolRef.current

    // ── Select: commit moved position ────────────────────────────────────
    if (t === 'select') {
      if (isDraggingShape.current) {
        isDraggingShape.current = false
        saveToHistory()
        onInteraction?.()
      }
      return
    }

    // ── Ruler: keep the line visible until next click ────────────────────
    if (t === 'ruler') return

    // ── Shapes: commit preview to object model ───────────────────────────
    if (t === 'line' || t === 'rect' || t === 'circle') {
      if (previewShapeRef.current) {
        const committed: Shape = {
          ...previewShapeRef.current,
          id: uid(),
        }
        previewShapeRef.current = null
        previewBaseRef.current  = null
        shapesRef.current = [...shapesRef.current, committed]
        renderShapes(shapesRef.current, selectedIdRef.current)
        renderComposite()
      }
    }

    saveToHistory()
    renderComposite()
    onInteraction?.()
    if (t !== 'eraser') onColourUsed?.(colourRef.current)
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
    const erase = eraseCanvasRef.current
    if (!draw) return
    draw.getContext('2d',  { willReadFrequently: true })?.clearRect(0, 0, draw.width,  draw.height)
    erase?.getContext('2d', { willReadFrequently: true })?.clearRect(0, 0, erase.width, erase.height)
    shapesRef.current = []
    setSelectedId(null)
    selectedIdRef.current = null
    renderShapes([], null)
    renderComposite()
    saveToHistory()
    setShowConfirm(false)
  }

  // Cursor style based on active tool and hover
  const getCursor = () => {
    if (tool === 'select') return 'default'
    if (tool === 'ruler')  return 'crosshair'
    if (tool === 'eraser') return 'cell'
    return 'crosshair'
  }

  const loadSnapshotInternal = useCallback((data: string) => {
    try {
      const s = JSON.parse(data) as { drawData: string; eraseData: string; bgColor: string; shapes: Shape[] }

      // Restore background color
      setBgColour(s.bgColor)
      bgRef.current = s.bgColor
      const bgCanvas = bgCanvasRef.current
      if (bgCanvas) {
        const bgCtx = bgCanvas.getContext('2d')
        if (bgCtx) { bgCtx.fillStyle = s.bgColor; bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height) }
      }

      // Restore shapes
      shapesRef.current = s.shapes ?? []
      const shapeCanvas = shapeCanvasRef.current
      if (shapeCanvas) {
        const shapeCtx = shapeCanvas.getContext('2d')
        if (shapeCtx) {
          shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height)
          for (const shape of shapesRef.current) paintShape(shapeCtx, shape)
        }
      }

      // Restore freehand draw layer
      if (s.drawData && drawCanvasRef.current) {
        const img = new Image()
        img.onload = () => {
          const ctx = drawCanvasRef.current?.getContext('2d')
          if (ctx && drawCanvasRef.current) {
            ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height)
            ctx.drawImage(img, 0, 0)
          }
        }
        img.src = s.drawData
      }

      // Restore erase layer
      if (s.eraseData && eraseCanvasRef.current) {
        const img = new Image()
        img.onload = () => {
          const ctx = eraseCanvasRef.current?.getContext('2d')
          if (ctx && eraseCanvasRef.current) {
            ctx.clearRect(0, 0, eraseCanvasRef.current.width, eraseCanvasRef.current.height)
            ctx.drawImage(img, 0, 0)
          }
        }
        img.src = s.eraseData
      }
    } catch { /* ignore malformed snapshot */ }
  }, [])

  useEffect(() => {
    if (!initialSnapshot) return
    const t = setTimeout(() => loadSnapshotInternal(initialSnapshot), 100)
    return () => clearTimeout(t)
  }, [initialSnapshot, loadSnapshotInternal])

  useImperativeHandle(ref, () => ({
    captureCleanImage: () => {
      const bg    = bgCanvasRef.current
      const draw  = drawCanvasRef.current
      const erase = eraseCanvasRef.current
      const out   = compositeRef.current
      if (!bg || !draw || !out) return ''
      const ctx = out.getContext('2d', { willReadFrequently: true })
      if (!ctx) return ''
      const w = out.width
      const h = out.height
      // Render committed shapes without any selection UI to a temp canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = w
      tempCanvas.height = h
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        for (const s of shapesRef.current) paintShape(tempCtx, s)
        if (erase) {
          tempCtx.save()
          tempCtx.globalCompositeOperation = 'destination-out'
          tempCtx.drawImage(erase, 0, 0)
          tempCtx.restore()
        }
      }
      // Composite: background + clean shapes + freehand strokes
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(bg, 0, 0)
      if (tempCtx) ctx.drawImage(tempCanvas, 0, 0)
      ctx.drawImage(draw, 0, 0)
      return out.toDataURL('image/png')
    },
    getSnapshot: () => {
      const drawCanvas = drawCanvasRef.current
      const eraseCanvas = eraseCanvasRef.current
      return JSON.stringify({
        drawData:  drawCanvas  ? drawCanvas.toDataURL('image/png')  : '',
        eraseData: eraseCanvas ? eraseCanvas.toDataURL('image/png') : '',
        bgColor:   bgRef.current,
        shapes:    shapesRef.current,
      })
    },
    loadSnapshot: loadSnapshotInternal,
  }))

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-surface-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <p className="text-text-primary font-semibold text-sm mb-2">Clear the entire canvas?</p>
            <p className="text-text-secondary text-xs mb-5">
              This removes all drawn content. You can undo immediately with Ctrl+Z.
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
        {/* ── Instructions panel ── */}
        {sidebarFooter && (
          <div
            className="flex-shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden"
            style={{ width: panelCollapsed ? '2rem' : 'min(40%, 420px)', minWidth: panelCollapsed ? 'auto' : 'min(320px, 50vw)', transition: 'width 200ms ease' }}
          >
            <div className="h-8 flex-shrink-0 flex items-center justify-end px-1 border-b border-surface-border">
              <button
                onClick={() => setPanelCollapsed(p => !p)}
                title={panelCollapsed ? 'Show instructions' : 'Hide instructions'}
                className="w-6 h-6 flex items-center justify-center border border-[#C8960C] bg-white text-[#1A1A1A] rounded hover:bg-[#C8960C]/10 transition-colors flex-shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {panelCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
            </div>
            {!panelCollapsed && (
              <div className="flex-1 overflow-y-auto p-6">{sidebarFooter}</div>
            )}
          </div>
        )}

        {/* ── Toolbar + Canvas ── */}
        <div className="flex-1 flex flex-col-reverse sm:flex-row overflow-hidden">
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
            hasSelection={selectedId !== null}
            onDeleteSelected={() => {
              if (!selectedIdRef.current) return
              shapesRef.current = shapesRef.current.filter(s => s.id !== selectedIdRef.current)
              setSelectedId(null)
              selectedIdRef.current = null
              renderShapes(shapesRef.current, null)
              renderComposite()
              saveToHistory()
            }}
          />

          {/* ── Canvas area ── */}
          <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#EFEFEF]">
            {/* Layer 1: background */}
            <canvas ref={bgCanvasRef} className="absolute inset-0 block" />
            {/* Layer 2: shapes (object-model driven) */}
            <canvas ref={shapeCanvasRef} className="absolute inset-0 pointer-events-none" />
            {/* Layer 3: freehand brush / eraser */}
            <canvas
              ref={drawCanvasRef}
              className="absolute inset-0 touch-none"
              style={{ cursor: getCursor() }}
              onMouseDown={startDraw}
              onMouseMove={onDraw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={onDraw}
              onTouchEnd={stopDraw}
            />
            {/* Layer 4: hidden erase mask (source for destination-out in renderShapes) */}
            <canvas ref={eraseCanvasRef} className="hidden" />
            {/* Layer 5: hidden composite for save/export */}
            <canvas ref={compositeRef} className="hidden" />

            {/* Ruler overlay */}
            {rulerLine && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%', zIndex: 20 }}
              >
                <line
                  x1={rulerLine.x1} y1={rulerLine.y1}
                  x2={rulerLine.x2} y2={rulerLine.y2}
                  stroke="#C8960C" strokeWidth="1.5" strokeDasharray="6 3"
                />
                {/* Endpoint dots */}
                <circle cx={rulerLine.x1} cy={rulerLine.y1} r="3" fill="#C8960C" />
                <circle cx={rulerLine.x2} cy={rulerLine.y2} r="3" fill="#C8960C" />
                {/* Distance label */}
                <rect
                  x={(rulerLine.x1 + rulerLine.x2) / 2 - 28}
                  y={(rulerLine.y1 + rulerLine.y2) / 2 - 12}
                  width="56" height="20" rx="4"
                  fill="rgba(255,255,255,0.92)"
                />
                <text
                  x={(rulerLine.x1 + rulerLine.x2) / 2}
                  y={(rulerLine.y1 + rulerLine.y2) / 2 + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#C8960C"
                  fontFamily="sans-serif"
                >
                  {rulerLine.dist}px
                </text>
              </svg>
            )}

            {/* Shape dimension label */}
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
                {Math.round(shapeDim.w)} × {Math.round(shapeDim.h)}
              </div>
            )}

            {/* Selection hint */}
            {tool === 'select' && selectedId && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 border border-surface-border text-text-secondary text-xs px-3 py-1.5 rounded-full shadow pointer-events-none z-20">
                Drag to move · Delete to remove
              </div>
            )}

            <SessionNotepad />
          </div>
        </div>
      </div>
    </>
  )
})

export default VisualArtsModule
