import React, { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShapeType =
  'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'star' | 'cross' |
  'heart' | 'speech-bubble' | 'arrow-right' | 'arrow-left' | 'double-arrow' | 'line'

export interface DesignElement {
  id: string
  type: 'text' | 'rect' | 'circle' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  // text
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  // shape / rect / circle
  fill?: string
  strokeColor?: string
  strokeWidth?: number
  borderRadius?: number
  shapeType?: ShapeType
  // image
  src?: string
}

export const DEFAULT_BG_COLOR = '#FFFFFF'
export const DEFAULT_ELEMENTS: DesignElement[] = []

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

// ── Shape SVG renderers ───────────────────────────────────────────────────────

const SHAPE_SVG: Record<ShapeType, (fill: string) => React.ReactNode> = {
  triangle:        fill => <polygon points="50,5 95,95 5,95" fill={fill} />,
  diamond:         fill => <polygon points="50,5 95,50 50,95 5,50" fill={fill} />,
  pentagon:        fill => <polygon points="50,5 95,35 78,90 22,90 5,35" fill={fill} />,
  hexagon:         fill => <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill={fill} />,
  star:            fill => <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} />,
  'arrow-right':   fill => <polygon points="5,35 60,35 60,15 95,50 60,85 60,65 5,65" fill={fill} />,
  'arrow-left':    fill => <polygon points="95,35 40,35 40,15 5,50 40,85 40,65 95,65" fill={fill} />,
  heart:           fill => <path d="M50,85 C20,65 5,50 5,33 C5,18 15,8 28,8 C37,8 45,13 50,20 C55,13 63,8 72,8 C85,8 95,18 95,33 C95,50 80,65 50,85 Z" fill={fill} />,
  'speech-bubble': fill => <path d="M10,10 H90 Q95,10 95,15 V65 Q95,70 90,70 H55 L40,90 L40,70 H10 Q5,70 5,65 V15 Q5,10 10,10 Z" fill={fill} />,
  cross:           fill => <path d="M35,5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z" fill={fill} />,
  line:            fill => <rect x={0} y={42} width={100} height={16} fill={fill} />,
  'double-arrow':  fill => <polygon points="20,50 40,25 40,38 60,38 60,25 80,50 60,75 60,62 40,62 40,75" fill={fill} />,
}

// ── Shape picker items ────────────────────────────────────────────────────────

type PickerItem =
  | { kind: 'rect';   label: string }
  | { kind: 'circle'; label: string }
  | { kind: 'shape';  type: ShapeType; label: string }

const PICKER_ITEMS: PickerItem[] = [
  { kind: 'rect',   label: 'Rectangle' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'shape', type: 'triangle',      label: 'Triangle' },
  { kind: 'shape', type: 'diamond',       label: 'Diamond' },
  { kind: 'shape', type: 'pentagon',      label: 'Pentagon' },
  { kind: 'shape', type: 'hexagon',       label: 'Hexagon' },
  { kind: 'shape', type: 'star',          label: 'Star' },
  { kind: 'shape', type: 'heart',         label: 'Heart' },
  { kind: 'shape', type: 'speech-bubble', label: 'Speech Bubble' },
  { kind: 'shape', type: 'arrow-right',   label: 'Arrow Right' },
  { kind: 'shape', type: 'arrow-left',    label: 'Arrow Left' },
  { kind: 'shape', type: 'double-arrow',  label: 'Double Arrow' },
  { kind: 'shape', type: 'cross',         label: 'Cross' },
  { kind: 'shape', type: 'line',          label: 'Line' },
]

function renderShapeContent(el: DesignElement): React.ReactNode {
  if (!el.shapeType) return null
  const fill = el.fill ?? '#C8960C'
  const svgChild = SHAPE_SVG[el.shapeType]?.(fill)
  if (!svgChild) return null
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      {svgChild}
    </svg>
  )
}

