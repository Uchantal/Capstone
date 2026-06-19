import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import Footer from '../../components/Footer'

export default function GuitarLevel1PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('guitar-level-1')) {
      navigate('/guitar/level-1', { replace: true, state: { lockedMessage: 'Complete Level 1 first.' } })
    }
  }, [loading, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.completedStages.includes('guitar-level-1')) {
      markStageVisited('guitar-level-1-practise')
    }
  // markStageVisited is stable; run once after gate passes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.completedStages])

  if (loading || !progress.completedStages.includes('guitar-level-1')) return null

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 1</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 1: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise finding the E note on different strings. Play it wherever you can find it on the fretboard before moving on.
        </p>

        <GuitarFretboard showChords={false} />

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/guitar/level-1/demonstrate')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
