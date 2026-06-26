import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudioTool =
  | 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse'
  | 'text' | 'image' | 'select'

interface BaseShape {
  id: string
  strokeColor: string
  strokeWidth: number
  selected?: boolean
}

interface RectShape extends BaseShape {
  type: 'rect'
  x: number; y: number; w: number; h: number
  fillColor: string; filled: boolean
}

interface EllipseShape extends BaseShape {
  type: 'ellipse'
  cx: number; cy: number; rx: number; ry: number
  fillColor: string; filled: boolean
}

interface LineShape extends BaseShape {
  type: 'line'
  x1: number; y1: number; x2: number; y2: number
}

interface TextShape extends BaseShape {
  type: 'text'
  x: number; y: number
  text: string
  fontSize: number
  fontFamily: string
  fillColor: string
}

interface ImageShape extends BaseShape {
  type: 'image'
  x: number; y: number; w: number; h: number
  src: string
}

export type Shape = RectShape | EllipseShape | LineShape | TextShape | ImageShape

interface HistoryEntry {
  shapes: Shape[]
  drawSnapshot: string | null
}

export interface CanvasFormat {
  id: string
  label: string
  width: number
  height: number
}

export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: 'hd',  label: 'HD 16:9',       width: 1920, height: 1080 },
  { id: 'a4p', label: 'A4 Portrait',    width: 794,  height: 1123 },
  { id: 'a4l', label: 'A4 Landscape',   width: 1123, height: 794  },
  { id: 'sq',  label: 'Square 1:1',     width: 1080, height: 1080 },
  { id: 'a3p', label: 'A3 Portrait',    width: 1123, height: 1587 },
]

export interface StudioCanvasHandle {
  captureImage: () => string
  getFormat: () => CanvasFormat
}

interface Props {
  initialFormat?: CanvasFormat
  onDirty?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2)
}

function getShapeBounds(s: Shape): { x: number; y: number; w: number; h: number } {
  switch (s.type) {
    case 'rect':    return { x: s.x, y: s.y, w: s.w, h: s.h }
    case 'ellipse': return { x: s.cx - s.rx, y: s.cy - s.ry, w: s.rx * 2, h: s.ry * 2 }
    case 'line':    return {
      x: Math.min(s.x1, s.x2),
      y: Math.min(s.y1, s.y2),
      w: Math.max(Math.abs(s.x2 - s.x1), 4),
      h: Math.max(Math.abs(s.y2 - s.y1), 4),
    }
    case 'text':    return { x: s.x, y: s.y - s.fontSize, w: s.text.length * s.fontSize * 0.6 + 10, h: s.fontSize * 1.4 }
    case 'image':   return { x: s.x, y: s.y, w: s.w, h: s.h }
  }
}

function hitTest(x: number, y: number, shapes: Shape[]): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const b = getShapeBounds(shapes[i])
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return shapes[i]
  }
  return null
}

function moveShape(s: Shape, dx: number, dy: number): Shape {
  switch (s.type) {
    case 'rect':    return { ...s, x: s.x + dx, y: s.y + dy }
    case 'ellipse': return { ...s, cx: s.cx + dx, cy: s.cy + dy }
    case 'line':    return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
    case 'text':    return { ...s, x: s.x + dx, y: s.y + dy }
    case 'image':   return { ...s, x: s.x + dx, y: s.y + dy }
  }
}

function paintShape(
  ctx: CanvasRenderingContext2D,
  s: Shape,
  imgCache: Map<string, HTMLImageElement>,
  withSelection: boolean,
) {
  ctx.save()
  ctx.strokeStyle = s.strokeColor
  ctx.lineWidth   = s.strokeWidth
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  switch (s.type) {
    case 'rect':
      ctx.fillStyle = s.fillColor
      if (s.filled) {
        ctx.fillRect(s.x, s.y, s.w, s.h)
      } else {
        ctx.strokeRect(s.x, s.y, s.w, s.h)
      }
      break

    case 'ellipse':
      ctx.fillStyle = s.fillColor
      ctx.beginPath()
      ctx.ellipse(s.cx, s.cy, Math.abs(s.rx), Math.abs(s.ry), 0, 0, Math.PI * 2)
      if (s.filled) ctx.fill(); else ctx.stroke()
      break

    case 'line':
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
      break

    case 'text':
      ctx.font      = `${s.fontSize}px ${s.fontFamily}`
      ctx.fillStyle = s.fillColor
      ctx.fillText(s.text, s.x, s.y)
      break

    case 'image': {
      const img = imgCache.get(s.id)
      if (img) ctx.drawImage(img, s.x, s.y, s.w, s.h)
      break
    }
  }

  if (withSelection && s.selected) {
    const b = getShapeBounds(s)
    ctx.strokeStyle = '#C8960C'
    ctx.lineWidth   = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
    ctx.setLineDash([])
    // Corner handles
    const corners = [
      [b.x - 6, b.y - 6], [b.x + b.w + 6, b.y - 6],
      [b.x - 6, b.y + b.h + 6], [b.x + b.w + 6, b.y + b.h + 6],
    ]
    ctx.fillStyle = '#C8960C'
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - 4, cy - 4, 8, 8)
    }
  }

  ctx.restore()
}

