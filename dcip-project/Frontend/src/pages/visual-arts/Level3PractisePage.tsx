import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'

const MINIMUM_INTERACTIONS = 10

export default function VALevel3PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useVisualArtsDemonstrationProgress()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('va-level-3')) {
      navigate('/visual-arts/level-3', {
        replace: true,
        state: { lockedMessage: 'Complete Level 3 first.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.completedStages.includes('va-level-3')) {
      markStageVisited('va-level-3-practise')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.completedStages])

  function recordInteraction() {
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

  if (loading || !progress.completedStages.includes('va-level-3')) return null

  const sidebarFooter = (
    <div className="border-t border-surface-border pt-3">
      <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1 font-medium">Level 3 Practise</p>
      <p className="text-text-secondary text-xs leading-relaxed">
        Practise combining shapes, colour, and shading into one small scene. It does not need to be perfect. Focus on using everything together.
      </p>
      {!thresholdMet && (
        <p className="text-text-muted text-[10px] mt-2">
          {interactionCount.current}/{MINIMUM_INTERACTIONS} strokes before you can continue.
        </p>
      )}
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/visual-arts/virtual-canvas')}
            className="hover:text-text-primary transition-colors"
          >
            Visual Arts
          </button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={() => navigate('/visual-arts/level-3/demonstrate')}
          disabled={!thresholdMet}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <VisualArtsModule
        canvasRef={canvasRef}
        step={5}
        onInteraction={recordInteraction}
        sidebarFooter={sidebarFooter}
      />
    </div>
  )
}
