import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import Footer from '../../components/Footer'

export default function GuitarLevel2PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level1DemonstrationPassed) {
      navigate('/guitar/level-1/demonstrate', { replace: true, state: { lockedMessage: 'Complete the Level 1 demonstration first.' } })
      return
    }
    if (!progress.completedStages.includes('guitar-level-2')) {
      navigate('/guitar/level-2', { replace: true, state: { lockedMessage: 'Complete Level 2 first.' } })
    }
  }, [loading, progress.level1DemonstrationPassed, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.level1DemonstrationPassed && progress.completedStages.includes('guitar-level-2')) {
      markStageVisited('guitar-level-2-practise')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.level1DemonstrationPassed, progress.completedStages])

  const ready = !loading && progress.level1DemonstrationPassed && progress.completedStages.includes('guitar-level-2')
  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 2: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise playing the C note on the A string, the G string, and the B string. Move between them until they feel familiar.
        </p>

        <GuitarFretboard showChords={false} />

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/guitar/level-2/demonstrate')}
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
