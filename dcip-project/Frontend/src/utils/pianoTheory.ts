export const CHROMATIC_SCALE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const
export const FLAT_NAMES: Record<string, string> = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }
export const INTERVALS = { HALF_STEP:1, WHOLE_STEP:2, MINOR_THIRD:3, MAJOR_THIRD:4, PERFECT_FIFTH:7 } as const
export type ChordType = 'major' | 'minor'

const TRIAD_FORMULAS: Record<ChordType, number[]> = { major: [0, 4, 7], minor: [0, 3, 7] }

export function buildChord(root: string, type: ChordType, useFlats = false): string[] {
  const rootIdx = CHROMATIC_SCALE.indexOf(root as typeof CHROMATIC_SCALE[number])
  if (rootIdx === -1) return []
  return TRIAD_FORMULAS[type].map(interval => {
    const note = CHROMATIC_SCALE[(rootIdx + interval) % 12]
    return useFlats ? (FLAT_NAMES[note] ?? note) : note
  })
}

export function noteToFrequency(note: string, octave = 4): number {
  const sharpNote = Object.entries(FLAT_NAMES).find(([, flat]) => flat === note)?.[0] ?? note
  const semitone = CHROMATIC_SCALE.indexOf(sharpNote as typeof CHROMATIC_SCALE[number])
  if (semitone === -1) return 440
  return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12)
}

export const ALL_TWELVE_CHORDS: { symbol: string; root: string; type: ChordType; useFlats?: boolean }[] = [
  { symbol: 'A',  root: 'A', type: 'major' },
  { symbol: 'Am', root: 'A', type: 'minor' },
  { symbol: 'C',  root: 'C', type: 'major' },
  { symbol: 'Cm', root: 'C', type: 'minor', useFlats: true },
  { symbol: 'D',  root: 'D', type: 'major' },
  { symbol: 'Dm', root: 'D', type: 'minor' },
  { symbol: 'E',  root: 'E', type: 'major' },
  { symbol: 'Em', root: 'E', type: 'minor' },
  { symbol: 'F',  root: 'F', type: 'major' },
  { symbol: 'Fm', root: 'F', type: 'minor', useFlats: true },
  { symbol: 'G',  root: 'G', type: 'major' },
  { symbol: 'Gm', root: 'G', type: 'minor', useFlats: true },
]

export function checkChordMatch(pressedNotes: string[], expectedNotes: string[]): boolean {
  if (pressedNotes.length !== expectedNotes.length) return false
  const normalize = (n: string) => {
    const flatEntry = Object.entries(FLAT_NAMES).find(([, flat]) => flat === n)
    return flatEntry ? flatEntry[0] : n
  }
  const pressedSet = new Set(pressedNotes.map(normalize))
  const expectedSet = new Set(expectedNotes.map(normalize))
  for (const n of expectedSet) {
    if (!pressedSet.has(n)) return false
  }
  return true
}
