import LevelPractiseScreen from '../../components/piano/LevelPractiseScreen'

const LEVEL3_PRACTICE_CHORDS = [
  { symbol: 'Cm', root: 'C', type: 'minor' as const, useFlats: true },
  { symbol: 'Fm', root: 'F', type: 'minor' as const, useFlats: true },
  { symbol: 'Gm', root: 'G', type: 'minor' as const, useFlats: true },
  { symbol: 'A',  root: 'A', type: 'major' as const },
  { symbol: 'D',  root: 'D', type: 'major' as const },
  { symbol: 'E',  root: 'E', type: 'major' as const },
]

export default function Level3PractisePage() {
  return (
    <LevelPractiseScreen
      levelNumber={3}
      levelTitle="Level 3: Chords with Black Keys"
      instruction="Practise the chords from this level that include black keys. Take your time finding the right positions. When you feel confident with all six chords, move to the demonstration."
      chords={LEVEL3_PRACTICE_CHORDS}
      demonstratePath="/piano/level-3/demonstrate"
      stageId="piano-level-3-practise"
      requiresDemo={true}
      requiresDemoPath="/piano/level-2/demonstrate"
    />
  )
}
