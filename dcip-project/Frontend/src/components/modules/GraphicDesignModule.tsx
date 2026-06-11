import { RefObject, useEffect, useRef, useState } from 'react'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>
  step: number
}

const BG_COLOURS = ['#1A1A1A', '#2D6A4F', '#1e3a5f', '#5c1a1a', '#FAFAF7', '#C8960C']

export default function GraphicDesignModule({ canvasRef, step }: Props) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [bgColour, setBgColour] = useState('#1A1A1A')
  const [titleColour, setTitleColour] = useState('#C8960C')
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [drawMode, setDrawMode] = useState(false)
  const [drawColour, setDrawColour] = useState('#FFFFFF')

  const renderPoster = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColour
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // decorative bar
    ctx.fillStyle = '#C8960C'
    ctx.fillRect(0, 0, 8, canvas.height)
    if (title) {
      ctx.fillStyle = titleColour
      ctx.font = 'bold 42px Inter, sans-serif'
      ctx.fillText(title, 32, 80)
    }
    if (subtitle) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '20px Inter, sans-serif'
      ctx.fillText(subtitle, 32, 120)
    }
    if (!title && !subtitle) {
      ctx.fillStyle = '#374151'
      ctx.font = '16px Inter, sans-serif'
      ctx.fillText('Add your title below to start your poster', 32, 80)
    }
  }

  useEffect(() => { renderPoster() }, [title, subtitle, bgColour, titleColour])

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e: React.MouseEvent) => {
    if (!drawMode) return
    drawing.current = true
    lastPos.current = getPos(e, canvasRef.current!)
  }

  const draw = (e: React.MouseEvent) => {
    if (!drawing.current || !drawMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.strokeStyle = drawColour
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  return (
    <div>
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-text-secondary text-xs block mb-1">Poster title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="CREATIVE NIGHT 2025"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-text-secondary text-xs block mb-1">Subtitle / tagline</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="G.S Kigeme-A · 7 December"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-text-secondary text-xs mb-1">Background</p>
          <div className="flex gap-1.5">
            {BG_COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => setBgColour(c)}
                className={`w-6 h-6 rounded-full border-2 ${bgColour === c ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-text-secondary text-xs mb-1">Title colour</p>
          <div className="flex gap-1.5">
            {['#C8960C', '#FFFFFF', '#D62828', '#10B981'].map((c) => (
              <button
                key={c}
                onClick={() => setTitleColour(c)}
                className={`w-6 h-6 rounded-full border-2 ${titleColour === c ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        {step >= 4 && (
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              drawMode ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'
            }`}
          >
            {drawMode ? '✏️ Drawing on' : '✏️ Draw on poster'}
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={420}
        className="w-full border border-border rounded-xl"
        style={{ cursor: drawMode ? 'crosshair' : 'default' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={() => { drawing.current = false }}
        onMouseLeave={() => { drawing.current = false }}
      />
    </div>
  )
}
