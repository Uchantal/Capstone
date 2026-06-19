import { useRef, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DesignElement {
  id: string
  type: 'text' | 'rect' | 'circle' | 'image'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  // text
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  // shape (rect / circle)
  fill?: string
  strokeColor?: string
  strokeWidth?: number
  borderRadius?: number
  // image
  src?: string
}

export const DEFAULT_BG_COLOR = '#1A1A1A'
export const DEFAULT_ELEMENTS: DesignElement[] = []

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

// ── Canvas export ────────────────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapTextCanvas(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxW: number, lineH: number,
) {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line, x, cy)
      line = words[i]
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

export async function exportDesignToDataUrl(
  elements: DesignElement[],
  bgColor: string,
): Promise<string> {
  const W = 420
  const H = 594
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, W, H)

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  for (const el of sorted) {
    ctx.save()
    if (el.type === 'rect') {
      ctx.fillStyle = el.fill ?? '#C8960C'
      if ((el.borderRadius ?? 0) > 0) {
        drawRoundedRect(ctx, el.x, el.y, el.width, el.height, el.borderRadius!)
        ctx.fill()
      } else {
        ctx.fillRect(el.x, el.y, el.width, el.height)
      }
      if (el.strokeColor && (el.strokeWidth ?? 0) > 0) {
        ctx.strokeStyle = el.strokeColor
        ctx.lineWidth = el.strokeWidth!
        ctx.strokeRect(el.x, el.y, el.width, el.height)
      }
    } else if (el.type === 'circle') {
      ctx.beginPath()
      ctx.ellipse(
        el.x + el.width / 2, el.y + el.height / 2,
        el.width / 2, el.height / 2,
        0, 0, Math.PI * 2,
      )
      ctx.fillStyle = el.fill ?? '#2D6A4F'
      ctx.fill()
      if (el.strokeColor && (el.strokeWidth ?? 0) > 0) {
        ctx.strokeStyle = el.strokeColor
        ctx.lineWidth = el.strokeWidth!
        ctx.stroke()
      }
    } else if (el.type === 'text' && el.text) {
      ctx.fillStyle = el.color ?? '#ffffff'
      const fw = el.fontWeight === 'bold' ? 'bold ' : ''
      const fs = el.fontSize ?? 24
      ctx.font = `${fw}${fs}px Inter, sans-serif`
      ctx.textBaseline = 'top'
      ctx.textAlign = (el.textAlign as CanvasTextAlign) ?? 'left'
      const xPos =
        el.textAlign === 'center' ? el.x + el.width / 2
        : el.textAlign === 'right' ? el.x + el.width
        : el.x
      wrapTextCanvas(ctx, el.text, xPos, el.y, el.width, fs * 1.35)
    } else if (el.type === 'image' && el.src) {
      await new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => { ctx.drawImage(img, el.x, el.y, el.width, el.height); resolve() }
        img.onerror = () => resolve()
        img.src = el.src!
      })
    }
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

function applyResize(orig: DesignElement, handle: HandleId, dx: number, dy: number): DesignElement {
  const MIN = 20
  const { width, height } = orig
  switch (handle) {
    case 'nw': {
      const nw = Math.max(MIN, width - dx)
      const nh = Math.max(MIN, height - dy)
      return { ...orig, x: orig.x + orig.width - nw, y: orig.y + orig.height - nh, width: nw, height: nh }
    }
    case 'n': {
      const nh = Math.max(MIN, height - dy)
      return { ...orig, y: orig.y + orig.height - nh, height: nh }
    }
    case 'ne': {
      const nw = Math.max(MIN, width + dx)
      const nh = Math.max(MIN, height - dy)
      return { ...orig, y: orig.y + orig.height - nh, width: nw, height: nh }
    }
    case 'e':  return { ...orig, width: Math.max(MIN, width + dx) }
    case 'se': return { ...orig, width: Math.max(MIN, width + dx), height: Math.max(MIN, height + dy) }
    case 's':  return { ...orig, height: Math.max(MIN, height + dy) }
    case 'sw': {
      const nw = Math.max(MIN, width - dx)
      return { ...orig, x: orig.x + orig.width - nw, width: nw, height: Math.max(MIN, height + dy) }
    }
    case 'w': {
      const nw = Math.max(MIN, width - dx)
      return { ...orig, x: orig.x + orig.width - nw, width: nw }
    }
  }
}

