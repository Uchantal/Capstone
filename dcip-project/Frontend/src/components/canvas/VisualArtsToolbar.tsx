import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Tool } from '../modules/VisualArtsModule'

type ShapeMode = 'outline' | 'fill'
type OpenPopup = 'colour' | 'background' | 'size' | null

const PRESET_COLOURS = [
  '#1A1A1A', '#FFFFFF', '#C8960C', '#D62828',
  '#2D6A4F', '#378ADD', '#F97316', '#7C3AED',
]

const BG_PRESETS = [
  { label: 'White',     value: '#FFFFFF' },
  { label: 'Cream',    value: '#F5F0E8' },
  { label: 'Lt. grey', value: '#E8E4DC' },
  { label: 'Dk. grey', value: '#333333' },
  { label: 'Black',    value: '#1A1A1A' },
  { label: 'Navy',     value: '#0E1117' },
]

const SIZE_PRESETS = [2, 6, 16, 32]

export interface VisualArtsToolbarProps {
  activeTool: Tool
  onToolChange: (t: Tool) => void
  shapeMode: ShapeMode
  onShapeModeChange: (m: ShapeMode) => void
  colour: string
  onColourChange: (c: string) => void
  bgColour: string
  onBgColourChange: (c: string) => void
  brushSize: number
  onBrushSizeChange: (s: number) => void
  canUndo: boolean
  onUndo: () => void
  canRedo: boolean
  onRedo: () => void
  onClear: () => void
  hasSelection?: boolean
  onDeleteSelected?: () => void
}

function Divider() {
  return (
    <>
      <div className="block sm:hidden border-l border-surface-border h-5 mx-0.5 flex-shrink-0" />
      <div className="hidden sm:block border-t border-surface-border w-6 lg:w-8 my-0.5 lg:my-1 flex-shrink-0" />
    </>
  )
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-dark-base text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden sm:block">
      {label}
    </span>
  )
}

