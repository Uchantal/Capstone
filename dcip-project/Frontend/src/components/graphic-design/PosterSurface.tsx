import React, { useEffect, useRef, useState } from 'react'
import GraphicDesignToolbar from '../canvas/GraphicDesignToolbar'
import SessionNotepad from '../canvas/SessionNotepad'

export interface CanvasTemplate {
  id: string
  label: string
  realW: number
  realH: number
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  { id: 'a4-poster',       label: 'A4 Poster',       realW: 595,  realH: 842  },
  { id: 'instagram-post',  label: 'Instagram Post',  realW: 1080, realH: 1080 },
  { id: 'instagram-story', label: 'Instagram Story', realW: 1080, realH: 1920 },
  { id: 'facebook-cover',  label: 'Facebook Cover',  realW: 820,  realH: 312  },
  { id: 'a5-flyer',        label: 'A5 Flyer',        realW: 420,  realH: 595  },
  { id: 'free',            label: 'Free Canvas',     realW: 1200, realH: 800  },
]

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
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  fill?: string
  strokeColor?: string
  strokeWidth?: number
  borderRadius?: number
  shapeType?: ShapeType
  src?: string
}

export const DEFAULT_BG_COLOR = '#FFFFFF'
export const DEFAULT_ELEMENTS: DesignElement[] = []

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const SHAPE_SVG: Record<ShapeType, (fill: string) => React.ReactNode> = {
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

export type PickerItem =
  | { kind: 'rect';   label: string }
  | { kind: 'circle'; label: string }
  | { kind: 'shape';  type: ShapeType; label: string }

export const PICKER_ITEMS: PickerItem[] = [
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
  canvasW = 595,
  canvasH = 842,
): Promise<string> {
  const W = canvasW
  const H = canvasH
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

interface Props {
  defaultElements: DesignElement[]
  defaultBgColor: string
  onChange: (elements: DesignElement[], bgColor: string) => void
  onInteraction: () => void
  onDimensionsChange?: (w: number, h: number) => void
  defaultTemplateId?: string
}

export default function DesignCanvas({ defaultElements, defaultBgColor, onChange, onInteraction, onDimensionsChange, defaultTemplateId }: Props) {
  const initialTemplate = CANVAS_TEMPLATES.find(t => t.id === (defaultTemplateId ?? 'a4-poster')) ?? CANVAS_TEMPLATES[0]

  const [elements,        setElements]        = useState<DesignElement[]>(defaultElements)
  const [bgColor,         setBgColor]         = useState(defaultBgColor)
  const [selectedId,      setSelectedId]      = useState<string | null>(null)
  const [editingId,       setEditingId]       = useState<string | null>(null)
  const [canUndo,         setCanUndo]         = useState(false)
  const [canRedo,         setCanRedo]         = useState(false)
  const [canvasScale,     setCanvasScale]     = useState(1)
  const [template,        setTemplate]        = useState<CanvasTemplate>(initialTemplate)
  const [canvasW,         setCanvasW]         = useState(initialTemplate.realW)
  const [canvasH,         setCanvasH]         = useState(initialTemplate.realH)
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null)

  const historyRef      = useRef<Array<{ elements: DesignElement[]; bgColor: string }>>([{ elements: defaultElements, bgColor: defaultBgColor }])
  const historyIdxRef   = useRef(0)
  const canvasAreaRef    = useRef<HTMLDivElement>(null)
  const canvasScaleRef   = useRef(1)
  const canvasWRef       = useRef(initialTemplate.realW)
  const canvasHRef       = useRef(initialTemplate.realH)
  const templateIdRef    = useRef(initialTemplate.id)

  const selectedEl = elements.find(el => el.id === selectedId) ?? null

  // Scale canvas to fit the available area, accounting for label height
  useEffect(() => {
    const area = canvasAreaRef.current
    if (!area) return
    const PADDING = 16, LABEL_H = 28
    const update = () => {
      if (templateIdRef.current === 'free') {
        const w = area.offsetWidth
        const h = area.offsetHeight
        canvasWRef.current = w
        canvasHRef.current = h
        setCanvasW(w)
        setCanvasH(h)
        canvasScaleRef.current = 1
        setCanvasScale(1)
        onDimensionsChange?.(w, h)
      } else {
        const availW = area.offsetWidth  - 2 * PADDING
        const availH = area.offsetHeight - LABEL_H - 2 * PADDING
        const s = Math.min(availW / canvasWRef.current, availH / canvasHRef.current)
        canvasScaleRef.current = s
        setCanvasScale(s)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(area)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id])

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
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = ev => {
      const raw = ev.target?.result as string
      // Scale down large images before storing to keep the data URL small
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h / w) * MAX); w = MAX }
          else       { w = Math.round((w / h) * MAX); h = MAX }
        }
        const offscreen = document.createElement('canvas')
        offscreen.width = w; offscreen.height = h
        offscreen.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const src = offscreen.toDataURL('image/jpeg', 0.85)
        const id = makeId()
        const aspect = w / h
        const dispW = Math.min(300, w)
        const dispH = Math.round(dispW / aspect)
        const newEl: DesignElement = {
          id, type: 'image',
          x: 60, y: 100, width: dispW, height: dispH,
          zIndex: elements.length + 1, src,
        }
        const newEls = [...elements, newEl]
        setSelectedId(id)
        commit(newEls, bgColor)
      }
      img.src = raw
    }
    reader.readAsDataURL(file)
  }

  // Drag and resize — mouse deltas are divided by canvasScale to get logical coordinates
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

  function handleFontSizeChange(sz: number) {
    if (!selectedEl || selectedEl.type !== 'text') return
    updateElement(selectedEl.id, { fontSize: sz })
  }

  function handleBoldToggle() {
    if (!selectedEl || selectedEl.type !== 'text') return
    updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })
  }

  function handleItalicToggle() {
    if (!selectedEl || selectedEl.type !== 'text') return
    updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })
  }

  function handleUnderlineToggle() {
    if (!selectedEl || selectedEl.type !== 'text') return
    updateElement(selectedEl.id, { textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' })
  }

  function handleAlignChange(align: 'left' | 'center' | 'right') {
    if (!selectedEl || selectedEl.type !== 'text') return
    updateElement(selectedEl.id, { textAlign: align })
  }

  function applyTemplate(t: CanvasTemplate) {
    canvasWRef.current  = t.realW
    canvasHRef.current  = t.realH
    templateIdRef.current = t.id
    setTemplate(t)
    setCanvasW(t.realW)
    setCanvasH(t.realH)
    const fresh: DesignElement[] = []
    setElements(fresh)
    setBgColor(defaultBgColor)
    onChange(fresh, defaultBgColor)
    historyRef.current    = [{ elements: fresh, bgColor: defaultBgColor }]
    historyIdxRef.current = 0
    setCanUndo(false)
    setCanRedo(false)
    setSelectedId(null)
    setEditingId(null)
    setPendingTemplate(null)
    onDimensionsChange?.(t.realW, t.realH)
  }

  function selectTemplate(t: CanvasTemplate) {
    const hasContent = elements.length > 0
    if (hasContent) {
      setPendingTemplate(t)
    } else {
      applyTemplate(t)
    }
  }

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  const activeElementColor: string | null = selectedEl
    ? (selectedEl.type === 'text'
        ? (selectedEl.color ?? null)
        : selectedEl.type !== 'image'
          ? (selectedEl.fill ?? null)
          : null)
    : null

  return (
    <div className="flex-1 flex flex-col-reverse sm:flex-row overflow-hidden">

      {/* Toolbar */}
      <GraphicDesignToolbar
        selectedElement={selectedEl}
        colour={activeElementColor}
        onColourChange={applyElementColor}
        bgColour={bgColor}
        onBgColourChange={changeBgColor}
        onAddText={addTextElement}
        onAddHeading={addHeadingElement}
        onAddRect={addRectElement}
        onAddCircle={addCircleElement}
        onAddShape={addShapeElement}
        onAddImage={handleImageUpload}
        onAddDetails={addContactBlock}
        onFontSizeChange={handleFontSizeChange}
        onBoldToggle={handleBoldToggle}
        onItalicToggle={handleItalicToggle}
        onUnderlineToggle={handleUnderlineToggle}
        onAlignChange={handleAlignChange}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        canUndo={canUndo}
        onUndo={undo}
        canRedo={canRedo}
        onRedo={redo}
        templates={CANVAS_TEMPLATES}
        activeTemplate={template}
        onTemplateChange={selectTemplate}
      />

      {/* Canvas area */}
      <div ref={canvasAreaRef} className="flex-1 relative overflow-hidden bg-[#F3F3F3]">
        <SessionNotepad />

        {template.id === 'free' ? (
          <div
            style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
          >
          <div
            className="absolute top-0 left-0"
            style={{ width: canvasW, height: canvasH, background: bgColor, overflow: 'visible' }}
            onClick={() => { setSelectedId(null); setEditingId(null) }}
          >
            {sorted.map(el => {
              const isSelected = selectedId === el.id
              const isEditing  = editingId  === el.id
              return (
                <div
                  key={el.id}
                  style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.zIndex, cursor: isEditing ? 'text' : 'move', userSelect: 'none' }}
                  onClick={e => { e.stopPropagation(); setSelectedId(el.id) }}
                  onMouseDown={e => { if (!isEditing) handleElementMouseDown(e, el.id) }}
                  onDoubleClick={e => { e.stopPropagation(); if (el.type === 'text') { setEditingId(el.id); setSelectedId(el.id) } }}
                >
                  {el.type === 'text' && (<div style={{ width:'100%',height:'100%',overflow:'hidden',fontSize:el.fontSize,fontWeight:el.fontWeight,fontStyle:el.fontStyle??'normal',textDecoration:el.textDecoration==='underline'?'underline':'none',textAlign:el.textAlign,color:el.color,lineHeight:1.35,wordBreak:'break-word' }}>{!isEditing&&(el.text||'')}{isEditing&&(<textarea autoFocus defaultValue={el.text??''} onBlur={e=>{updateElement(el.id,{text:e.target.value});setEditingId(null)}} onKeyDown={e=>{if(e.key==='Escape'){setEditingId(null);e.preventDefault()}}} onMouseDown={e=>e.stopPropagation()} style={{width:'100%',height:'100%',background:'transparent',border:'none',outline:'none',resize:'none',padding:0,cursor:'text',fontSize:'inherit',fontWeight:'inherit',fontStyle:'inherit',textDecoration:'inherit',textAlign:'inherit',color:'inherit',lineHeight:'inherit'}}/>)}</div>)}
                  {el.type==='rect'&&(<div style={{width:'100%',height:'100%',background:el.fill??'#C8960C',borderRadius:el.borderRadius,border:el.strokeColor&&el.strokeWidth?`${el.strokeWidth}px solid ${el.strokeColor}`:undefined}}/>)}
                  {el.type==='circle'&&(<div style={{width:'100%',height:'100%',background:el.fill??'#2D6A4F',borderRadius:'50%',border:el.strokeColor&&el.strokeWidth?`${el.strokeWidth}px solid ${el.strokeColor}`:undefined}}/>)}
                  {el.type==='shape'&&renderShapeContent(el)}
                  {el.type==='image'&&el.src&&(<div style={{width:'100%',height:'100%',overflow:'hidden'}}><img src={el.src} alt="" draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none',userSelect:'none'}}/></div>)}
                  {isSelected&&!isEditing&&(<><div style={{position:'absolute',inset:0,outline:'2px solid #3b82f6',outlineOffset:1,pointerEvents:'none'}}/>{(el.type==='rect'||el.type==='circle'||el.type==='shape')&&(<div style={{position:'absolute',left:'50%',top:'100%',transform:'translateX(-50%) translateY(4px)',fontSize:12,fontWeight:600,fontFamily:'sans-serif',color:'#C9A84C',background:'rgba(255,255,255,0.88)',padding:'2px 5px',borderRadius:3,whiteSpace:'nowrap',pointerEvents:'none',lineHeight:1}}>{Math.round(el.width)} x {Math.round(el.height)}</div>)}{RESIZE_HANDLES.map(h=>(<div key={h.id} style={{position:'absolute',...h.pos,width:10,height:10,background:'#ffffff',border:'1.5px solid #3b82f6',borderRadius:2,cursor:h.cursor,zIndex:9999}} onMouseDown={e=>handleResizeMouseDown(e,el.id,h.id)} onClick={e=>e.stopPropagation()}/>))}</>)}
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
        ) : (
          <>
          <div style={{ position: 'absolute', inset: '0 0 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            style={{
              width: Math.round(canvasW * canvasScale),
              height: Math.round(canvasH * canvasScale),
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #D0C9BC',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >
          <div
            className="absolute top-0 left-0"
            style={{
              width: canvasW,
              height: canvasH,
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
                    {(el.type === 'rect' || el.type === 'circle' || el.type === 'shape') && (
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: `translateX(-50%) translateY(${4 / canvasScale}px)`,
                        fontSize: 12 / canvasScale,
                        fontWeight: 600,
                        fontFamily: 'sans-serif',
                        color: '#C9A84C',
                        background: 'rgba(255,255,255,0.88)',
                        padding: `${2 / canvasScale}px ${5 / canvasScale}px`,
                        borderRadius: 3 / canvasScale,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        lineHeight: 1,
                      }}>
                        {Math.round(el.width)} x {Math.round(el.height)}
                      </div>
                    )}
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
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'sans-serif' }}>
            {template.label} - {template.realW} x {template.realH}px
          </span>
        </div>
        </>
        )}

      </div>

      {/* Format change dialog */}
      {pendingTemplate !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', border: '1px solid #C9A84C', borderRadius: 12, padding: 28, maxWidth: 360, width: '90%' }}>
            <h2 style={{ fontFamily: 'sans-serif', fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              Change canvas format?
            </h2>
            <p style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
              Changing the canvas format will clear your current work. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingTemplate(null)}
                style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={() => applyTemplate(pendingTemplate)}
                style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#C9A84C', cursor: 'pointer', color: '#fff' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
