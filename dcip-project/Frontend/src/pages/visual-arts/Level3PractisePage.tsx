import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import VisualArtsModule from '../../components/modules/VisualArtsModule'
import { useVisualArtsDemonstrationProgress } from '../../hooks/useVisualArtsDemonstrationProgress'
import Footer from '../../components/Footer'

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

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
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

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise combining shapes, colour, and shading into one small scene. It does not need to be perfect. Focus on using everything together.
        </p>

        <VisualArtsModule canvasRef={canvasRef} step={5} onInteraction={recordInteraction} />

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/visual-arts/level-3/demonstrate')}
            disabled={!thresholdMet}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