// ── Canvas export ─────────────────────────────────────────────────────────────

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

function drawShapeOnCanvas(ctx: CanvasRenderingContext2D, shapeType: ShapeType): void {
  if (shapeType === 'line') {
    ctx.fillRect(0, 42, 100, 16)
    return
  }
  const paths: Partial<Record<ShapeType, string>> = {
    triangle:        'M 50,5 L 95,95 L 5,95 Z',
    diamond:         'M 50,5 L 95,50 L 50,95 L 5,50 Z',
    pentagon:        'M 50,5 L 95,35 L 78,90 L 22,90 L 5,35 Z',
    hexagon:         'M 50,3 L 93,26 L 93,74 L 50,97 L 7,74 L 7,26 Z',
    star:            'M 50,5 L 61,35 L 95,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 5,35 L 39,35 Z',
    'arrow-right':   'M 5,35 L 60,35 L 60,15 L 95,50 L 60,85 L 60,65 L 5,65 Z',
    'arrow-left':    'M 95,35 L 40,35 L 40,15 L 5,50 L 40,85 L 40,65 L 95,65 Z',
    heart:           'M50,85 C20,65 5,50 5,33 C5,18 15,8 28,8 C37,8 45,13 50,20 C55,13 63,8 72,8 C85,8 95,18 95,33 C95,50 80,65 50,85 Z',
    'speech-bubble': 'M10,10 H90 Q95,10 95,15 V65 Q95,70 90,70 H55 L40,90 L40,70 H10 Q5,70 5,65 V15 Q5,10 10,10 Z',
    cross:           'M35,5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z',
    'double-arrow':  'M 20,50 L 40,25 L 40,38 L 60,38 L 60,25 L 80,50 L 60,75 L 60,62 L 40,62 L 40,75 Z',
  }
  const p = paths[shapeType]
  if (p) ctx.fill(new Path2D(p))
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
    } else if (el.type === 'shape' && el.shapeType) {
      ctx.fillStyle = el.fill ?? '#C8960C'
      ctx.translate(el.x, el.y)
      ctx.scale(el.width / 100, el.height / 100)
      drawShapeOnCanvas(ctx, el.shapeType)
    } else if (el.type === 'text' && el.text) {
      ctx.fillStyle = el.color ?? '#1A1A1A'
      const fw = el.fontWeight === 'bold' ? 'bold ' : 'normal '
      const fi = el.fontStyle === 'italic' ? 'italic ' : ''
      const fs = el.fontSize ?? 24
      ctx.font = `${fi}${fw}${fs}px Inter, sans-serif`
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

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  { id: 'nw', pos: { left: -5, top: -5 },                        cursor: 'nwse-resize' },
  { id: 'n',  pos: { left: 'calc(50% - 5px)', top: -5 },         cursor: 'ns-resize'   },
  { id: 'ne', pos: { right: -5, top: -5 },                       cursor: 'nesw-resize' },
  { id: 'e',  pos: { right: -5, top: 'calc(50% - 5px)' },        cursor: 'ew-resize'   },
  { id: 'se', pos: { right: -5, bottom: -5 },                    cursor: 'nwse-resize' },
  { id: 's',  pos: { left: 'calc(50% - 5px)', bottom: -5 },      cursor: 'ns-resize'   },
  { id: 'sw', pos: { left: -5, bottom: -5 },                     cursor: 'nesw-resize' },
  { id: 'w',  pos: { left: -5, top: 'calc(50% - 5px)' },        cursor: 'ew-resize'   },
]

// ── Colour palettes ───────────────────────────────────────────────────────────

const BG_COLORS      = ['#FFFFFF', '#1A1A1A', '#C8960C', '#2D6A4F', '#D62828', '#1e3a5f', '#F9F7F4', '#f59e0b']
const ELEMENT_COLORS = ['#1A1A1A', '#ffffff', '#C8960C', '#D62828', '#2D6A4F', '#10B981', '#60A5FA', '#9ca3af', '#f59e0b', '#1e3a5f']

