import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import DesignCanvas, { DEFAULT_BG_COLOR, DEFAULT_ELEMENTS } from '../../components/graphic-design/PosterSurface'
import { useGDDemonstrationProgress } from '../../hooks/useGDDemonstrationProgress'
import Footer from '../../components/Footer'

const MINIMUM_INTERACTIONS = 8

export default function GDLevel2PractisePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage

  const { progress, loading, markStageVisited } = useGDDemonstrationProgress()
  const interactionCount = useRef(0)
  const [thresholdMet, setThresholdMet] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('gd-level-2')) {
      navigate('/graphic-design/level-2', {
        replace: true,
        state: { lockedMessage: 'Complete Level 2 first.' },
      })
      return
    }
    markStageVisited('gd-level-2-practise')
  }, [loading, progress.completedStages, navigate, markStageVisited])

  function recordInteraction() {
    if (thresholdMet) return
    interactionCount.current += 1
    if (interactionCount.current >= MINIMUM_INTERACTIONS) setThresholdMet(true)
  }

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

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/graphic-design/virtual-studio')} className="hover:text-text-primary transition-colors">
            Graphic Design
          </button>
          <span>/</span>
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 2 Practice</p>
          <h1 className="text-text-primary font-bold text-xl mb-3">Practise Colour and Contrast</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Practise changing the background and title colours until you find a combination with strong contrast.
            Try different pairings and notice how the mood shifts. There is no pass or fail here.
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <DesignCanvas
            defaultElements={DEFAULT_ELEMENTS}
            defaultBgColor={DEFAULT_BG_COLOR}
            onChange={() => {}}
            onInteraction={recordInteraction}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/graphic-design/level-2/demonstrate')}
            disabled={!thresholdMet}
            className="bg-secondary text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
