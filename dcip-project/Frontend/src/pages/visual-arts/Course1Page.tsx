import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsProgress } from '../../hooks/useVisualArtsProgress'
import { useReadingEngagement } from '../../hooks/useReadingEngagement'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

const TOOLS = [
  { name: 'Brush',      desc: 'Draw freehand strokes. Adjust the Size slider to change stroke weight.' },
  { name: 'Eraser',     desc: 'Remove drawn content by stroking over it, revealing the background colour underneath.' },
  { name: 'Line',       desc: 'Draw a perfectly straight line by clicking and dragging between two points.' },
  { name: 'Rectangle',  desc: 'Draw a square or rectangle by clicking and dragging. Toggle between Outline and Fill.' },
  { name: 'Ellipse',    desc: 'Draw a circle or oval by clicking and dragging. Toggle between Outline and Fill.' },
  { name: 'Ruler',      desc: 'Measure distances on the canvas. The pixel length appears as you drag, then disappears.' },
  { name: 'Undo',       desc: 'Step back one action (keyboard shortcut: Ctrl+Z). Up to 30 steps of history are stored.' },
  { name: 'Redo',       desc: 'Step forward after an undo (keyboard shortcut: Ctrl+Shift+Z).' },
  { name: 'Background', desc: 'Change the canvas background colour. Your existing drawing is preserved when you do this.' },
  { name: 'Clear',      desc: 'Wipe the entire canvas. A confirmation prompt appears first. Immediately undoable with Undo.' },
]

export default function Course1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const practiceCanvasRef = useRef<HTMLCanvasElement>(null)
  const { markComplete } = useVisualArtsProgress()
  const [lowEngagement, setLowEngagement] = useState(false)
  const { computeAndSave } = useReadingEngagement('visual-arts', 'course1')

  const handleContinue = async () => {
    const score = await computeAndSave()
    const proceed = async () => {
      await markComplete('va-course-1')
      navigate('/visual-arts/course-2')
    }
    if (score < 40) {
      setLowEngagement(true)
      setTimeout(proceed, 3000)
    } else {
      await proceed()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/visual-arts/virtual-canvas')} className="hover:text-text-primary transition-colors">
            Visual Arts
          </button>
          <span>/</span>
          <span>Door To Know Visual Arts</span>
          <span>/</span>
          <span className="text-text-primary">Lines, Shapes, and Tools</span>
        </div>

        <ProgressBar value={1} total={2} label="Course 1 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Lines, Shapes, and Tools</h1>
        <p className="text-text-secondary text-sm mb-8">
          Every drawing begins with a line. Learn the foundations before you build.
        </p>

        {/* Card 1: Line Control */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Line Control</h2>
          <p className="text-text-secondary text-sm mb-3">
            Controlled lines are the foundation of all drawing. The quality of a line, its weight,
            direction, and steadiness, determines whether a shape reads clearly or feels uncertain.
            Before drawing complex subjects, artists spend time practising simple strokes.
          </p>
          <p className="text-text-secondary text-sm mb-5">
            Use the canvas below to draw a few free strokes. Try varying the brush size using the Size
            control. Notice how a heavier line reads differently from a lighter one.
          </p>
          <div className="max-w-lg">
            <VisualArtsModule canvasRef={practiceCanvasRef} step={1} />
          </div>
        </div>

        {/* Card 2: Shapes Are Built From Lines and Curves */}
        <div className="bg-white border border-surface-border rounded-2xl p-4 md:p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">Shapes Are Built From Lines and Curves</h2>
          <p className="text-text-secondary text-sm mb-5">
            Every complex drawing can be broken down into simple shapes. A face becomes an oval with
            circles for eyes. A house becomes a rectangle with a triangle for the roof. This is how
            professional artists start any drawing: by finding the basic shapes first.
          </p>
          <div className="flex items-start gap-10 flex-wrap">
            <div className="flex-shrink-0">
              <svg viewBox="0 0 270 100" className="w-64 h-24" aria-label="Three basic shapes: circle, square, triangle">
                {/* Circle */}
                <circle cx="38" cy="48" r="28" fill="none" stroke="#C8960C" strokeWidth="2" />
                <text x="38" y="90" textAnchor="middle" fontSize="9" fill="#888888">Circle</text>
                {/* Square */}
                <rect x="88" y="20" width="58" height="58" fill="none" stroke="#C8960C" strokeWidth="2" />
                <text x="117" y="90" textAnchor="middle" fontSize="9" fill="#888888">Square</text>
                {/* Triangle */}
                <polygon points="207,20 245,78 169,78" fill="none" stroke="#C8960C" strokeWidth="2" />
                <text x="207" y="90" textAnchor="middle" fontSize="9" fill="#888888">Triangle</text>
              </svg>
            </div>
            <div className="flex-1 min-w-48">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">How basic shapes combine</p>
              <div className="space-y-1.5 text-text-secondary text-sm">
                <p>A house = rectangle body + triangle roof</p>
                <p>A face = oval + small circles for eyes</p>
                <p>A tree = large circle + rectangle trunk</p>
                <p>A car = rectangles + circles for wheels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Tool Reference */}
        <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-8">
          <div className="bg-[#F9F7F4] px-6 py-3 border-b border-surface-border">
            <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Knowing Your Tools</p>
            <p className="text-text-secondary text-xs mt-0.5">A reference for each tool in the canvas toolbar</p>
          </div>
          <div className="divide-y divide-surface-border">
            {TOOLS.map(t => (
              <div key={t.name} className="flex px-6 py-3 gap-4">
                <p className="text-text-primary font-semibold text-sm w-28 flex-shrink-0">{t.name}</p>
                <p className="text-text-secondary text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {lowEngagement && (
            <p className="text-sm text-amber-600">
              Take your time with this content. Your engagement score for this page was low.
            </p>
          )}
          <button
            onClick={handleContinue}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Continue to Colour and Light
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
