import ChordLevelScreen from '../../components/piano/ChordLevelScreen'

const LEVEL2_CHORDS = [
  { symbol: 'Am', root: 'A', type: 'minor' as const },
  { symbol: 'Dm', root: 'D', type: 'minor' as const },
  { symbol: 'Em', root: 'E', type: 'minor' as const },
]

export default function Level2Page() {
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
