import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

const TOOL_QUICK_REF = [
  { name: 'Brush',       desc: 'Freehand strokes, variable size.' },
  { name: 'Eraser',      desc: 'Remove content, reveals background.' },
  { name: 'Line',        desc: 'Straight line by click and drag.' },
  { name: 'Rectangle',   desc: 'Square or rectangle, Outline or Fill.' },
  { name: 'Ellipse',     desc: 'Circle or oval, Outline or Fill.' },
  { name: 'Ruler',       desc: 'Pixel-distance guide, disappears on release.' },
  { name: 'Undo / Redo', desc: 'Ctrl+Z / Ctrl+Shift+Z, up to 30 steps.' },
  { name: 'Background',  desc: 'Change canvas background without affecting drawing.' },
  { name: 'Clear',       desc: 'Wipe canvas with confirmation. Immediately undoable.' },
]

const SHADING_ZONES = [
  { name: 'Highlight',        desc: 'Brightest point, directly facing the light source.' },
  { name: 'Midtone',          desc: 'General surface tone where light falls at an angle.' },
  { name: 'Core Shadow',      desc: 'Darkest band where the surface curves away from light.' },
  { name: 'Reflected Light',  desc: 'Soft lighter edge caused by light bouncing off nearby surfaces.' },
  { name: 'Cast Shadow',      desc: 'Shadow the object throws onto the surface below it.' },
]

export default function SharpeningPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  const { recordInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'sharpening')

  const handleContinue = () => {
    computeAndSave().catch(() => {})
    navigate('/visual-arts/production')
  }

  useEffect(() => {
    if (loading) return
    markStageVisited('va-sharpening')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3 space-y-4">
      {lockedMessage && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-2.5 py-2 text-accent text-xs">
          {lockedMessage}
        </div>
      )}

      <div>
        <p className="text-text-muted text-[9px] uppercase tracking-wide mb-2 font-medium">Tool Reference</p>
        <div className="space-y-1.5">
          {TOOL_QUICK_REF.map(t => (
            <div key={t.name}>
              <p className="text-text-primary font-semibold text-[10px]">{t.name}</p>
              <p className="text-text-secondary text-[10px] leading-snug">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-text-muted text-[9px] uppercase tracking-wide mb-0.5 font-medium">Five Shading Zones</p>
        <p className="text-text-secondary text-[10px] mb-2">From Course 2: Colour and Light</p>
        <div className="space-y-1.5">
          {SHADING_ZONES.map((z, i) => (
            <div key={z.name} className="flex gap-1.5">
              <span className="text-text-muted text-[10px] w-3 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="text-text-primary font-semibold text-[10px]">{z.name}</p>
                <p className="text-text-secondary text-[10px] leading-snug">{z.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span className="text-text-primary">Sharpening Myself</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready. Continue to Production
        </button>
      </div>

      <VisualArtsModule
        canvasRef={canvasRef}
        step={5}
        onInteraction={recordInteraction}
        onColourUsed={recordColour}
        onToolChange={recordTool}
        sidebarFooter={sidebarFooter}
      />
    </div>
  )
}
