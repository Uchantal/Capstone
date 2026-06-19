import LevelDemonstrateScreen from '../../components/piano/LevelDemonstrateScreen'

// 4 chords from the Level 3 pool — 2 minor (with flats), 2 major (with black keys)
const LEVEL3_TEST_CHORDS = [
  { symbol: 'A',  root: 'A', type: 'major' as const },
  { symbol: 'Cm', root: 'C', type: 'minor' as const, useFlats: true },
  { symbol: 'E',  root: 'E', type: 'major' as const },
  { symbol: 'Fm', root: 'F', type: 'minor' as const, useFlats: true },
]

export default function Level3DemonstratePage() {
  return (
    <LevelDemonstrateScreen
      levelNumber={3}
      levelTitle="Level 3: Chords with Black Keys"
      testChords={LEVEL3_TEST_CHORDS}
      requiredCorrect={3}
      badgeLabel="Intermediate"
      nextPath="/piano/sharpening-myself"
      practisePath="/piano/level-3/practise"
      practiseStageId="piano-level-3-practise"
      practiseRedirect="/piano/level-3/practise"
      requiresDemoLevel={2}
      requiresDemoRedirect="/piano/level-2/demonstrate"
    />
  )
}
