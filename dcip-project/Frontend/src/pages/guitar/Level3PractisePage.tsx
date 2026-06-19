import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import Footer from '../../components/Footer'

export default function GuitarLevel3PractisePage() {
  const navigate = useNavigate()
  const { progress, loading, markStageVisited } = useGuitarDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level2DemonstrationPassed) {
      navigate('/guitar/level-2/demonstrate', { replace: true, state: { lockedMessage: 'Complete the Level 2 demonstration first.' } })
      return
    }
    if (!progress.completedStages.includes('guitar-level-3')) {
      navigate('/guitar/level-3', { replace: true, state: { lockedMessage: 'Complete Level 3 first.' } })
    }
  }, [loading, progress.level2DemonstrationPassed, progress.completedStages, navigate])

  useEffect(() => {
    if (loading) return
    if (progress.level2DemonstrationPassed && progress.completedStages.includes('guitar-level-3')) {
      markStageVisited('guitar-level-3-practise')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress.level2DemonstrationPassed, progress.completedStages])

  const ready = !loading && progress.level2DemonstrationPassed && progress.completedStages.includes('guitar-level-3')
  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise moving between single notes and chord shapes. Play the D note, then the Em chord, then find D again in a different position.
        </p>

        <GuitarFretboard showChords={true} />

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/guitar/level-3/demonstrate')}
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
