import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import { Level2Screen } from '../../components/guitar/GuitarLevelScreen'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

export default function GuitarLevel2Page() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = useGuitarDemonstrationProgress()
  const { markComplete } = useGuitarProgress()

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level1DemonstrationPassed) {
      navigate('/guitar/level-1/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 1 demonstration first.' },
      })
    }
  }, [isPreviewMode, loading, progress.level1DemonstrationPassed, navigate])

  if (!isPreviewMode && (loading || !progress.level1DemonstrationPassed)) return null

  return (
    <Level2Screen
      onComplete={() => markComplete('guitar-level-2')}
      nextPath="/guitar/level-2/practise"
    />
  )
}