const RESIZE_HANDLES: Array<{ id: HandleId; pos: React.CSSProperties; cursor: string }> = [
  { id: 'nw', pos: { left: -5, top: -5 },                         cursor: 'nwse-resize' },
  { id: 'n',  pos: { left: 'calc(50% - 5px)', top: -5 },          cursor: 'ns-resize'   },
  { id: 'ne', pos: { right: -5, top: -5 },                        cursor: 'nesw-resize' },
  { id: 'e',  pos: { right: -5, top: 'calc(50% - 5px)' },         cursor: 'ew-resize'   },
  { id: 'se', pos: { right: -5, bottom: -5 },                     cursor: 'nwse-resize' },
  { id: 's',  pos: { left: 'calc(50% - 5px)', bottom: -5 },       cursor: 'ns-resize'   },
  { id: 'sw', pos: { left: -5, bottom: -5 },                      cursor: 'nesw-resize' },
  { id: 'w',  pos: { left: -5, top: 'calc(50% - 5px)' },         cursor: 'ew-resize'   },
]

// ── Colour palettes ───────────────────────────────────────────────────────────

const BG_COLORS    = ['#1A1A1A', '#FAFAF7', '#2D6A4F', '#1e3a5f', '#5c1a1a', '#C8960C', '#4b0082', '#1a3a2a']
const TEXT_COLORS  = ['#ffffff', '#1A1A1A', '#C8960C', '#D62828', '#10B981', '#60A5FA', '#9ca3af', '#f59e0b']
const SHAPE_COLORS = ['#C8960C', '#2D6A4F', '#D62828', '#1e3a5f', '#ffffff', '#1A1A1A', '#60A5FA', '#10B981']

const BTN     = 'text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium'
const BTN_ON  = 'bg-primary text-white border-primary'
const BTN_OFF = 'border-border text-text-secondary hover:border-primary/40 bg-white'
const BTN_ACT = 'border-border text-text-secondary hover:bg-gray-50 bg-white'
const BTN_DEL = 'border-red-200 text-red-600 hover:bg-red-50 bg-white'

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  defaultElements: DesignElement[]
  defaultBgColor: string
  onChange: (elements: DesignElement[], bgColor: string) => void
  onInteraction: () => void
}