const BTN     = 'text-sm rounded-lg py-1.5 px-2 border transition-colors'
const BTN_ON  = 'bg-primary text-white border-primary'
const BTN_OFF = 'bg-white border-surface-border text-text-secondary hover:bg-[#F9F7F4]'
const BTN_ACT = 'bg-white border-surface-border text-text-primary hover:bg-[#F9F7F4]'
const BTN_DEL = 'bg-white border-accent/20 text-accent hover:bg-accent/5'
const SECTION_HDR = 'text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2'

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  defaultElements: DesignElement[]
  defaultBgColor: string
  onChange: (elements: DesignElement[], bgColor: string) => void
  onInteraction: () => void
}

const CANVAS_W = 420
const CANVAS_H = 594

export default function DesignCanvas({ defaultElements, defaultBgColor, onChange, onInteraction }: Props) {
  const [elements,    setElements]    = useState<DesignElement[]>(defaultElements)
  const [bgColor,     setBgColor]     = useState(defaultBgColor)
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [canUndo,     setCanUndo]     = useState(false)
  const [canRedo,     setCanRedo]     = useState(false)
  const [shapesOpen,  setShapesOpen]  = useState(false)
  const [canvasScale, setCanvasScale] = useState(1)

  const historyRef      = useRef<Array<{ elements: DesignElement[]; bgColor: string }>>([{ elements: defaultElements, bgColor: defaultBgColor }])
  const historyIdxRef   = useRef(0)
  const canvasWrapperRef  = useRef<HTMLDivElement>(null)
  const canvasScaleRef    = useRef(1)
  const shapesPickerRef   = useRef<HTMLDivElement>(null)
  const fontSizeInputRef  = useRef<HTMLInputElement>(null)

  const selectedEl = elements.find(el => el.id === selectedId) ?? null

  // ── Responsive canvas scale ───────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasWrapperRef.current
    if (!el) return
    const update = () => {
      const s = el.offsetWidth / CANVAS_W
      canvasScaleRef.current = s
      setCanvasScale(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Shapes picker: close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!shapesOpen) return
    const handler = (e: MouseEvent) => {
      if (shapesPickerRef.current && !shapesPickerRef.current.contains(e.target as Node)) {
        setShapesOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shapesOpen])

  // ── History ───────────────────────────────────────────────────────────────────
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

  function applyElementColor(c: string) {
    if (!selectedEl) return
    if (selectedEl.type === 'text') {
      updateElement(selectedEl.id, { color: c })
    } else if (selectedEl.type !== 'image') {
      updateElement(selectedEl.id, { fill: c })
    }
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
      fontWeight: 'normal', textAlign: 'left', color: '#1A1A1A',
    }
    const newEls = [...elements, newEl]
    setSelectedId(id)
    commit(newEls, bgColor)
  }

  function addHeadingElement() {
    const id = makeId()
    const newEl: DesignElement = {
      id, type: 'text',
      x: 30, y: 40,
      width: 360, height: 100,
      zIndex: elements.length + 1,
      text: 'Your heading', fontSize: 48,
      fontWeight: 'bold', textAlign: 'center', color: '#1A1A1A',
    }
    const newEls = [...elements, newEl]
    setSelectedId(id)
    commit(newEls, bgColor)
  }

  function addContactBlock() {
    const id = makeId()
    const newEl: DesignElement = {
      id, type: 'text',
      x: 30, y: 490,
      width: 360, height: 60,
      zIndex: elements.length + 1,
      text: 'Phone: \nEmail: \nWebsite: ',
      fontSize: 14, fontWeight: 'normal',
      textAlign: 'center', color: '#1A1A1A',
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

  function addShapeElement(shapeType: ShapeType) {
    const id = makeId()
    const newEl: DesignElement = {
      id, type: 'shape',
      shapeType,
      x: 160, y: 247, width: 100, height: 100,
      zIndex: elements.length + 1,
      fill: '#C8960C',
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

  // ── Drag and resize (scale-corrected) ─────────────────────────────────────────
  function handleElementMouseDown(e: React.MouseEvent, elId: string) {
    if (e.button !== 0) return
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const sc = canvasScaleRef.current
    const origEl = elements.find(x => x.id === elId)
    if (!origEl) return
    const origElCopy  = { ...origEl }
    const capturedEls = elements
    const capturedBg  = bgColor
    let moved = false

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / sc
      const dy = (ev.clientY - startY) / sc
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
        const dx = (ev.clientX - startX) / sc
        const dy = (ev.clientY - startY) / sc
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
    const sc = canvasScaleRef.current
    const origEl = elements.find(x => x.id === elId)
    if (!origEl) return
    const origElCopy  = { ...origEl }
    const capturedEls = elements
    const capturedBg  = bgColor
    let moved = false

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / sc
      const dy = (ev.clientY - startY) / sc
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
        const dx = (ev.clientX - startX) / sc
        const dy = (ev.clientY - startY) / sc
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

  // ── Derived ───────────────────────────────────────────────────────────────────
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  const activeElementColor = selectedEl
    ? (selectedEl.type === 'text'
        ? selectedEl.color
        : selectedEl.type !== 'image'
          ? selectedEl.fill
          : null)
    : null

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-row overflow-hidden">

      {/* ── Left toolbar panel ── */}
      <div className="w-56 flex-shrink-0 bg-[#F9F7F4] border-r border-surface-border overflow-y-auto p-3">

        {/* ADD */}
        <p className={SECTION_HDR}>Add</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={addTextElement}    className={`${BTN} ${BTN_ACT}`}>Text</button>
          <button onClick={addHeadingElement} className={`${BTN} ${BTN_ACT}`}>Heading</button>

          <div ref={shapesPickerRef} className="relative">
            <button
              onClick={() => setShapesOpen(o => !o)}
              className={`${BTN} ${shapesOpen ? BTN_ON : BTN_ACT} w-full`}
            >Shapes</button>
            {shapesOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-surface-border rounded-xl shadow-xl p-3" style={{ minWidth: 240 }}>
                <div className="grid grid-cols-3 gap-2">
                  {PICKER_ITEMS.map(item => {
                    const key = item.kind === 'shape' ? item.type : item.kind
                    const handleClick = () => {
                      if (item.kind === 'rect')        { addRectElement();           setShapesOpen(false) }
                      else if (item.kind === 'circle') { addCircleElement();         setShapesOpen(false) }
                      else                             { addShapeElement(item.type); setShapesOpen(false) }
                    }
                    return (
                      <button
                        key={key}
                        onClick={handleClick}
                        className="flex flex-col items-center justify-start gap-1 pt-2 pb-1.5 px-1 rounded-lg bg-[#F9F7F4] hover:bg-white hover:shadow-sm cursor-pointer"
                        style={{ width: '100%' }}
                      >
                        <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.kind === 'rect' && (
                            <div style={{ width: 36, height: 24, background: '#C8960C', borderRadius: 2 }} />
                          )}
                          {item.kind === 'circle' && (
                            <div style={{ width: 36, height: 36, background: '#C8960C', borderRadius: '50%' }} />
                          )}
                          {item.kind === 'shape' && (
                            <svg width={40} height={40} viewBox="0 0 100 100" preserveAspectRatio="none">
                              {SHAPE_SVG[item.type]('#C8960C')}
                            </svg>
                          )}
                        </div>
                        <span className="text-[10px] text-text-secondary text-center leading-tight">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <label className={`${BTN} ${BTN_ACT} cursor-pointer text-center`}>
            Image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
        <button
          onClick={addContactBlock}
          title="Add contact details: phone, email, or website"
          className={`${BTN} ${BTN_ACT} w-full mt-1.5`}
        >Add Details</button>

        {/* BACKGROUND */}
        <div className="border-t border-surface-border mt-3 pt-3" />
        <p className={SECTION_HDR}>Background</p>
        <div className="flex flex-wrap gap-1.5">
          {BG_COLORS.map(c => (
            <button
              key={c}
              onClick={() => changeBgColor(c)}
              title={c}
              className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${bgColor === c ? 'border-primary scale-110' : 'border-transparent hover:border-gray-400'}`}
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
            <span className="w-5 h-5 rounded-full border-2 border-surface-border flex items-center justify-center text-text-muted text-[10px] bg-white">+</span>
          </label>
        </div>

        {/* COLOURS */}
        <div className="border-t border-surface-border mt-3 pt-3" />
        <p className={SECTION_HDR}>Colours</p>
        <div className="flex flex-wrap gap-1.5">
          {ELEMENT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => applyElementColor(c)}
              title={c}
              className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${activeElementColor === c ? 'border-primary scale-110' : 'border-transparent hover:border-gray-400'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="relative cursor-pointer flex-shrink-0">
            <input
              type="color"
              value={
                selectedEl?.type === 'text'
                  ? (selectedEl.color ?? '#1A1A1A')
                  : selectedEl && selectedEl.type !== 'image'
                    ? (selectedEl.fill ?? '#C8960C')
                    : '#C8960C'
              }
              onChange={e => applyElementColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <span className="w-5 h-5 rounded-full border-2 border-surface-border flex items-center justify-center text-text-muted text-[10px] bg-white">+</span>
          </label>
        </div>

        {/* EDIT (conditional on selection) */}
        {selectedEl && (
          <>
            <div className="border-t border-surface-border mt-3 pt-3" />
            <p className={SECTION_HDR}>Edit</p>

            {selectedEl.type === 'text' && (
              <>
                <div className="flex items-center gap-0.5 mb-1.5">
                  <input
                    ref={fontSizeInputRef}
                    key={selectedEl.id}
                    type="number"
                    min={8}
                    max={200}
                    defaultValue={selectedEl.fontSize ?? 24}
                    onBlur={e => {
                      const sz = Math.max(8, Math.min(200, parseInt(e.target.value) || 24))
                      e.target.value = String(sz)
                      updateElement(selectedEl.id, { fontSize: sz })
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const sz = Math.max(8, Math.min(200, parseInt((e.target as HTMLInputElement).value) || 24))
                        ;(e.target as HTMLInputElement).value = String(sz)
                        updateElement(selectedEl.id, { fontSize: sz })
                      }
                    }}
                    className="border border-surface-border rounded-lg text-sm text-text-primary px-2 py-1.5 focus:outline-none focus:border-primary bg-white font-medium flex-1"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        const cur = parseInt(fontSizeInputRef.current?.value ?? String(selectedEl.fontSize ?? 24)) || (selectedEl.fontSize ?? 24)
                        const sz = Math.min(200, cur + 1)
                        if (fontSizeInputRef.current) fontSizeInputRef.current.value = String(sz)
                        updateElement(selectedEl.id, { fontSize: sz })
                      }}
                      className="text-text-muted hover:text-text-primary leading-none px-1 text-[10px]"
                    >&#9650;</button>
                    <button
                      onClick={() => {
                        const cur = parseInt(fontSizeInputRef.current?.value ?? String(selectedEl.fontSize ?? 24)) || (selectedEl.fontSize ?? 24)
                        const sz = Math.max(8, cur - 1)
                        if (fontSizeInputRef.current) fontSizeInputRef.current.value = String(sz)
                        updateElement(selectedEl.id, { fontSize: sz })
                      }}
                      className="text-text-muted hover:text-text-primary leading-none px-1 text-[10px]"
                    >&#9660;</button>
                  </div>
                </div>

                <div className="flex gap-1 mb-1.5">
                  <button
                    onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`${BTN} ${selectedEl.fontWeight === 'bold' ? BTN_ON : BTN_OFF} flex-1 font-bold`}
                  >B</button>
                  <button
                    onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`${BTN} ${selectedEl.fontStyle === 'italic' ? BTN_ON : BTN_OFF} flex-1 italic`}
                  >I</button>
                  <button
                    onClick={() => updateElement(selectedEl.id, { textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' })}
                    className={`${BTN} ${selectedEl.textDecoration === 'underline' ? BTN_ON : BTN_OFF} flex-1 underline`}
                  >U</button>
                </div>

                <div className="flex gap-1 mb-1.5">
                  <button
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'left' })}
                    className={`${BTN} ${selectedEl.textAlign === 'left' ? BTN_ON : BTN_OFF} flex-1`}
                  >Left</button>
                  <button
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'center' })}
                    className={`${BTN} ${selectedEl.textAlign === 'center' ? BTN_ON : BTN_OFF} flex-1`}
                  >Centre</button>
                  <button
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'right' })}
                    className={`${BTN} ${selectedEl.textAlign === 'right' ? BTN_ON : BTN_OFF} flex-1`}
                  >Right</button>
                </div>

                <div className="border-t border-surface-border my-1.5" />
              </>
            )}

            <button onClick={duplicateSelected} className={`${BTN} ${BTN_ACT} w-full mb-1.5`}>Duplicate</button>
            <button
              onClick={deleteSelected}
              title="Delete selected element"
              className={`${BTN} ${BTN_DEL} w-full flex items-center justify-center gap-1.5`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        )}

        {/* HISTORY */}
        <div className="border-t border-surface-border mt-3 pt-3" />
        <p className={SECTION_HDR}>History</p>
        <div className="flex gap-1.5">
          <button onClick={undo} disabled={!canUndo} className={`${BTN} ${BTN_ACT} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}>Undo</button>
          <button onClick={redo} disabled={!canRedo} className={`${BTN} ${BTN_ACT} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}>Redo</button>
        </div>

      </div>

      {/* ── Canvas area ── */}
      <div className="flex-1 overflow-auto bg-[#C8C4BC] flex items-center justify-center p-8">
        <div
          ref={canvasWrapperRef}
          className="relative flex-shrink-0 border border-[#D0C9BC]"
          style={{
            aspectRatio: '1 / 1.414',
            height: 'calc(100% - 2rem)',
            maxHeight: '90vh',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}
        >
        <div
          className="absolute top-0 left-0"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            background: bgColor,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
            overflow: 'visible',
          }}
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
                {el.type === 'text' && (
                  <div style={{
                    width: '100%', height: '100%', overflow: 'hidden',
                    fontSize: el.fontSize, fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle ?? 'normal',
                    textDecoration: el.textDecoration === 'underline' ? 'underline' : 'none',
                    textAlign: el.textAlign, color: el.color,
                    lineHeight: 1.35, wordBreak: 'break-word',
                  }}>
                    {!isEditing && (el.text || '')}
                    {isEditing && (
                      <textarea
                        autoFocus
                        defaultValue={el.text ?? ''}
                        onBlur={e => { updateElement(el.id, { text: e.target.value }); setEditingId(null) }}
                        onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); e.preventDefault() } }}
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          width: '100%', height: '100%',
                          background: 'transparent', border: 'none',
                          outline: 'none', resize: 'none', padding: 0,
                          cursor: 'text', fontSize: 'inherit',
                          fontWeight: 'inherit', fontStyle: 'inherit',
                          textDecoration: 'inherit', textAlign: 'inherit',
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

                {el.type === 'shape' && renderShapeContent(el)}

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
                          position: 'absolute', ...h.pos,
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

          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm text-center px-10 leading-relaxed">
                Use the toolbar to add text, shapes, or images to your poster.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
