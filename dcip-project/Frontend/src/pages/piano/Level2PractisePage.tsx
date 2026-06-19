import LevelPractiseScreen from '../../components/piano/LevelPractiseScreen'

const LEVEL2_PRACTICE_CHORDS = [
  { symbol: 'Am', root: 'A', type: 'minor' as const },
  { symbol: 'Dm', root: 'D', type: 'minor' as const },
  { symbol: 'Em', root: 'E', type: 'minor' as const },
]

export default function Level2PractisePage() {
  return (
    <LevelPractiseScreen
      levelNumber={2}
      levelTitle="Level 2: Minor Chords"
      instruction="Practise the white-key minor chords from this level. Listen carefully to the difference in feel compared to the major chords. When you feel confident, move to the demonstration."
      chords={LEVEL2_PRACTICE_CHORDS}
      demonstratePath="/piano/level-2/demonstrate"
      stageId="piano-level-2-practise"
      requiresDemo={true}
      requiresDemoPath="/piano/level-1/demonstrate"
    />
  )
}
