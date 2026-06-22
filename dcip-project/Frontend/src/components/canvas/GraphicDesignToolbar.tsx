import React, { useEffect, useRef, useState } from 'react'
import { CanvasTemplate, DesignElement, PickerItem, PICKER_ITEMS, SHAPE_SVG, ShapeType } from '../graphic-design/PosterSurface'

type OpenPopup = 'colour' | 'background' | 'fontsize' | 'shapes' | 'templates' | null

const BG_COLORS      = ['#FFFFFF', '#1A1A1A', '#C8960C', '#2D6A4F', '#D62828', '#1e3a5f', '#F9F7F4', '#f59e0b']
const ELEMENT_COLORS = ['#1A1A1A', '#ffffff', '#C8960C', '#D62828', '#2D6A4F', '#10B981', '#60A5FA', '#9ca3af', '#f59e0b', '#1e3a5f']
const FONT_SIZE_PRESETS = [10, 12, 14, 16, 18, 24, 28, 32, 36, 48, 64, 72, 96]

export interface GraphicDesignToolbarProps {
  selectedElement: DesignElement | null
  colour: string | null
  onColourChange: (c: string) => void
  bgColour: string
  onBgColourChange: (c: string) => void
  onAddText: () => void
  onAddHeading: () => void
  onAddRect: () => void
  onAddCircle: () => void
  onAddShape: (type: ShapeType) => void
  onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddDetails: () => void
  onFontSizeChange: (size: number) => void
  onBoldToggle: () => void
  onItalicToggle: () => void
  onUnderlineToggle: () => void
  onAlignChange: (align: 'left' | 'center' | 'right') => void
  onDuplicate: () => void
  onDelete: () => void
  canUndo: boolean
  onUndo: () => void
  canRedo: boolean
  onRedo: () => void
  templates: CanvasTemplate[]
  activeTemplate: CanvasTemplate
  onTemplateChange: (t: CanvasTemplate) => void
}

function Divider() {
  return <div className="border-t border-surface-border w-8 my-1" />
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="absolute left-12 top-1/2 -translate-y-1/2 bg-dark-base text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {label}
    </span>
  )
}

