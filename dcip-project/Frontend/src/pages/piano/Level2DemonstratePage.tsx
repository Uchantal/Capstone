import LevelDemonstrateScreen from '../../components/piano/LevelDemonstrateScreen'

// All 3 white-key minor chords — the full Level 2 pool
const LEVEL2_TEST_CHORDS = [
  { symbol: 'Am', root: 'A', type: 'minor' as const },
  { symbol: 'Dm', root: 'D', type: 'minor' as const },
  { symbol: 'Em', root: 'E', type: 'minor' as const },
]

export default function Level2DemonstratePage() {
  return (
    <LevelDemonstrateScreen
      levelNumber={2}
      levelTitle="Level 2: Minor Chords"
      testChords={LEVEL2_TEST_CHORDS}
      requiredCorrect={2}
      badgeLabel="Intermediate"
      nextPath="/piano/level-3"
      practisePath="/piano/level-2/practise"
      practiseStageId="piano-level-2-practise"
      practiseRedirect="/piano/level-2/practise"
      requiresDemoLevel={1}
      requiresDemoRedirect="/piano/level-1/demonstrate"
    />
  )
}
