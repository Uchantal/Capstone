import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import { useVAEngagement } from '../../hooks/useCanvasEngagement'

export default function VALevel2PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (loading) return
    markStageVisited('va-level-2-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const { recordInteraction: recordEngInteraction, recordColour, recordTool, computeAndSave } =
    useVAEngagement('visual-arts', 'level2Practise')

  function recordInteraction() {
    recordEngInteraction()
  }

  const handleReady = () => {
    computeAndSave().catch(() => {})
    navigate('/visual-arts/level-2/demonstrate')
  }

  if (!isPreviewMode && loading) return null

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 2 Practise</p>
      <p className="text-text-secondary text-xs leading-relaxed">
        Practise shading a circle. Draw one using the Ellipse tool and add darker tones to one side to show where the light is coming from.
      </p>
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
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={handleReady}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to demonstrate
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
