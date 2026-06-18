import ChordLevelScreen from '../../components/piano/ChordLevelScreen'

const LEVEL3_CHORDS = [
  { symbol: 'Cm', root: 'C', type: 'minor' as const, useFlats: true },
  { symbol: 'Fm', root: 'F', type: 'minor' as const, useFlats: true },
  { symbol: 'Gm', root: 'G', type: 'minor' as const, useFlats: true },
  { symbol: 'A',  root: 'A', type: 'major' as const },
  { symbol: 'D',  root: 'D', type: 'major' as const },
  { symbol: 'E',  root: 'E', type: 'major' as const },
]

export default function Level3Page() {
  return (
    <ChordLevelScreen
      levelNumber={3}
      totalLevels={3}
      levelTitle="Level 3: Chords with Black Keys"
      description="These chords include black keys as part of the chord. Use the highlighted keys to guide you. Take your time finding the right finger positions."
      chords={LEVEL3_CHORDS}
      nextPath="/piano/sharpening-myself"
    />
  )
}
