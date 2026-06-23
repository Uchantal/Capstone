import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, type DesignElement } from '../../components/graphic-design/PosterSurface'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'

const MINIMUM_INTERACTIONS = 8

export default function GDLevel3PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { progress, loading, markStageVisited } = useGDDemonstrationProgress()
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)
  const [elements, setElements] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const { recordInteraction: recordEngInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'level3Practise')

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.completedStages.includes('gd-level-3')) {
      navigate('/graphic-design/level-3', {
        replace: true,
        state: { lockedMessage: 'Complete Level 3 first.' },
      })
      return
    }
    markStageVisited('gd-level-3-practise')
  }, [loading, progress.completedStages, navigate, markStageVisited])

  function recordInteraction() {
    recordEngInteraction()
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

  const handleReady = () => {
    computeAndSave(elements).catch(() => {})
    navigate('/graphic-design/level-3/demonstrate')
  }

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate('/graphic-design/virtual-studio')} className="hover:text-text-primary transition-colors">
            Graphic Design
          </button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={handleReady}
          disabled={!isPreviewMode && !thresholdMet}
          className="bg-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        <CanvasInstructionPanel>
          {lockedMessage && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-xs">
                  {lockedMessage}
                </div>
              )}
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Level 3 Practice</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Practise combining hierarchy, colour, and alignment choices into one complete poster.
                Experiment freely. You will design one final poster in your demonstration.
              </p>
              {!thresholdMet && (
                <p className="text-text-muted text-xs mt-3">
                  Make at least {MINIMUM_INTERACTIONS} design changes to unlock the demonstration.
                </p>
              )}
        </CanvasInstructionPanel>

        <DesignCanvas
          defaultElements={DEFAULT_ELEMENTS}
          defaultBgColor={DEFAULT_BG_COLOR}
          onChange={(els) => { setElements(els); recordElementChange(els) }}
          onInteraction={recordInteraction}
        />
      </div>
    </div>
  )
}
