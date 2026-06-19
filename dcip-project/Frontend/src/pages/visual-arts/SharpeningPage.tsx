import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import Footer from '../../components/Footer'

const TOOL_QUICK_REF = [
  { name: 'Brush',      desc: 'Freehand strokes, variable size.' },
  { name: 'Eraser',     desc: 'Remove content, reveals background.' },
  { name: 'Line',       desc: 'Straight line by click and drag.' },
  { name: 'Rectangle',  desc: 'Square or rectangle, Outline or Fill.' },
  { name: 'Ellipse',    desc: 'Circle or oval, Outline or Fill.' },
  { name: 'Ruler',      desc: 'Pixel-distance guide, disappears on release.' },
  { name: 'Undo / Redo', desc: 'Ctrl+Z / Ctrl+Shift+Z, up to 30 steps.' },
  { name: 'Background', desc: 'Change canvas background without affecting drawing.' },
  { name: 'Clear',      desc: 'Wipe canvas with confirmation. Immediately undoable.' },
]

const SHADING_ZONES = [
  { name: 'Highlight',       desc: 'Brightest point, directly facing the light source.' },
  { name: 'Midtone',         desc: 'General surface tone where light falls at an angle.' },
  { name: 'Core Shadow',     desc: 'Darkest band where the surface curves away from light.' },
  { name: 'Reflected Light', desc: 'Soft lighter edge caused by light bouncing off nearby surfaces.' },
  { name: 'Cast Shadow',     desc: 'Shadow the object throws onto the surface below it.' },
]

export default function SharpeningPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { progress, loading, markStageVisited } = useVisualArtsDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level3DemonstrationPassed) {
      navigate('/visual-arts/level-3/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 3 demonstration first.' },
      })
    }
  }, [loading, progress.level3DemonstrationPassed, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.level3DemonstrationPassed) {
      markStageVisited('va-sharpening')
    }
  // markStageVisited is stable; run once after gate passes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.level3DemonstrationPassed])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <h1 className="text-text-primary font-bold text-2xl mb-1">Sharpening Myself</h1>
        <p className="text-text-secondary text-sm mb-6">
          Practice freely. Use everything you have learned. There is no pass or fail here. This is where you build confidence.
        </p>

        <div className="mb-6">
          <VisualArtsModule canvasRef={canvasRef} step={5} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
              <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Tool Reference</p>
            </div>
            <div className="divide-y divide-border">
              {TOOL_QUICK_REF.map(t => (
                <div key={t.name} className="flex px-5 py-2.5 gap-3">
                  <p className="text-text-primary font-semibold text-xs w-28 flex-shrink-0">{t.name}</p>
                  <p className="text-text-secondary text-xs">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
              <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Five Shading Zones</p>
              <p className="text-text-secondary text-xs mt-0.5">From Course 2: Colour and Light</p>
            </div>
            <div className="divide-y divide-border">
              {SHADING_ZONES.map((z, i) => (
                <div key={z.name} className="flex items-start px-5 py-3 gap-3">
                  <span className="text-text-muted text-xs w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-text-primary font-semibold text-xs">{z.name}</p>
                    <p className="text-text-secondary text-xs leading-relaxed">{z.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/visual-arts/production')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready. Continue to Production
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
