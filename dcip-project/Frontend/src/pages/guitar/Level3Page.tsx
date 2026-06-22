import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import { Level3Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel3Page() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = useGuitarDemonstrationProgress()
  const { markComplete } = useGuitarProgress()

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level2DemonstrationPassed) {
      navigate('/guitar/level-2/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 2 demonstration first.' },
      })
    }
  }, [isPreviewMode, loading, progress.level2DemonstrationPassed, navigate])

  if (!isPreviewMode && (loading || !progress.level2DemonstrationPassed)) return null

  return (
    <Level3Screen
      onComplete={() => markComplete('guitar-level-3')}
      nextPath="/guitar/level-3/practise"
    />
  )
}
