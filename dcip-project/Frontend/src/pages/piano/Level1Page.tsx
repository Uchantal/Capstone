import ChordLevelScreen from '../../components/piano/ChordLevelScreen'

const LEVEL1_CHORDS = [
  { symbol: 'C',  root: 'C', type: 'major' as const },
  { symbol: 'F',  root: 'F', type: 'major' as const },
  { symbol: 'G',  root: 'G', type: 'major' as const },
  { symbol: 'D',  root: 'D', type: 'major' as const },
  { symbol: 'E',  root: 'E', type: 'major' as const },
]

export default function Level1Page() {
  return (
    <ChordLevelScreen
      levelNumber={1}
      totalLevels={3}
      levelTitle="Level 1: Major Chords"
      description="Play each major chord by pressing its three notes at the same time and holding them for a moment. The keyboard highlights which keys to press."
      chords={LEVEL1_CHORDS}
      nextPath="/piano/level-2"
    />
  )
}