export default function GraphicDesignToolbar({
  selectedElement,
  colour, onColourChange,
  bgColour, onBgColourChange,
  onAddText, onAddHeading,
  onAddRect, onAddCircle, onAddShape,
  onAddImage, onAddDetails,
  onFontSizeChange,
  onBoldToggle, onItalicToggle, onUnderlineToggle,
  onAlignChange,
  onDuplicate, onDelete,
  canUndo, onUndo,
  canRedo, onRedo,
  templates, activeTemplate, onTemplateChange,
}: GraphicDesignToolbarProps) {
  const [openPopup,    setOpenPopup]    = useState<OpenPopup>(null)
  const [popupTop,     setPopupTop]     = useState(0)
  const [localFontSz,  setLocalFontSz]  = useState<number>(selectedElement?.fontSize ?? 24)
  const toolbarRef   = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const isText      = selectedElement?.type === 'text'
  const hasSelected = selectedElement !== null
  const isBold      = selectedElement?.fontWeight === 'bold'
  const isItalic    = selectedElement?.fontStyle  === 'italic'
  const isUnderline = selectedElement?.textDecoration === 'underline'
  const textAlign   = selectedElement?.textAlign ?? 'left'

  // Sync local font size when selection changes
  useEffect(() => {
    setLocalFontSz(selectedElement?.fontSize ?? 24)
  }, [selectedElement?.id, selectedElement?.fontSize])

  // Close popup on outside click
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
    setPopupTop(rect.top)
    setOpenPopup(name)
  }

  function pickShape(item: PickerItem) {
    if (item.kind === 'rect')        onAddRect()
    else if (item.kind === 'circle') onAddCircle()
    else                             onAddShape(item.type)
    setOpenPopup(null)
  }

  const iconBtn = (active = false, disabled = false) => {
    if (active) return 'w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white'
    if (disabled) return 'w-10 h-10 flex items-center justify-center rounded-lg text-text-secondary opacity-30 cursor-not-allowed'
    return 'w-10 h-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-warm hover:text-text-primary transition-colors duration-150'
  }

  const redBtn = (disabled = false) =>
    disabled
      ? 'w-10 h-10 flex items-center justify-center rounded-lg text-accent opacity-30 cursor-not-allowed'
      : 'w-10 h-10 flex items-center justify-center rounded-lg text-accent hover:bg-accent/10 transition-colors duration-150'

  return (
    <div
      ref={toolbarRef}
      className="w-14 flex-shrink-0 bg-white border-r border-surface-border flex flex-col items-center py-3 gap-1 overflow-visible relative z-10"
    >
      {/* ── Canvas format ────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={e => togglePopup('templates', e)} className={iconBtn(openPopup === 'templates')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <Tooltip label="Canvas format" />
      </div>

      <Divider />

      {/* ── Add text ─────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={onAddText} className={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3"/>
            <path d="M9 20h6"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
        </button>
        <Tooltip label="Add text" />
      </div>

      {/* ── Add heading ──────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={onAddHeading} className={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3"/>
            <path d="M9 20h6"/>
            <line x1="12" y1="4" x2="12" y2="14"/>
            <line x1="6" y1="17" x2="18" y2="17"/>
          </svg>
        </button>
        <Tooltip label="Add heading" />
      </div>

      {/* ── Shapes ───────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={e => togglePopup('shapes', e)} className={iconBtn(openPopup === 'shapes')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="8" height="8" rx="1"/>
            <circle cx="17" cy="7" r="4"/>
          </svg>
        </button>
        <Tooltip label="Add shape" />
      </div>

      {/* ── Add image ────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={() => imageInputRef.current?.click()} className={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <Tooltip label="Add image" />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onAddImage} />
      </div>

      {/* ── Add details ──────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={onAddDetails} className={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="12" y2="18"/>
          </svg>
        </button>
        <Tooltip label="Add contact details" />
      </div>

      <Divider />

      {/* ── Background colour ────────────────────────────────── */}
      <div className="relative group">
        <button onClick={e => togglePopup('background', e)} className={iconBtn()}>
          <span
            className="w-5 h-5 rounded-sm border border-surface-border flex-shrink-0"
            style={{ backgroundColor: bgColour }}
          />
        </button>
        <Tooltip label="Poster background" />
      </div>

      {/* ── Element colour ───────────────────────────────────── */}
      <div className="relative group">
        <button onClick={e => togglePopup('colour', e)} className={iconBtn()} disabled={!hasSelected}>
          <span
            className="w-5 h-5 rounded-full border border-text-primary/20 flex-shrink-0"
            style={{
              backgroundColor: colour ?? '#C8960C',
              boxShadow: colour === '#FFFFFF' || colour === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
            }}
          />
        </button>
        <Tooltip label="Element colour" />
      </div>

      <Divider />

      {/* ── Font size ────────────────────────────────────────── */}
      <div className="relative group">
        <button
          onClick={e => isText ? togglePopup('fontsize', e) : undefined}
          disabled={!isText}
          className={iconBtn(openPopup === 'fontsize', !isText)}
          title={isText ? `Font size: ${localFontSz}px` : 'Select a text element first'}
        >
          {/* Large A with up/down arrows to indicate size control */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20L12 4l8 16"/>
            <path d="M7 14h10"/>
            <line x1="20" y1="5"  x2="20" y2="1"/>
            <line x1="20" y1="1"  x2="18" y2="3"/>
            <line x1="20" y1="1"  x2="22" y2="3"/>
            <line x1="20" y1="12" x2="20" y2="16"/>
            <line x1="20" y1="16" x2="18" y2="14"/>
            <line x1="20" y1="16" x2="22" y2="14"/>
          </svg>
        </button>
        <Tooltip label={isText ? `Font size (${localFontSz}px)` : 'Font size'} />
      </div>

      {/* ── Bold ─────────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? onBoldToggle : undefined} disabled={!isText} className={iconBtn(isBold, !isText)}>
          <span className="text-sm font-bold leading-none">B</span>
        </button>
        <Tooltip label="Bold" />
      </div>

      {/* ── Italic ───────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? onItalicToggle : undefined} disabled={!isText} className={iconBtn(isItalic, !isText)}>
          <span className="text-sm italic leading-none">I</span>
        </button>
        <Tooltip label="Italic" />
      </div>

      {/* ── Underline ────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? onUnderlineToggle : undefined} disabled={!isText} className={iconBtn(isUnderline, !isText)}>
          <span className="text-sm underline leading-none">U</span>
        </button>
        <Tooltip label="Underline" />
      </div>

      <Divider />

      {/* ── Align left ───────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? () => onAlignChange('left') : undefined} disabled={!isText} className={iconBtn(isText && textAlign === 'left', !isText)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="12" y2="18"/>
          </svg>
        </button>
        <Tooltip label="Align left" />
      </div>

      {/* ── Align centre ─────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? () => onAlignChange('center') : undefined} disabled={!isText} className={iconBtn(isText && textAlign === 'center', !isText)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3"  y1="6"  x2="21" y2="6"/>
            <line x1="6"  y1="12" x2="18" y2="12"/>
            <line x1="9"  y1="18" x2="15" y2="18"/>
          </svg>
        </button>
        <Tooltip label="Align centre" />
      </div>

      {/* ── Align right ──────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={isText ? () => onAlignChange('right') : undefined} disabled={!isText} className={iconBtn(isText && textAlign === 'right', !isText)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3"  y1="6"  x2="21" y2="6"/>
            <line x1="9"  y1="12" x2="21" y2="12"/>
            <line x1="12" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <Tooltip label="Align right" />
      </div>

      <Divider />

      {/* ── Duplicate ────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={hasSelected ? onDuplicate : undefined} disabled={!hasSelected} className={iconBtn(false, !hasSelected)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8"  y="8"  width="13" height="13" rx="2"/>
            <rect x="3"  y="3"  width="13" height="13" rx="2"/>
          </svg>
        </button>
        <Tooltip label="Duplicate element" />
      </div>

      {/* ── Delete ───────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={hasSelected ? onDelete : undefined} disabled={!hasSelected} className={redBtn(!hasSelected)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
        <Tooltip label="Delete element" />
      </div>

      <Divider />

      {/* ── Undo ─────────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={onUndo} disabled={!canUndo} className={`${iconBtn()} disabled:opacity-40 disabled:cursor-not-allowed`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5"/>
            <path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>
          </svg>
        </button>
        <Tooltip label="Undo (Ctrl+Z)" />
      </div>

      {/* ── Redo ─────────────────────────────────────────────── */}
      <div className="relative group">
        <button onClick={onRedo} disabled={!canRedo} className={`${iconBtn()} disabled:opacity-40 disabled:cursor-not-allowed`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5"/>
            <path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>
          </svg>
        </button>
        <Tooltip label="Redo (Ctrl+Shift+Z)" />
      </div>


      {/* ════════════════════════════════════════════════════════
          POPUPS — fixed to viewport so parent overflow:hidden
          does not clip them
      ════════════════════════════════════════════════════════ */}

      {/* ── Shapes picker popup ──────────────────────────────── */}
      {openPopup === 'shapes' && (
        <div
          style={{ position: 'fixed', left: 56, top: popupTop }}
          className="bg-white border border-surface-border rounded-xl shadow-xl p-3 z-50 w-64"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Add shape</p>
          <div className="grid grid-cols-3 gap-2">
            {PICKER_ITEMS.map(item => {
              const key = item.kind === 'shape' ? item.type : item.kind
              return (
                <button
                  key={key}
                  onClick={() => pickShape(item)}
                  className="flex flex-col items-center justify-start gap-1 pt-2 pb-1.5 px-1 rounded-lg bg-surface-warm hover:bg-white hover:shadow-sm cursor-pointer"
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

      {/* ── Background popup ─────────────────────────────────── */}
      {openPopup === 'background' && (
        <div
          style={{ position: 'fixed', left: 56, top: popupTop }}
          className="bg-white border border-surface-border rounded-xl shadow-xl p-4 z-50 w-64"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Poster background</p>
          <label className="block mb-3 cursor-pointer">
            <input
              type="color"
              value={bgColour}
              onChange={e => onBgColourChange(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-lg border border-surface-border"
              style={{ padding: 2 }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {BG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => { onBgColourChange(c); setOpenPopup(null) }}
                title={c}
                className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all ${
                  bgColour === c ? 'border-primary scale-110' : 'border-transparent hover:border-text-primary/30'
                }`}
                style={{ backgroundColor: c, boxShadow: c === '#FFFFFF' || c === '#F9F7F4' ? 'inset 0 0 0 1px #e5e7eb' : undefined }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Element colour popup ─────────────────────────────── */}
      {openPopup === 'colour' && hasSelected && (
        <div
          style={{ position: 'fixed', left: 56, top: popupTop }}
          className="bg-white border border-surface-border rounded-xl shadow-xl p-4 z-50 w-64"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Element colour</p>
          <label className="block mb-3 cursor-pointer">
            <input
              type="color"
              value={colour ?? '#C8960C'}
              onChange={e => onColourChange(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-lg border border-surface-border"
              style={{ padding: 2 }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {ELEMENT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => { onColourChange(c); setOpenPopup(null) }}
                title={c}
                className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all ${
                  colour === c ? 'border-primary scale-110' : 'border-transparent hover:border-text-primary/30'
                }`}
                style={{ backgroundColor: c, boxShadow: c === '#ffffff' || c === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : undefined }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas format popup ──────────────────────────────── */}
      {openPopup === 'templates' && (
        <div
          style={{ position: 'fixed', left: 56, top: popupTop }}
          className="bg-white border border-surface-border rounded-xl shadow-xl p-3 z-50 w-56"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Canvas format</p>
          <div className="flex flex-col gap-1">
            {templates.map(t => {
              const contW = 36, contH = 26
              const scale = t.id === 'free' ? 1 : Math.min(contW / t.realW, contH / t.realH)
              const thumbW = t.id === 'free' ? contW : Math.round(t.realW * scale)
              const thumbH = t.id === 'free' ? contH : Math.round(t.realH * scale)
              const isActive = activeTemplate.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => { onTemplateChange(t); setOpenPopup(null) }}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors border ${
                    isActive
                      ? 'bg-primary/10 border-primary/30'
                      : 'hover:bg-surface-warm border-transparent'
                  }`}
                >
                  <div style={{ width: contW, height: contH, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: thumbW, height: thumbH, background: isActive ? '#C9A84C' : '#D1D5DB', borderRadius: 2 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>{t.label}</p>
                    <p className="text-[10px] text-text-muted leading-tight">
                      {t.id === 'free' ? 'Fills workspace' : `${t.realW} x ${t.realH}px`}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Font size popup ──────────────────────────────────── */}
      {openPopup === 'fontsize' && isText && (
        <div
          style={{ position: 'fixed', left: 56, top: popupTop }}
          className="bg-white border border-surface-border rounded-xl shadow-xl p-4 z-50 w-56"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Font size</p>
          <div className="flex items-center gap-1 mb-3">
            <button
              onClick={() => {
                const s = Math.max(8, localFontSz - 1)
                setLocalFontSz(s)
                onFontSizeChange(s)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-surface-warm transition-colors text-sm font-bold"
            >
              -
            </button>
            <input
              type="number"
              min={8}
              max={200}
              value={localFontSz}
              onChange={e => {
                const s = Math.max(8, Math.min(200, parseInt(e.target.value) || 8))
                setLocalFontSz(s)
                onFontSizeChange(s)
              }}
              className="flex-1 border border-surface-border rounded-lg text-sm text-text-primary px-2 py-1.5 text-center focus:outline-none focus:border-primary bg-white font-medium"
            />
            <button
              onClick={() => {
                const s = Math.min(200, localFontSz + 1)
                setLocalFontSz(s)
                onFontSizeChange(s)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:bg-surface-warm transition-colors text-sm font-bold"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FONT_SIZE_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => { setLocalFontSz(s); onFontSizeChange(s); setOpenPopup(null) }}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  localFontSz === s
                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                    : 'border-surface-border text-text-secondary hover:border-primary/40'
                }`}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
