import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, type DesignElement } from '../../components/graphic-design/PosterSurface'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'

export default function GDLevel2PractisePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { loading, markStageVisited } = useGDDemonstrationProgress()
  const [elements, setElements] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const { recordInteraction: recordEngInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'level2Practise')

  useEffect(() => {
    if (loading) return
    markStageVisited('gd-level-2-practise')
  }, [loading, markStageVisited])

  function recordInteraction() {
    recordEngInteraction()
  }

  const handleReady = () => {
    computeAndSave(elements).catch(() => {})
    navigate('/graphic-design/level-2/demonstrate')
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
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>
        <button
          onClick={handleReady}
          className="bg-secondary text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
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
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Level 2 Practice</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Practise changing the background and title colours until you find a combination with strong contrast.
                Try different pairings and notice how the mood shifts.
              </p>
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