export default function VisualArtsToolbar({
  activeTool, onToolChange,
  shapeMode, onShapeModeChange,
  colour, onColourChange,
  bgColour, onBgColourChange,
  brushSize, onBrushSizeChange,
  canUndo, onUndo,
  canRedo, onRedo,
  onClear,
  hasSelection, onDeleteSelected,
}: VisualArtsToolbarProps) {
  const [openPopup,     setOpenPopup]     = useState<OpenPopup>(null)
  const [popupStyle,    setPopupStyle]    = useState<React.CSSProperties>({})
  const [canScrollDown, setCanScrollDown] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const checkScroll = useCallback(() => {
    const el = toolbarRef.current
    if (!el) return
    setCanScrollDown(el.scrollHeight - el.scrollTop > el.clientHeight + 2)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  useEffect(() => {
    if (!openPopup) return
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPopup(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openPopup])

  function togglePopup(name: OpenPopup, e: React.MouseEvent) {
    if (openPopup === name) { setOpenPopup(null); return }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const isMobile = window.innerWidth < 640

    if (isMobile) {
      const popupW = 256
      const left = Math.max(4, Math.min(rect.left + rect.width / 2 - popupW / 2, window.innerWidth - popupW - 4))
      setPopupStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 6, left, zIndex: 50 })
    } else {
      const toolbarRight = toolbarRef.current ? toolbarRef.current.getBoundingClientRect().right + 4 : 60
      const clampedTop = Math.min(rect.top, window.innerHeight - 320)
      setPopupStyle({ position: 'fixed', top: clampedTop, left: toolbarRight, zIndex: 50 })
    }
    setOpenPopup(name)
  }

  const isShapeTool = activeTool === 'rect' || activeTool === 'circle'

  const toolBtn = (active: boolean) => {
    const base = 'w-9 h-9 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors duration-150'
    return active
      ? `${base} bg-primary text-white`
      : `${base} text-text-secondary hover:bg-surface-warm hover:text-text-primary`
  }

  const iconBtn = 'w-9 h-9 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-warm hover:text-text-primary transition-colors duration-150'
  const redBtn  = 'w-9 h-9 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-accent hover:bg-accent/10 transition-colors duration-150'
  const popupBase = 'bg-white border border-surface-border rounded-xl shadow-xl'

  return (
    // Outer wrapper: positioning context for scroll-shadow gradient
    <div className="w-full sm:w-12 lg:w-14 flex-shrink-0 relative z-10">

      {/* Inner scrollable toolbar strip */}
      <div
        ref={toolbarRef}
        className="
          h-12 sm:h-full bg-white
          border-t sm:border-t-0 sm:border-r border-surface-border
          flex flex-row sm:flex-col items-center
          px-1 sm:px-0 sm:py-2 lg:py-3
          gap-0.5
          overflow-x-auto sm:overflow-y-auto
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        onScroll={checkScroll}
      >
        {/* ── Select ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Select and move" onClick={() => onToolChange('select')} className={toolBtn(activeTool === 'select')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2l16 10-7 1.5L9.5 20 4 2z"/>
            </svg>
          </button>
          <Tooltip label="Select and move" />
        </div>

        <Divider />

        {/* ── Brush ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Brush" onClick={() => onToolChange('brush')} className={toolBtn(activeTool === 'brush')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
          <Tooltip label="Brush" />
        </div>

        {/* ── Eraser ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Eraser" onClick={() => onToolChange('eraser')} className={toolBtn(activeTool === 'eraser')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
              <path d="M22 21H7"/>
              <path d="m5 11 9 9"/>
            </svg>
          </button>
          <Tooltip label="Eraser (freehand only)" />
        </div>

        <Divider />

        {/* ── Line ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Line" onClick={() => onToolChange('line')} className={toolBtn(activeTool === 'line')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="19" x2="19" y2="5"/>
            </svg>
          </button>
          <Tooltip label="Line" />
        </div>

        {/* ── Rectangle ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Rectangle" onClick={() => onToolChange('rect')} className={toolBtn(activeTool === 'rect')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
            </svg>
          </button>
          <Tooltip label="Rectangle" />
        </div>

        {/* ── Ellipse ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Ellipse" onClick={() => onToolChange('circle')} className={toolBtn(activeTool === 'circle')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="12" rx="9" ry="6"/>
            </svg>
          </button>
          <Tooltip label="Ellipse" />
        </div>

        {/* ── Ruler ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Ruler" onClick={() => onToolChange('ruler')} className={toolBtn(activeTool === 'ruler')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l4-4 14 14-4 4z"/>
              <path d="M8 12l2 2"/>
              <path d="M12 8l2 2"/>
              <path d="M6 16l2 2"/>
            </svg>
          </button>
          <Tooltip label="Ruler (measure distance)" />
        </div>

        {/* ── Fill / Outline — only when rect or circle active ── */}
        {isShapeTool && (
          <>
            <Divider />
            <div className="relative group flex-shrink-0">
              <button aria-label="Fill shape" onClick={() => onShapeModeChange('fill')} className={toolBtn(shapeMode === 'fill')}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
                </svg>
              </button>
              <Tooltip label="Fill shape" />
            </div>
            <div className="relative group flex-shrink-0">
              <button aria-label="Outline shape" onClick={() => onShapeModeChange('outline')} className={toolBtn(shapeMode === 'outline')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              </button>
              <Tooltip label="Outline shape" />
            </div>
          </>
        )}

        <Divider />

        {/* ── Drawing colour ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Drawing colour" onClick={e => togglePopup('colour', e)} className={iconBtn}>
            <span
              className="w-5 h-5 rounded-full border border-text-primary/20 flex-shrink-0"
              style={{ backgroundColor: colour, boxShadow: colour === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : undefined }}
            />
          </button>
          <Tooltip label="Drawing colour" />
        </div>

        {/* ── Canvas background ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Canvas background" onClick={e => togglePopup('background', e)} className={iconBtn}>
            <span
              className="w-5 h-5 rounded-sm border border-surface-border flex-shrink-0"
              style={{ backgroundColor: bgColour }}
            />
          </button>
          <Tooltip label="Canvas background" />
        </div>

        <Divider />

        {/* ── Brush size ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Brush size" onClick={e => togglePopup('size', e)} className={iconBtn}>
            <span className="text-[11px] font-bold text-text-secondary leading-none select-none">{brushSize}</span>
          </button>
          <Tooltip label={`Brush size (${brushSize}px)`} />
        </div>

        <Divider />

        {/* ── Undo ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Undo" onClick={onUndo} disabled={!canUndo} className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5"/>
              <path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>
            </svg>
          </button>
          <Tooltip label="Undo" />
        </div>

        {/* ── Redo ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Redo" onClick={onRedo} disabled={!canRedo} className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14l5-5-5-5"/>
              <path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>
            </svg>
          </button>
          <Tooltip label="Redo" />
        </div>

        <Divider />

        {/* ── Delete selected shape ── */}
        {hasSelection && onDeleteSelected && (
          <div className="relative group flex-shrink-0">
            <button aria-label="Delete selected" onClick={onDeleteSelected} className={redBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
            </button>
            <Tooltip label="Delete selected" />
          </div>
        )}

        {/* ── Clear canvas ── */}
        <div className="relative group flex-shrink-0">
          <button aria-label="Clear canvas" onClick={onClear} className={redBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
          <Tooltip label="Clear all" />
        </div>


        {/* ════ POPUPS ════ */}

        {openPopup === 'colour' && (
          <div style={popupStyle} className={`${popupBase} p-4 w-64`}>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Drawing colour</p>
            <input type="color" value={colour} onChange={e => onColourChange(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-lg border border-surface-border mb-3" style={{ padding: 2 }} />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLOURS.map(c => (
                <button key={c} onClick={() => { onColourChange(c); setOpenPopup(null) }} title={c}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${colour === c ? 'border-text-primary scale-110' : 'border-transparent hover:border-text-primary/40'}`}
                  style={{ backgroundColor: c, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : undefined }}
                />
              ))}
            </div>
          </div>
        )}

        {openPopup === 'background' && (
          <div style={popupStyle} className={`${popupBase} p-4 w-64`}>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Canvas background</p>
            <input type="color" value={bgColour} onChange={e => onBgColourChange(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-lg border border-surface-border mb-3" style={{ padding: 2 }} />
            <div className="grid grid-cols-3 gap-2">
              {BG_PRESETS.map(p => (
                <button key={p.value} onClick={() => { onBgColourChange(p.value); setOpenPopup(null) }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${bgColour === p.value ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/40'}`}>
                  <span className="w-7 h-7 rounded border border-surface-border" style={{ backgroundColor: p.value }} />
                  <span className="text-[10px] text-text-secondary leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {openPopup === 'size' && (
          <div style={popupStyle} className={`${popupBase} p-4 w-56`}>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Brush size</p>
            <div className="flex items-center gap-2 mb-3">
              <input type="range" min={1} max={80} value={brushSize}
                onChange={e => onBrushSizeChange(Number(e.target.value))} className="flex-1 accent-primary" />
              <span className="text-xs font-semibold text-text-primary w-12 text-right">{brushSize}px</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {SIZE_PRESETS.map(s => (
                <button key={s} onClick={() => { onBrushSizeChange(s); setOpenPopup(null) }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-colors ${brushSize === s ? 'border-primary bg-primary/5 text-primary' : 'border-surface-border text-text-secondary hover:border-primary/40'}`}>
                  <span className="text-xs font-semibold leading-none">{s}px</span>
                  <span className={`rounded-full flex-shrink-0 ${brushSize === s ? 'bg-primary' : 'bg-text-secondary'}`}
                    style={{ width: Math.max(3, s * 0.38), height: Math.max(3, s * 0.38) }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scroll shadow — tells users there are more tools below (vertical layout only) */}
      {canScrollDown && (
        <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
      )}
    </div>
  )
}