export default function DesignCanvas({ defaultElements, defaultBgColor, onChange, onInteraction }: Props) {
  const [elements,   setElements]   = useState<DesignElement[]>(defaultElements)
  const [bgColor,    setBgColor]    = useState(defaultBgColor)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [canUndo,    setCanUndo]    = useState(false)
  const [canRedo,    setCanRedo]    = useState(false)

  const historyRef    = useRef<Array<{ elements: DesignElement[]; bgColor: string }>>([{ elements: defaultElements, bgColor: defaultBgColor }])
  const historyIdxRef = useRef(0)

  const selectedEl = elements.find(el => el.id === selectedId) ?? null

  // ── History ──────────────────────────────────────────────────────────────────

  function pushHistory(els: DesignElement[], bg: string) {
    const next = historyRef.current.slice(0, historyIdxRef.current + 1)
    next.push({ elements: els, bgColor: bg })
    if (next.length > 30) next.shift()
    historyRef.current = next
    historyIdxRef.current = next.length - 1
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(false)
  }

  function undo() {
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current -= 1
    const state = historyRef.current[historyIdxRef.current]
    setElements(state.elements)
    setBgColor(state.bgColor)
    onChange(state.elements, state.bgColor)
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(true)
    setSelectedId(null)
  }

  function redo() {
    if (historyIdxRef.current >= historyRef.current.length - 1) return
    historyIdxRef.current += 1
    const state = historyRef.current[historyIdxRef.current]
    setElements(state.elements)
    setBgColor(state.bgColor)
    onChange(state.elements, state.bgColor)
    setCanUndo(true)
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1)
    setSelectedId(null)
  }

  // ── Commit helpers ────────────────────────────────────────────────────────────

  function commit(newEls: DesignElement[], newBg: string) {
    setElements(newEls)
    setBgColor(newBg)
    onChange(newEls, newBg)
    pushHistory(newEls, newBg)
    onInteraction()
  }

  function updateElement(id: string, patch: Partial<DesignElement>) {
    const newEls = elements.map(el => el.id === id ? { ...el, ...patch } : el)
    commit(newEls, bgColor)
  }

  function changeBgColor(c: string) {
    setBgColor(c)
    onChange(elements, c)
    pushHistory(elements, c)
    onInteraction()
  }

  // ── Element actions ───────────────────────────────────────────────────────────

  function deleteSelected() {
    if (!selectedId) return
    const newEls = elements.filter(e => e.id !== selectedId)
    setSelectedId(null)
    commit(newEls, bgColor)
  }

  function duplicateSelected() {
    if (!selectedId) return
    const el = elements.find(e => e.id === selectedId)
    if (!el) return
    const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0)
    const newEl = { ...el, id: makeId(), x: el.x + 20, y: el.y + 20, zIndex: maxZ + 1 }
    const newEls = [...elements, newEl]
    setSelectedId(newEl.id)
    commit(newEls, bgColor)
  }

  function normalizeZ(els: DesignElement[]): DesignElement[] {
    const sorted = [...els].sort((a, b) => a.zIndex - b.zIndex)
    return els.map(el => ({ ...el, zIndex: sorted.findIndex(s => s.id === el.id) + 1 }))
  }

  function bumpLayer(dir: 'up' | 'down' | 'front' | 'back') {
    if (!selectedId || elements.length < 2) return
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
    const idx = sorted.findIndex(e => e.id === selectedId)
    if (idx < 0) return
    let newEls: DesignElement[]
    if (dir === 'up' && idx < sorted.length - 1) {
      newEls = normalizeZ(elements.map(e =>
        e.id === selectedId ? { ...e, zIndex: sorted[idx + 1].zIndex + 0.5 } : e,
      ))
    } else if (dir === 'down' && idx > 0) {
      newEls = normalizeZ(elements.map(e =>
        e.id === selectedId ? { ...e, zIndex: sorted[idx - 1].zIndex - 0.5 } : e,
      ))
    } else if (dir === 'front') {
      const maxZ = Math.max(...elements.map(e => e.zIndex))
      newEls = normalizeZ(elements.map(e => e.id === selectedId ? { ...e, zIndex: maxZ + 1 } : e))
    } else if (dir === 'back') {
      const minZ = Math.min(...elements.map(e => e.zIndex))
      newEls = normalizeZ(elements.map(e => e.id === selectedId ? { ...e, zIndex: minZ - 1 } : e))
    } else {
      return
    }
    commit(newEls, bgColor)
  }

  // ── Add elements ──────────────────────────────────────────────────────────────

  function addTextElement() {
    const id = makeId()
    const offset = (elements.length % 5) * 18
    const newEl: DesignElement = {
      id, type: 'text',
      x: 30 + offset, y: 60 + offset,
      width: 360, height: 70,
      zIndex: elements.length + 1,
      text: 'New text', fontSize: 28,
      fontWeight: 'bold', textAlign: 'left', color: '#ffffff',
    }
    const newEls = [...elements, newEl]
    setSelectedId(id)
    commit(newEls, bgColor)
  }

  function addRectElement() {
    const id = makeId()
    const newEl: DesignElement = {
      id, type: 'rect',
      x: 80, y: 200, width: 260, height: 80,
      zIndex: elements.length + 1,
      fill: '#C8960C', borderRadius: 0,
    }
    const newEls = [...elements, newEl]
    setSelectedId(id)
    commit(newEls, bgColor)
  }

  function addCircleElement() {
    const id = makeId()
    const newEl: DesignElement = {
      id, type: 'circle',
      x: 160, y: 220, width: 100, height: 100,
      zIndex: elements.length + 1,
      fill: '#2D6A4F',
    }
    const newEls = [...elements, newEl]
    setSelectedId(id)
    commit(newEls, bgColor)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      const id = makeId()
      const newEl: DesignElement = {
        id, type: 'image',
        x: 60, y: 100, width: 300, height: 200,
        zIndex: elements.length + 1, src,
      }
      const newEls = [...elements, newEl]
      setSelectedId(id)
      commit(newEls, bgColor)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Drag and resize ───────────────────────────────────────────────────────────

  function handleElementMouseDown(e: React.MouseEvent, elId: string) {
    if (e.button !== 0) return
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const origEl = elements.find(x => x.id === elId)
    if (!origEl) return
    const origElCopy  = { ...origEl }
    const capturedEls = elements
    const capturedBg  = bgColor
    let moved = false

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      moved = true
      const newEls = capturedEls.map(el =>
        el.id === elId ? { ...origElCopy, x: origElCopy.x + dx, y: origElCopy.y + dy } : el,
      )
      setElements(newEls)
      onChange(newEls, capturedBg)
    }

    function onUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (moved) {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const finalEls = capturedEls.map(el =>
          el.id === elId ? { ...origElCopy, x: origElCopy.x + dx, y: origElCopy.y + dy } : el,
        )
        setElements(finalEls)
        onChange(finalEls, capturedBg)
        pushHistory(finalEls, capturedBg)
        onInteraction()
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleResizeMouseDown(e: React.MouseEvent, elId: string, handle: HandleId) {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const origEl = elements.find(x => x.id === elId)
    if (!origEl) return
    const origElCopy  = { ...origEl }
    const capturedEls = elements
    const capturedBg  = bgColor
    let moved = false

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      moved = true
      const resized = applyResize(origElCopy, handle, dx, dy)
      const newEls = capturedEls.map(el => el.id === elId ? resized : el)
      setElements(newEls)
      onChange(newEls, capturedBg)
    }

    function onUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (moved) {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const resized = applyResize(origElCopy, handle, dx, dy)
        const finalEls = capturedEls.map(el => el.id === elId ? resized : el)
        setElements(finalEls)
        onChange(finalEls, capturedBg)
        pushHistory(finalEls, capturedBg)
        onInteraction()
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div>
      {/* Toolbar */}
      <div className="space-y-2 mb-4">

        {/* Row 1: Add + Background */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-text-muted text-xs mr-1">Add:</span>
            <button onClick={addTextElement}   className={`${BTN} ${BTN_ACT}`}>Text</button>
            <button onClick={addRectElement}   className={`${BTN} ${BTN_ACT}`}>Rectangle</button>
            <button onClick={addCircleElement} className={`${BTN} ${BTN_ACT}`}>Circle</button>
            <label className={`${BTN} ${BTN_ACT} cursor-pointer`}>
              Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="w-px h-4 bg-border self-center" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-text-muted text-xs">Background:</span>
            {BG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => changeBgColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${bgColor === c ? 'border-primary scale-110' : 'border-transparent hover:border-gray-400'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="relative cursor-pointer flex-shrink-0">
              <input
                type="color"
                value={bgColor}
                onChange={e => changeBgColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-text-muted text-[10px] bg-white">+</span>
            </label>
          </div>
        </div>

        {/* Row 2: Selected element controls */}
        {selectedEl && (
          <div className="flex items-center gap-2 flex-wrap bg-gray-50 border border-border rounded-lg px-3 py-2">
            {selectedEl.type === 'text' && (
              <>
                <span className="text-text-muted text-xs font-medium">Text:</span>
                {[16, 20, 24, 32, 40, 56].map(sz => (
                  <button
                    key={sz}
                    onClick={() => updateElement(selectedEl.id, { fontSize: sz })}
                    className={`${BTN} ${selectedEl.fontSize === sz ? BTN_ON : BTN_OFF}`}
                  >{sz}</button>
                ))}
                <div className="w-px h-4 bg-border" />
                <button
                  onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`${BTN} ${selectedEl.fontWeight === 'bold' ? BTN_ON : BTN_OFF} font-bold`}
                >B</button>
                {(['left', 'center', 'right'] as const).map(al => (
                  <button
                    key={al}
                    onClick={() => updateElement(selectedEl.id, { textAlign: al })}
                    className={`${BTN} ${selectedEl.textAlign === al ? BTN_ON : BTN_OFF}`}
                  >{al[0].toUpperCase()}</button>
                ))}
                <div className="w-px h-4 bg-border" />
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateElement(selectedEl.id, { color: c })}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${selectedEl.color === c ? 'border-primary scale-110' : 'border-transparent hover:border-gray-400'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="relative cursor-pointer flex-shrink-0">
                  <input
                    type="color"
                    value={selectedEl.color ?? '#ffffff'}
                    onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <span className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-text-muted text-[10px] bg-white">+</span>
                </label>
              </>
            )}

            {(selectedEl.type === 'rect' || selectedEl.type === 'circle') && (
              <>
                <span className="text-text-muted text-xs font-medium">Fill:</span>
                {SHAPE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateElement(selectedEl.id, { fill: c })}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${selectedEl.fill === c ? 'border-primary scale-110' : 'border-transparent hover:border-gray-400'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="relative cursor-pointer flex-shrink-0">
                  <input
                    type="color"
                    value={selectedEl.fill ?? '#C8960C'}
                    onChange={e => updateElement(selectedEl.id, { fill: e.target.value })}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <span className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-text-muted text-[10px] bg-white">+</span>
                </label>
                {selectedEl.type === 'rect' && (
                  <>
                    <div className="w-px h-4 bg-border" />
                    <span className="text-text-muted text-xs">Radius:</span>
                    {[0, 4, 8, 16].map(r => (
                      <button
                        key={r}
                        onClick={() => updateElement(selectedEl.id, { borderRadius: r })}
                        className={`${BTN} ${selectedEl.borderRadius === r ? BTN_ON : BTN_OFF}`}
                      >{r}</button>
                    ))}
                  </>
                )}
              </>
            )}

            {selectedEl.type === 'image' && (
              <span className="text-text-muted text-xs">Drag to move. Use handles to resize.</span>
            )}
          </div>
        )}

        {/* Row 3: Layer / Edit / History */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedId && (
            <>
              <span className="text-text-muted text-xs">Layer:</span>
              <button onClick={() => bumpLayer('up')}    className={`${BTN} ${BTN_ACT}`}>Up</button>
              <button onClick={() => bumpLayer('down')}  className={`${BTN} ${BTN_ACT}`}>Down</button>
              <button onClick={() => bumpLayer('front')} className={`${BTN} ${BTN_ACT}`}>Front</button>
              <button onClick={() => bumpLayer('back')}  className={`${BTN} ${BTN_ACT}`}>Back</button>
              <div className="w-px h-4 bg-border self-center" />
              <button onClick={duplicateSelected} className={`${BTN} ${BTN_ACT}`}>Duplicate</button>
              <button onClick={deleteSelected}    className={`${BTN} ${BTN_DEL}`}>Delete</button>
              <div className="w-px h-4 bg-border self-center" />
            </>
          )}
          <button onClick={undo} disabled={!canUndo} className={`${BTN} ${BTN_ACT} disabled:opacity-40 disabled:cursor-not-allowed`}>Undo</button>
          <button onClick={redo} disabled={!canRedo} className={`${BTN} ${BTN_ACT} disabled:opacity-40 disabled:cursor-not-allowed`}>Redo</button>
        </div>
      </div>

      {/* Canvas surface */}
      <div className="flex justify-center">
        <div
          className="relative border border-border rounded-xl"
          style={{ width: 420, height: 594, background: bgColor, flexShrink: 0, overflow: 'visible' }}
          onClick={() => { setSelectedId(null); setEditingId(null) }}
        >
          {sorted.map(el => {
            const isSelected = selectedId === el.id
            const isEditing  = editingId  === el.id

            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x, top: el.y,
                  width: el.width, height: el.height,
                  zIndex: el.zIndex,
                  cursor: isEditing ? 'text' : 'move',
                  userSelect: 'none',
                }}
                onClick={e => { e.stopPropagation(); setSelectedId(el.id) }}
                onMouseDown={e => { if (!isEditing) handleElementMouseDown(e, el.id) }}
                onDoubleClick={e => {
                  e.stopPropagation()
                  if (el.type === 'text') { setEditingId(el.id); setSelectedId(el.id) }
                }}
              >
                {/* Element content */}
                {el.type === 'text' && (
                  <div style={{
                    width: '100%', height: '100%', overflow: 'hidden',
                    fontSize: el.fontSize, fontWeight: el.fontWeight,
                    textAlign: el.textAlign, color: el.color,
                    lineHeight: 1.35, wordBreak: 'break-word',
                  }}>
                    {!isEditing && (el.text || '')}
                    {isEditing && (
                      <textarea
                        autoFocus
                        defaultValue={el.text ?? ''}
                        onBlur={e => {
                          updateElement(el.id, { text: e.target.value })
                          setEditingId(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Escape') { setEditingId(null); e.preventDefault() }
                        }}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          width: '100%', height: '100%',
                          background: 'transparent', border: 'none',
                          outline: 'none', resize: 'none', padding: 0,
                          cursor: 'text', fontSize: 'inherit',
                          fontWeight: 'inherit', textAlign: 'inherit',
                          color: 'inherit', lineHeight: 'inherit',
                        }}
                      />
                    )}
                  </div>
                )}

                {el.type === 'rect' && (
                  <div style={{
                    width: '100%', height: '100%',
                    background: el.fill ?? '#C8960C',
                    borderRadius: el.borderRadius,
                    border: el.strokeColor && el.strokeWidth
                      ? `${el.strokeWidth}px solid ${el.strokeColor}`
                      : undefined,
                  }} />
                )}

                {el.type === 'circle' && (
                  <div style={{
                    width: '100%', height: '100%',
                    background: el.fill ?? '#2D6A4F',
                    borderRadius: '50%',
                    border: el.strokeColor && el.strokeWidth
                      ? `${el.strokeWidth}px solid ${el.strokeColor}`
                      : undefined,
                  }} />
                )}

                {el.type === 'image' && el.src && (
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    <img
                      src={el.src}
                      alt=""
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                    />
                  </div>
                )}

                {/* Selection outline + resize handles */}
                {isSelected && !isEditing && (
                  <>
                    <div style={{
                      position: 'absolute', inset: 0,
                      outline: '2px solid #3b82f6', outlineOffset: 1,
                      pointerEvents: 'none',
                    }} />
                    {RESIZE_HANDLES.map(h => (
                      <div
                        key={h.id}
                        style={{
                          position: 'absolute',
                          ...h.pos,
                          width: 10, height: 10,
                          background: '#ffffff',
                          border: '1.5px solid #3b82f6',
                          borderRadius: 2,
                          cursor: h.cursor,
                          zIndex: 9999,
                        }}
                        onMouseDown={e => handleResizeMouseDown(e, el.id, h.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })}

          {/* Empty-state hint */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-500 text-sm text-center px-10 leading-relaxed">
                Use the toolbar above to add text, shapes, or images to your poster.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
