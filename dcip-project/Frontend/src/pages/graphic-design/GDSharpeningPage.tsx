import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, type DesignElement } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import { useGDEngagement } from '../../hooks/useCanvasEngagement'

const QUICK_REF = [
  {
    heading: 'Text Alignment',
    items: [
      { name: 'Left', desc: 'Formal and editorial. Good for information-heavy designs.' },
      { name: 'Centre', desc: 'Symmetrical and ceremonial. Good for events and invitations.' },
      { name: 'Right', desc: 'Dynamic and modern. Use deliberately, not by default.' },
    ],
  },
  {
    heading: 'Rule of Thirds Reminder',
    items: [
      { name: 'Grid', desc: 'Divide your poster into a 3 by 3 grid.' },
      { name: 'Intersections', desc: 'Place your most important element at or near a grid intersection, not dead centre.' },
      { name: 'Whitespace', desc: 'Leave at least one third of the space empty. It gives the title room to breathe.' },
    ],
  },
  {
    heading: 'Contrast Reminder',
    items: [
      { name: 'Dark on light', desc: 'Dark text on a light background is always readable.' },
      { name: 'Light on dark', desc: 'Light text on a dark background works when contrast is high.' },
      { name: 'Avoid similar tones', desc: 'Grey text on a dark grey background fails the contrast test.' },
    ],
  },
]

export default function GDSharpeningPage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading, markStageVisited } = useGDDemonstrationProgress()
  const [elements, setElements] = useState<DesignElement[]>(DEFAULT_ELEMENTS)
  const { recordInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'sharpening')

  const handleContinue = () => {
    computeAndSave(elements).catch(() => {})
    navigate('/graphic-design/production')
  }

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level3DemonstrationPassed) {
      navigate('/graphic-design/level-3/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 3 demonstration first.' },
      })
      return
    }
    markStageVisited('gd-sharpening')
  }, [loading, progress.level3DemonstrationPassed, navigate, markStageVisited])

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
          <span className="text-text-primary">Sharpening</span>
        </div>
        <button
          onClick={handleContinue}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready. Continue to Production
        </button>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        <CanvasInstructionPanel>
          {lockedMessage && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-xs">
                  {lockedMessage}
                </div>
              )}
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Sharpening</p>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                Practice freely. Use everything you have learned. There is no pass or fail here.
              </p>
              <div className="space-y-5">
                {QUICK_REF.map(section => (
                  <div key={section.heading}>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{section.heading}</p>
                    <div className="space-y-1">
                      {section.items.map(item => (
                        <div key={item.name}>
                          <span className="text-text-primary text-sm font-medium">{item.name}: </span>
                          <span className="text-text-secondary text-sm">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
