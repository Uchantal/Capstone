import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ChordLevelScreen from '../../components/piano/ChordLevelScreen'
import { usePianoProgress } from '../../hooks/usePianoProgress'

const LEVEL1_CHORDS = [
  { symbol: 'C',  root: 'C', type: 'major' as const },
  { symbol: 'F',  root: 'F', type: 'major' as const },
  { symbol: 'G',  root: 'G', type: 'major' as const },
  { symbol: 'D',  root: 'D', type: 'major' as const },
  { symbol: 'E',  root: 'E', type: 'major' as const },
]

export default function Level1Page() {
  const navigate = useNavigate()
  const { progress, loading } = usePianoProgress()

  useEffect(() => {
    if (loading) return
    const hasUnderstanding = progress.completedStages.includes('piano-understanding')
    const hasNotesChords = progress.completedStages.includes('piano-notes-chords')
    if (!hasUnderstanding || !hasNotesChords) {
      navigate('/piano/understanding-the-piano', {
        replace: true,
        state: { lockedMessage: 'Complete both courses before starting Level 1.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  if (loading || !progress.completedStages.includes('piano-understanding') || !progress.completedStages.includes('piano-notes-chords')) {
    return null
  }

  return (
    <ChordLevelScreen
      levelNumber={1}
      totalLevels={3}
      levelTitle="Level 1: Major Chords"
      description="Play each major chord by pressing its three notes at the same time and holding them for a moment. The keyboard highlights which keys to press."
      chords={LEVEL1_CHORDS}
      nextPath="/piano/level-1/practise"
    />
  )
}
