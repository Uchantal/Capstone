import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS, type DesignElement } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import CanvasInstructionPanel from '../../components/canvas/CanvasInstructionPanel'
import DcipLogoLink from '../../components/DcipLogoLink'
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
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { user } = useAuth()
  const draftKey = `${user?.id ?? 'anon'}:gd:sharpening`

  const _draftInit = useRef<{ elements: DesignElement[]; bgColor: string } | null>(null)
  const _draftChecked = useRef(false)
  if (!_draftChecked.current) {
    _draftChecked.current = true
    try { const r = localStorage.getItem(`dcip:draft:${draftKey}`); if (r) _draftInit.current = JSON.parse(r) } catch { /* ignore */ }
  }

  const { loading, markStageVisited } = useGDDemonstrationProgress()
  const [elements, setElements] = useState<DesignElement[]>(() => _draftInit.current?.elements ?? DEFAULT_ELEMENTS)
  const [bgColor, setBgColor] = useState<string>(() => _draftInit.current?.bgColor ?? DEFAULT_BG_COLOR)
  const saveDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function saveDraft(els: DesignElement[], bg: string) {
    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current)
    saveDraftTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(`dcip:draft:${draftKey}`, JSON.stringify({ elements: els, bgColor: bg })) } catch { /* ignore */ }
    }, 1500)
  }
  const { recordInteraction, recordElementChange, computeAndSave } =
    useGDEngagement('graphic-design', 'sharpening')

  const handleContinue = () => {
    computeAndSave(elements).catch(() => {})
    navigate('/graphic-design/production')
  }

  useEffect(() => {
    if (loading) return
    markStageVisited('gd-sharpening')
  }, [loading, markStageVisited])

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span>
          <span className="text-text-primary">Sharpening</span>
        </div>
        <button
          onClick={handleContinue}
          className="ml-auto bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors text-xs flex-shrink-0"
        >
          <span className="hidden sm:inline">Continue to Production</span>
          <span className="sm:hidden">Continue</span>
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
          defaultElements={_draftInit.current?.elements ?? DEFAULT_ELEMENTS}
          defaultBgColor={_draftInit.current?.bgColor ?? DEFAULT_BG_COLOR}
          onChange={(els, bg) => { setElements(els); setBgColor(bg); recordElementChange(els); saveDraft(els, bg) }}
          onInteraction={recordInteraction}
        />
      </div>
    </div>
  )
}
