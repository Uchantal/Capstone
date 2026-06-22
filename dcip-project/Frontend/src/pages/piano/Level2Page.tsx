import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import ChordLevelScreen from '../../components/piano/ChordLevelScreen'
import { usePianoProgress } from '../../hooks/usePianoProgress'

const LEVEL2_CHORDS = [
  { symbol: 'Am', root: 'A', type: 'minor' as const },
  { symbol: 'Dm', root: 'D', type: 'minor' as const },
  { symbol: 'Em', root: 'E', type: 'minor' as const },
]

export default function Level2Page() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading } = usePianoProgress()

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.level1DemonstrationPassed) {
      navigate('/piano/level-1/demonstrate', {
        replace: true,
        state: { lockedMessage: 'Complete the Level 1 demonstration first.' },
      })
    }
  }, [isPreviewMode, loading, progress.level1DemonstrationPassed, navigate])

  if (!isPreviewMode && (loading || !progress.level1DemonstrationPassed)) return null

  return (
    <ChordLevelScreen
      levelNumber={2}
      totalLevels={3}
      levelTitle="Level 2: Minor Chords"
      description="Minor chords have a deeper, darker tone. Notice that these three chords use only white keys. Listen carefully to how they feel different from the major chords."
      chords={LEVEL2_CHORDS}
      nextPath="/piano/level-2/practise"
    />
  )
}
