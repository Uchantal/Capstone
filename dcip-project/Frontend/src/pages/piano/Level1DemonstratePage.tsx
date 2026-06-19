import LevelDemonstrateScreen from '../../components/piano/LevelDemonstrateScreen'

// 3 of the 5 white-key major chords — C, E, G give good coverage across the keyboard
const LEVEL1_TEST_CHORDS = [
  { symbol: 'C', root: 'C', type: 'major' as const },
  { symbol: 'E', root: 'E', type: 'major' as const },
  { symbol: 'G', root: 'G', type: 'major' as const },
]

export default function Level1DemonstratePage() {
  return (
    <LevelDemonstrateScreen
      levelNumber={1}
      levelTitle="Level 1: Major Chords"
      testChords={LEVEL1_TEST_CHORDS}
      requiredCorrect={2}
      badgeLabel="Beginner"
      nextPath="/piano/level-2"
      practisePath="/piano/level-1/practise"
      practiseStageId="piano-level-1-practise"
      practiseRedirect="/piano/level-1/practise"
    />
  )
}
