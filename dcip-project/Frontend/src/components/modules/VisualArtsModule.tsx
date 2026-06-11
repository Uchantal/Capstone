import { RefObject, useEffect, useRef, useState } from 'react'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>
  step: number
}

const COLOURS = [
  '#1A1A1A', '#D62828', '#C8960C', '#2D6A4F',
  '#3B82F6', '#9333EA', '#F97316', '#FFFFFF',
]

export default function VisualArtsModule({ canvasRef, step }: Props) {
  const [colour, setColour] = useState('#1A1A1A')
  const [size, setSize] = useState(6)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FAFAF7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.strokeStyle = colour
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { drawing.current = false }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FAFAF7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex gap-1.5">
          {COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => setColour(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                colour === c ? 'border-text-primary scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="range"
          min={2}
          max={24}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-24 accent-primary"
        />
        <span className="text-text-secondary text-xs">{size}px</span>
        <button
          onClick={clearCanvas}
          className="text-text-secondary text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-gray-50 ml-auto"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={700}
        height={400}
        className="w-full border border-border rounded-xl cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />

      {step >= 3 && (
        <p className="text-text-secondary text-xs mt-3">
          💡 Try adding darker shading by using a darker colour on the same shape
        </p>
      )}
    </div>
  )
}