function removeImageBackground(src: string, tolerance = 40): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, c.width, c.height)
      const d = data.data
      const w = c.width
      const corners = [[0,0],[w-1,0],[0,c.height-1],[w-1,c.height-1]]
      let rSum = 0, gSum = 0, bSum = 0
      for (const [cx, cy] of corners) {
        const i = (cy * w + cx) * 4
        rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]
      }
      const bgR = rSum / 4, bgG = gSum / 4, bgB = bSum / 4
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - bgR, dg = d[i+1] - bgG, db = d[i+2] - bgB
        if (Math.sqrt(dr*dr + dg*dg + db*db) <= tolerance) d[i+3] = 0
      }
      ctx.putImageData(data, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.src = src
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StudioCanvas = forwardRef<StudioCanvasHandle, Props>(function StudioCanvas(
  { initialFormat = CANVAS_FORMATS[0], onDirty },
  ref,
) {
  const [format, setFormat] = useState<CanvasFormat>(initialFormat)

  // --- Canvas refs ---
  const bgCanvasRef        = useRef<HTMLCanvasElement>(null)
  const shapeCanvasRef     = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef      = useRef<HTMLCanvasElement>(null)
  const interactionRef     = useRef<HTMLCanvasElement>(null)
  const containerRef       = useRef<HTMLDivElement>(null)
  const fileInputRef       = useRef<HTMLInputElement>(null)
  const textareaRef        = useRef<HTMLTextAreaElement>(null)

  // --- Tool state ---
  const [activeTool,    setActiveTool]    = useState<StudioTool>('brush')
  const [strokeColor,   setStrokeColor]   = useState('#1A1A1A')
  const [fillColor,     setFillColor]     = useState('#C8960C')
  const [filled,        setFilled]        = useState(false)
  const [brushSize,     setBrushSize]     = useState(4)
  const [bgColor,       setBgColor]       = useState('#FFFFFF')
  const [fontSize,      setFontSize]      = useState(32)
  const [fontFamily,    setFontFamily]    = useState('Arial')
  const [selectedId,    setSelectedId]    = useState<string | null>(null)

  // --- Text input overlay ---
  const [textInput, setTextInput] = useState<{ visible: boolean; x: number; y: number; screenX: number; screenY: number }>({
    visible: false, x: 0, y: 0, screenX: 0, screenY: 0,
  })
  const [textValue, setTextValue] = useState('')

  // --- Mutable drawing refs (avoid stale closures) ---
  const shapesRef       = useRef<Shape[]>([])
  const previewRef      = useRef<Shape | null>(null)
  const imgCache        = useRef<Map<string, HTMLImageElement>>(new Map())
  const historyRef      = useRef<HistoryEntry[]>([{ shapes: [], drawSnapshot: null }])
  const historyIdxRef   = useRef(0)
  const isDrawingRef    = useRef(false)
  const startPosRef     = useRef<{ x: number; y: number } | null>(null)
  const lastPosRef      = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef   = useRef(false)
  const dragStartRef    = useRef<{ x: number; y: number } | null>(null)
  const clickPosRef     = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const brushCtxRef     = useRef<CanvasRenderingContext2D | null>(null)
  const activeToolRef   = useRef<StudioTool>('brush')
  const strokeColorRef  = useRef('#1A1A1A')
  const fillColorRef    = useRef('#C8960C')
  const filledRef       = useRef(false)
  const brushSizeRef    = useRef(4)
  const fontSizeRef     = useRef(32)
  const fontFamilyRef   = useRef('Arial')

  // Keep refs in sync with state
  useEffect(() => { activeToolRef.current  = activeTool  }, [activeTool])
  useEffect(() => { strokeColorRef.current = strokeColor }, [strokeColor])
  useEffect(() => { fillColorRef.current   = fillColor   }, [fillColor])
  useEffect(() => { filledRef.current      = filled      }, [filled])
  useEffect(() => { brushSizeRef.current   = brushSize   }, [brushSize])
  useEffect(() => { fontSizeRef.current    = fontSize    }, [fontSize])
  useEffect(() => { fontFamilyRef.current  = fontFamily  }, [fontFamily])

  // --- Responsive display size ---
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { displayW, displayH } = useMemo(() => {
    const scale = Math.min(containerSize.width / format.width, containerSize.height / format.height, 1)
    return { displayW: Math.round(format.width * scale), displayH: Math.round(format.height * scale) }
  }, [containerSize, format])

  // --- Canvas coordinate conversion ---
  function getCanvasPos(e: React.MouseEvent): { x: number; y: number } {
    const canvas = interactionRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left)  * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)   * (canvas.height / rect.height),
    }
  }

  function getCanvasScreenPos(logicalX: number, logicalY: number): { screenX: number; screenY: number } {
    const canvas = interactionRef.current
    if (!canvas) return { screenX: 0, screenY: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width  / canvas.width
    const scaleY = rect.height / canvas.height
    return { screenX: rect.left + logicalX * scaleX, screenY: rect.top + logicalY * scaleY }
  }

  // --- Rendering ---
  const renderShapes = useCallback(() => {
    const canvas = shapeCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of shapesRef.current) paintShape(ctx, s, imgCache.current, true)
    if (previewRef.current) paintShape(ctx, previewRef.current, imgCache.current, false)
  }, [])

  const renderBg = useCallback((color: string) => {
    const canvas = bgCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => { renderBg(bgColor) }, [bgColor, renderBg, format])
  useEffect(() => { renderShapes() }, [renderShapes, format])

  // Resize all canvases when format changes
  useEffect(() => {
    const canvases = [bgCanvasRef, shapeCanvasRef, drawCanvasRef, interactionRef]
    for (const r of canvases) {
      if (r.current) {
        r.current.width  = format.width
        r.current.height = format.height
      }
    }
    shapesRef.current = []
    imgCache.current.clear()
    historyRef.current    = [{ shapes: [], drawSnapshot: null }]
    historyIdxRef.current = 0
    setSelectedId(null)
    renderBg(bgColor)
    renderShapes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format])

  // --- History ---
  function captureDrawSnapshot(): string | null {
    return drawCanvasRef.current?.toDataURL('image/png') ?? null
  }

  const pushHistory = useCallback(() => {
    const entry: HistoryEntry = {
      shapes:       JSON.parse(JSON.stringify(shapesRef.current)),
      drawSnapshot: captureDrawSnapshot(),
    }
    const slice = historyRef.current.slice(0, historyIdxRef.current + 1)
    slice.push(entry)
    if (slice.length > 30) slice.shift()
    historyRef.current    = slice
    historyIdxRef.current = slice.length - 1
    onDirty?.()
  }, [onDirty])

  const restoreHistory = useCallback((entry: HistoryEntry) => {
    shapesRef.current = JSON.parse(JSON.stringify(entry.shapes))
    setSelectedId(null)
    renderShapes()
    const drawCanvas = drawCanvasRef.current
    const ctx = drawCanvas?.getContext('2d')
    if (!ctx || !drawCanvas) return
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
    if (entry.drawSnapshot) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = entry.drawSnapshot
    }
  }, [renderShapes])

  function undo() {
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current--
    restoreHistory(historyRef.current[historyIdxRef.current])
  }

  function redo() {
    if (historyIdxRef.current >= historyRef.current.length - 1) return
    historyIdxRef.current++
    restoreHistory(historyRef.current[historyIdxRef.current])
  }

  function clearCanvas() {
    shapesRef.current = []
    imgCache.current.clear()
    setSelectedId(null)
    renderShapes()
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (ctx && drawCanvasRef.current) ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height)
    pushHistory()
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo() }
      if (e.ctrlKey && e.shiftKey  && e.key === 'Z') { e.preventDefault(); redo() }
      if (e.ctrlKey && e.key === 'y')                { e.preventDefault(); redo() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        shapesRef.current = shapesRef.current.filter(s => s.id !== selectedId)
        setSelectedId(null)
        renderShapes()
        pushHistory()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // --- Image loading ---
  function loadImageShape(shape: ImageShape) {
    if (imgCache.current.has(shape.id)) { renderShapes(); return }
    const img = new Image()
    img.onload = () => { imgCache.current.set(shape.id, img); renderShapes() }
    img.src = shape.src
  }

  // --- Preview shape builders ---
  function buildPreview(tool: StudioTool, start: { x: number; y: number }, end: { x: number; y: number }): Shape | null {
    const w = end.x - start.x, h = end.y - start.y
    switch (tool) {
      case 'rect':
        return { id: '__preview__', type: 'rect', x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(w), h: Math.abs(h), strokeColor: strokeColorRef.current, strokeWidth: brushSizeRef.current, fillColor: fillColorRef.current, filled: filledRef.current }
      case 'ellipse':
        return { id: '__preview__', type: 'ellipse', cx: start.x + w / 2, cy: start.y + h / 2, rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, strokeColor: strokeColorRef.current, strokeWidth: brushSizeRef.current, fillColor: fillColorRef.current, filled: filledRef.current }
      case 'line':
        return { id: '__preview__', type: 'line', x1: start.x, y1: start.y, x2: end.x, y2: end.y, strokeColor: strokeColorRef.current, strokeWidth: brushSizeRef.current }
      default: return null
    }
  }

  function buildFinalShape(tool: StudioTool, start: { x: number; y: number }, end: { x: number; y: number }): Shape | null {
    const preview = buildPreview(tool, start, end)
    if (!preview) return null
    return { ...preview, id: uid() }
  }

  // --- Mouse handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const pos = getCanvasPos(e)
    const tool = activeToolRef.current

    if (tool === 'brush' || tool === 'eraser') {
      isDrawingRef.current = true
      lastPosRef.current   = pos
      const ctx = drawCanvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.save()
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : strokeColorRef.current
      ctx.lineWidth   = brushSizeRef.current
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      brushCtxRef.current = ctx
      return
    }

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      isDrawingRef.current = true
      startPosRef.current  = pos
      return
    }

    if (tool === 'text') {
      const { screenX, screenY } = getCanvasScreenPos(pos.x, pos.y)
      setTextInput({ visible: true, x: pos.x, y: pos.y, screenX, screenY })
      setTextValue('')
      setTimeout(() => textareaRef.current?.focus(), 50)
      return
    }

    if (tool === 'image') {
      clickPosRef.current = pos
      fileInputRef.current?.click()
      return
    }

    if (tool === 'select') {
      const hit = hitTest(pos.x, pos.y, shapesRef.current)
      shapesRef.current = shapesRef.current.map(s => ({ ...s, selected: s.id === hit?.id }))
      setSelectedId(hit?.id ?? null)
      if (hit) {
        isDraggingRef.current = true
        dragStartRef.current  = pos
      }
      renderShapes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderShapes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos  = getCanvasPos(e)
    const tool = activeToolRef.current

    if ((tool === 'brush' || tool === 'eraser') && isDrawingRef.current && brushCtxRef.current) {
      brushCtxRef.current.lineTo(pos.x, pos.y)
      brushCtxRef.current.stroke()
      lastPosRef.current = pos
      return
    }

    if (['line', 'rect', 'ellipse'].includes(tool) && isDrawingRef.current && startPosRef.current) {
      previewRef.current = buildPreview(tool, startPosRef.current, pos)
      renderShapes()
      return
    }

    if (tool === 'select' && isDraggingRef.current && dragStartRef.current) {
      const dx = pos.x - dragStartRef.current.x, dy = pos.y - dragStartRef.current.y
      shapesRef.current = shapesRef.current.map(s => s.selected ? moveShape(s, dx, dy) : s)
      dragStartRef.current = pos
      renderShapes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderShapes])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const pos  = getCanvasPos(e)
    const tool = activeToolRef.current

    if ((tool === 'brush' || tool === 'eraser') && isDrawingRef.current) {
      isDrawingRef.current = false
      if (brushCtxRef.current) {
        brushCtxRef.current.closePath()
        brushCtxRef.current.restore()
        brushCtxRef.current = null
      }
      pushHistory()
      return
    }

    if (['line', 'rect', 'ellipse'].includes(tool) && isDrawingRef.current && startPosRef.current) {
      isDrawingRef.current = false
      previewRef.current   = null
      const shape = buildFinalShape(tool, startPosRef.current, pos)
      if (shape) {
        shapesRef.current = [...shapesRef.current, shape]
        renderShapes()
        pushHistory()
      }
      return
    }

    if (tool === 'select' && isDraggingRef.current) {
      isDraggingRef.current = false
      dragStartRef.current  = null
      pushHistory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderShapes, pushHistory])

  // --- Text commit ---
  function commitText() {
    if (!textValue.trim() || !textInput.visible) { setTextInput(t => ({ ...t, visible: false })); return }
    const shape: TextShape = {
      id: uid(), type: 'text',
      x: textInput.x, y: textInput.y + fontSizeRef.current,
      text: textValue,
      fontSize: fontSizeRef.current, fontFamily: fontFamilyRef.current,
      strokeColor: strokeColorRef.current, strokeWidth: 1,
      fillColor: strokeColorRef.current,
    }
    shapesRef.current = [...shapesRef.current, shape]
    renderShapes()
    pushHistory()
    setTextInput(t => ({ ...t, visible: false }))
    setTextValue('')
  }

  // --- File input (image import) ---
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const maxW = format.width  * 0.5
        const maxH = format.height * 0.5
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
        const w = Math.round(img.naturalWidth  * scale)
        const h = Math.round(img.naturalHeight * scale)
        const cx = clickPosRef.current.x, cy = clickPosRef.current.y
        const shape: ImageShape = {
          id: uid(), type: 'image',
          x: cx - w / 2, y: cy - h / 2, w, h,
          src, strokeColor: strokeColorRef.current, strokeWidth: 0,
        }
        imgCache.current.set(shape.id, img)
        shapesRef.current = [...shapesRef.current, shape]
        renderShapes()
        pushHistory()
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // --- Background removal on selected image ---
  async function handleRemoveBg() {
    const sel = shapesRef.current.find(s => s.id === selectedId && s.type === 'image') as ImageShape | undefined
    if (!sel) return
    const newSrc = await removeImageBackground(sel.src)
    const img = new Image()
    img.onload = () => {
      imgCache.current.set(sel.id, img)
      shapesRef.current = shapesRef.current.map(s =>
        s.id === sel.id ? { ...s, src: newSrc } as ImageShape : s,
      )
      renderShapes()
      pushHistory()
    }
    img.src = newSrc
  }

  // --- Update selected shape color on toolbar change ---
  useEffect(() => {
    if (!selectedId) return
    shapesRef.current = shapesRef.current.map(s => {
      if (s.id !== selectedId) return s
      if (s.type === 'text')   return { ...s, fillColor: strokeColor, strokeColor: strokeColor }
      return { ...s, strokeColor }
    })
    renderShapes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeColor])

  useEffect(() => {
    if (!selectedId) return
    shapesRef.current = shapesRef.current.map(s => {
      if (s.id !== selectedId || (s.type !== 'rect' && s.type !== 'ellipse')) return s
      return { ...s, fillColor: fillColor }
    })
    renderShapes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillColor])

  // --- Load images into cache when shapes change ---
  useEffect(() => {
    for (const s of shapesRef.current) {
      if (s.type === 'image') loadImageShape(s)
    }
  })

  // --- Expose imperative handle ---
  useImperativeHandle(ref, () => ({
    captureImage(): string {
      const bg    = bgCanvasRef.current
      const draw  = drawCanvasRef.current
      if (!bg) return ''
      const out = document.createElement('canvas')
      out.width = bg.width; out.height = bg.height
      const ctx = out.getContext('2d')
      if (!ctx) return ''
      ctx.drawImage(bg, 0, 0)
      // Draw shapes without selection UI
      const temp = document.createElement('canvas')
      temp.width = bg.width; temp.height = bg.height
      const tCtx = temp.getContext('2d')
      if (tCtx) {
        for (const s of shapesRef.current) paintShape(tCtx, s, imgCache.current, false)
      }
      ctx.drawImage(temp, 0, 0)
      if (draw) ctx.drawImage(draw, 0, 0)
      return out.toDataURL('image/png')
    },
    getFormat(): CanvasFormat { return format },
  }), [format])

  // --- Format change ---
  function handleFormatChange(fmt: CanvasFormat) {
    if (!window.confirm(`Changing format will clear the current canvas. Continue?`)) return
    setFormat(fmt)
  }

  // --- Derived UI ---
  const selectedShape = shapesRef.current.find(s => s.id === selectedId) ?? null
  const showFillOptions = ['rect', 'ellipse'].includes(activeTool) || (selectedShape?.type === 'rect' || selectedShape?.type === 'ellipse')
  const showTextOptions = activeTool === 'text' || selectedShape?.type === 'text'
  const showBgRemove    = selectedShape?.type === 'image'

  const toolButtons: { tool: StudioTool; label: string }[] = [
    { tool: 'brush',   label: 'Brush'   },
    { tool: 'eraser',  label: 'Eraser'  },
    { tool: 'line',    label: 'Line'    },
    { tool: 'rect',    label: 'Rect'    },
    { tool: 'ellipse', label: 'Ellipse' },
    { tool: 'text',    label: 'Text'    },
    { tool: 'image',   label: 'Image'   },
    { tool: 'select',  label: 'Select'  },
  ]

  const cursor = activeTool === 'select' ? 'cursor-default'
    : activeTool === 'text' ? 'cursor-text'
    : 'cursor-crosshair'

  return (
    <div className="flex h-full overflow-hidden bg-surface-warm">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Left toolbar */}
      <div className="w-48 flex-shrink-0 bg-white border-r border-surface-border flex flex-col overflow-y-auto">
        {/* Format selector */}
        <div className="px-3 pt-3 pb-2 border-b border-surface-border">
          <p className="text-text-muted text-[9px] uppercase tracking-wide font-semibold mb-1.5">Canvas Format</p>
          <select
            value={format.id}
            onChange={e => {
              const fmt = CANVAS_FORMATS.find(f => f.id === e.target.value)
              if (fmt) handleFormatChange(fmt)
            }}
            className="w-full text-xs text-text-primary bg-surface-warm border border-surface-border rounded px-2 py-1"
          >
            {CANVAS_FORMATS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <p className="text-text-muted text-[9px] mt-1">{format.width} x {format.height} px</p>
        </div>

        {/* Tools */}
        <div className="px-3 pt-3 pb-2 border-b border-surface-border">
          <p className="text-text-muted text-[9px] uppercase tracking-wide font-semibold mb-2">Tools</p>
          <div className="grid grid-cols-2 gap-1">
            {toolButtons.map(({ tool, label }) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`text-[11px] font-medium py-1.5 rounded transition-colors ${
                  activeTool === tool
                    ? 'bg-primary text-white'
                    : 'bg-surface-warm text-text-primary hover:bg-surface-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tool options */}
        <div className="px-3 pt-3 pb-2 border-b border-surface-border space-y-3">
          <p className="text-text-muted text-[9px] uppercase tracking-wide font-semibold">Options</p>

          {/* Stroke / text color */}
          <div>
            <p className="text-text-muted text-[9px] mb-1">
              {activeTool === 'text' || selectedShape?.type === 'text' ? 'Text Color' : 'Stroke Color'}
            </p>
            <input
              type="color"
              value={strokeColor}
              onChange={e => setStrokeColor(e.target.value)}
              className="w-full h-7 rounded cursor-pointer border border-surface-border"
            />
          </div>

          {/* Fill color */}
          {showFillOptions && (
            <>
              <div>
                <p className="text-text-muted text-[9px] mb-1">Fill Color</p>
                <input
                  type="color"
                  value={fillColor}
                  onChange={e => setFillColor(e.target.value)}
                  className="w-full h-7 rounded cursor-pointer border border-surface-border"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFilled(false)}
                  className={`flex-1 text-[10px] py-1 rounded border transition-colors ${!filled ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-surface-border'}`}
                >
                  Outline
                </button>
                <button
                  onClick={() => setFilled(true)}
                  className={`flex-1 text-[10px] py-1 rounded border transition-colors ${filled ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-surface-border'}`}
                >
                  Filled
                </button>
              </div>
            </>
          )}

          {/* Brush size */}
          {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'line' || activeTool === 'rect' || activeTool === 'ellipse') && (
            <div>
              <p className="text-text-muted text-[9px] mb-1">Size: {brushSize}px</p>
              <input
                type="range"
                min={1} max={60}
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Text options */}
          {showTextOptions && (
            <>
              <div>
                <p className="text-text-muted text-[9px] mb-1">Font Size: {fontSize}px</p>
                <input
                  type="range"
                  min={10} max={120}
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <p className="text-text-muted text-[9px] mb-1">Font</p>
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  className="w-full text-[10px] text-text-primary bg-surface-warm border border-surface-border rounded px-1.5 py-1"
                >
                  {['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Impact', 'Verdana', 'Trebuchet MS'].map(f => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Background removal */}
          {showBgRemove && (
            <button
              onClick={handleRemoveBg}
              className="w-full text-[10px] py-1.5 rounded border border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors"
            >
              Remove Background
            </button>
          )}

          {/* Delete selected */}
          {selectedShape && (
            <button
              onClick={() => {
                shapesRef.current = shapesRef.current.filter(s => s.id !== selectedId)
                setSelectedId(null)
                renderShapes()
                pushHistory()
              }}
              className="w-full text-[10px] py-1.5 rounded border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
            >
              Delete Selected
            </button>
          )}
        </div>

        {/* Background */}
        <div className="px-3 pt-3 pb-2 border-b border-surface-border">
          <p className="text-text-muted text-[9px] uppercase tracking-wide font-semibold mb-1.5">Background</p>
          <input
            type="color"
            value={bgColor}
            onChange={e => setBgColor(e.target.value)}
            className="w-full h-7 rounded cursor-pointer border border-surface-border"
          />
        </div>

        {/* Actions */}
        <div className="px-3 pt-3 pb-3 space-y-1.5">
          <p className="text-text-muted text-[9px] uppercase tracking-wide font-semibold mb-2">Actions</p>
          <div className="flex gap-1">
            <button onClick={undo} className="flex-1 text-[10px] py-1.5 rounded bg-surface-warm text-text-primary hover:bg-surface-border transition-colors border border-surface-border">Undo</button>
            <button onClick={redo} className="flex-1 text-[10px] py-1.5 rounded bg-surface-warm text-text-primary hover:bg-surface-border transition-colors border border-surface-border">Redo</button>
          </div>
          <button
            onClick={() => { if (window.confirm('Clear the entire canvas? This cannot be undone easily.')) clearCanvas() }}
            className="w-full text-[10px] py-1.5 rounded bg-surface-warm text-accent hover:bg-accent/10 border border-surface-border transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden bg-surface-canvas/40 p-4 relative">
        <div
          className="relative shadow-2xl"
          style={{ width: displayW, height: displayH, flexShrink: 0 }}
        >
          <canvas ref={bgCanvasRef}    width={format.width} height={format.height} className="absolute inset-0" style={{ width: displayW, height: displayH }} />
          <canvas ref={shapeCanvasRef} width={format.width} height={format.height} className="absolute inset-0" style={{ width: displayW, height: displayH }} />
          <canvas ref={drawCanvasRef}  width={format.width} height={format.height} className="absolute inset-0" style={{ width: displayW, height: displayH }} />
          <canvas
            ref={interactionRef}
            width={format.width}
            height={format.height}
            className={`absolute inset-0 ${cursor}`}
            style={{ width: displayW, height: displayH }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Floating text input */}
        {textInput.visible && (
          <div
            className="fixed z-50"
            style={{ left: textInput.screenX, top: textInput.screenY }}
          >
            <textarea
              ref={textareaRef}
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText() } if (e.key === 'Escape') setTextInput(t => ({ ...t, visible: false })) }}
              onBlur={commitText}
              placeholder="Type and press Enter"
              style={{ fontFamily, fontSize: Math.round(fontSize * (displayW / format.width)), lineHeight: 1.2 }}
              className="min-w-[120px] min-h-[40px] bg-white/90 border-2 border-primary rounded px-2 py-1 text-text-primary outline-none resize shadow-lg"
              rows={2}
            />
            <p className="text-[9px] text-text-muted mt-0.5 bg-white/80 px-1 rounded">Enter to place, Esc to cancel</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default StudioCanvas
