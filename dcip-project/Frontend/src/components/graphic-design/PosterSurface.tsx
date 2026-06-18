import { RefObject, useEffect, useRef } from 'react'

export interface PosterState {
  title: string
  subtitle: string
  fontSize: 'small' | 'medium' | 'large'
  alignment: 'left' | 'center' | 'right'
  bgColour: string
  titleColour: string
}

export const DEFAULT_POSTER: PosterState = {
  title: '',
  subtitle: '',
  fontSize: 'medium',
  alignment: 'left',
  bgColour: '#1A1A1A',
  titleColour: '#C8960C',
}

interface Props {
  value: PosterState
  onChange: (s: PosterState) => void
  canvasRef: RefObject<HTMLCanvasElement>
  showDrawLayer?: boolean
}

const BG_SWATCHES = ['#1A1A1A', '#2D6A4F', '#1e3a5f', '#5c1a1a', '#FAFAF7', '#C8960C']
const TITLE_SWATCHES = ['#C8960C', '#FFFFFF', '#D62828', '#10B981', '#60A5FA', '#1A1A1A']

const FONT_SIZES = {
  small:  { title: 28, subtitle: 14 },
  medium: { title: 42, subtitle: 20 },
  large:  { title: 58, subtitle: 24 },
}

function renderPoster(canvas: HTMLCanvasElement, s: PosterState) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height
  const tSize = FONT_SIZES[s.fontSize].title
  const sSize = FONT_SIZES[s.fontSize].subtitle
  const padding = 40

  let x: number
  let textAlign: CanvasTextAlign
  if (s.alignment === 'center') { x = W / 2; textAlign = 'center' }
  else if (s.alignment === 'right') { x = W - padding; textAlign = 'right' }
  else { x = padding; textAlign = 'left' }

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = s.bgColour
  ctx.fillRect(0, 0, W, H)

  // Decorative accent bar (left side)
  ctx.fillStyle = '#C8960C'
  ctx.fillRect(0, 0, 8, H)

  const maxW = W - padding * 2 - 8
  const titleY = Math.round(H * 0.3)
  const subtitleY = titleY + tSize + 12

  ctx.textAlign = textAlign

  if (s.title) {
    ctx.fillStyle = s.titleColour
    ctx.font = `bold ${tSize}px Inter, sans-serif`
    ctx.fillText(s.title, x, titleY, maxW)
  }

  if (s.subtitle) {
    ctx.fillStyle = '#9ca3af'
    ctx.font = `${sSize}px Inter, sans-serif`
    ctx.fillText(s.subtitle, x, subtitleY, maxW)
  }

  if (!s.title && !s.subtitle) {
    ctx.fillStyle = '#374151'
    ctx.font = '16px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Add a title below to begin your poster', padding, titleY)
  }
}

const BTN = 'text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium'
const BTN_ON = 'bg-primary text-white border-primary'
const BTN_OFF = 'border-border text-text-secondary hover:border-primary/40'

export default function PosterSurface({ value, onChange, canvasRef, showDrawLayer }: Props) {
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const drawModeRef = useRef(false)

  const set = (patch: Partial<PosterState>) => onChange({ ...value, ...patch })

  useEffect(() => {
    if (!canvasRef.current) return
    renderPoster(canvasRef.current, value)
  }, [value, canvasRef])

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e: React.MouseEvent) => {
    if (!drawModeRef.current || !canvasRef.current) return
    drawing.current = true
    lastPos.current = getPos(e, canvasRef.current)
  }

  const draw = (e: React.MouseEvent) => {
    if (!drawing.current || !drawModeRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvasRef.current)
    ctx.beginPath()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { drawing.current = false }

  return (
    <div>
      {/* Text inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-text-secondary text-xs block mb-1">Poster title</label>
          <input
            value={value.title}
            onChange={e => set({ title: e.target.value })}
            placeholder="CREATIVE NIGHT 2025"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-text-secondary text-xs block mb-1">Subtitle or tagline</label>
          <input
            value={value.subtitle}
            onChange={e => set({ subtitle: e.target.value })}
            placeholder="G.S Kigeme-A  7 December"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-start gap-5 flex-wrap mb-4">
        {/* Font size */}
        <div>
          <p className="text-text-secondary text-xs mb-1.5">Title size</p>
          <div className="flex gap-1.5">
            {(['small', 'medium', 'large'] as const).map(sz => (
              <button
                key={sz}
                onClick={() => set({ fontSize: sz })}
                className={`${BTN} ${value.fontSize === sz ? BTN_ON : BTN_OFF}`}
              >
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <p className="text-text-secondary text-xs mb-1.5">Alignment</p>
          <div className="flex gap-1.5">
            {(['left', 'center', 'right'] as const).map(al => (
              <button
                key={al}
                onClick={() => set({ alignment: al })}
                className={`${BTN} ${value.alignment === al ? BTN_ON : BTN_OFF}`}
              >
                {al.charAt(0).toUpperCase() + al.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Background colour */}
        <div>
          <p className="text-text-secondary text-xs mb-1.5">Background</p>
          <div className="flex gap-1.5 items-center">
            {BG_SWATCHES.map(c => (
              <button
                key={c}
                onClick={() => set({ bgColour: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${value.bgColour === c ? 'border-primary scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={value.bgColour}
                onChange={e => set({ bgColour: e.target.value })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-text-muted text-xs">+</span>
            </label>
          </div>
        </div>

        {/* Title colour */}
        <div>
          <p className="text-text-secondary text-xs mb-1.5">Title colour</p>
          <div className="flex gap-1.5 items-center">
            {TITLE_SWATCHES.map(c => (
              <button
                key={c}
                onClick={() => set({ titleColour: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${value.titleColour === c ? 'border-primary scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={value.titleColour}
                onChange={e => set({ titleColour: e.target.value })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-text-muted text-xs">+</span>
            </label>
          </div>
        </div>

        {/* Draw layer toggle (optional) */}
        {showDrawLayer && (
          <div>
            <p className="text-text-secondary text-xs mb-1.5">Draw layer</p>
            <button
              onClick={() => {
                drawModeRef.current = !drawModeRef.current
                // Re-render to show cursor change — trigger via a no-op state change trick
                const canvas = canvasRef.current
                if (canvas) canvas.style.cursor = drawModeRef.current ? 'crosshair' : 'default'
              }}
              className={`${BTN} ${BTN_OFF}`}
            >
              Toggle freehand
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={700}
        height={420}
        className="w-full border border-border rounded-xl"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
    </div>
  )
}
