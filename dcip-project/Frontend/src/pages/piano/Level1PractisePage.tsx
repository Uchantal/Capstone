import LevelPractiseScreen from '../../components/piano/LevelPractiseScreen'

const LEVEL1_PRACTICE_CHORDS = [
  { symbol: 'C', root: 'C', type: 'major' as const },
  { symbol: 'D', root: 'D', type: 'major' as const },
  { symbol: 'E', root: 'E', type: 'major' as const },
  { symbol: 'F', root: 'F', type: 'major' as const },
  { symbol: 'G', root: 'G', type: 'major' as const },
]

export default function Level1PractisePage() {
  return (
    <LevelPractiseScreen
      levelNumber={1}
      levelTitle="Level 1: Major Chords"
      instruction="Practise the white-key major chords from this level. Click a chord to highlight it on the keyboard, then play it. When you feel confident, move to the demonstration."
      chords={LEVEL1_PRACTICE_CHORDS}
      demonstratePath="/piano/level-1/demonstrate"
      stageId="piano-level-1-practise"
    />
  )
}
