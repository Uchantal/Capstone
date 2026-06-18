import { buildChord, ALL_TWELVE_CHORDS } from './pianoTheory'
import { noteToFrequency } from './pianoTheory'

export interface NoteEvent {
  note: string
  octave?: number
  string?: string
  fret?: number
  frequency: number
  timestamp: number
  duration: number
}

export interface BreakdownItem {
  label: string
  met: boolean
  detail: string
}

export interface PianoVerificationResult {
  passed: boolean
  totalNoteEvents: number
  uniqueNoteNames: string[]
  uniqueNoteCount: number
  hasMajorPattern: boolean
  hasMinorPattern: boolean
  performanceDurationSeconds: number
  breakdown: BreakdownItem[]
}

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
}

function toSharp(n: string): string {
  return FLAT_TO_SHARP[n] ?? n
}

function hasChordInWindow(events: NoteEvent[], chordNotes: string[], windowMs: number): boolean {
  const target = new Set(chordNotes.map(toSharp))
  for (let i = 0; i < events.length; i++) {
    const anchor = events[i].timestamp
    const window = new Set<string>()
    for (let j = i; j < events.length; j++) {
      if (events[j].timestamp - anchor > windowMs) break
      window.add(toSharp(events[j].note))
    }
    if ([...target].every(n => window.has(n))) return true
  }
  return false
}

export function verifyPianoPerformance(events: NoteEvent[]): PianoVerificationResult {
  const totalNoteEvents = events.length

  const uniqueNoteNames = [...new Set(events.map(e => toSharp(e.note)))]
  const uniqueNoteCount = uniqueNoteNames.length

  const performanceDurationSeconds =
    events.length < 2
      ? 0
      : (Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp))) / 1000

  const majorChords = ALL_TWELVE_CHORDS
    .filter(c => c.type === 'major')
    .map(c => buildChord(c.root, c.type, c.useFlats))

  const minorChords = ALL_TWELVE_CHORDS
    .filter(c => c.type === 'minor')
    .map(c => buildChord(c.root, c.type, c.useFlats))

  const hasMajorPattern = majorChords.some(chord => hasChordInWindow(events, chord, 600))
  const hasMinorPattern = minorChords.some(chord => hasChordInWindow(events, chord, 600))

  const metNotes = totalNoteEvents >= 16
  const metUnique = uniqueNoteCount >= 8
  const metDuration = performanceDurationSeconds >= 20

  const passed = metNotes && metUnique && hasMajorPattern && hasMinorPattern && metDuration

  const breakdown: BreakdownItem[] = [
    {
      label: 'Notes played',
      met: metNotes,
      detail: metNotes
        ? `You played ${totalNoteEvents} individual notes.`
        : `You played ${totalNoteEvents} note${totalNoteEvents === 1 ? '' : 's'}. Play at least 16 notes for a complete melody.`,
    },
    {
      label: 'Note variety',
      met: metUnique,
      detail: metUnique
        ? `You used ${uniqueNoteCount} different notes: ${uniqueNoteNames.join(', ')}.`
        : uniqueNoteNames.length > 0
        ? `You used ${uniqueNoteCount} different note${uniqueNoteCount === 1 ? '' : 's'}: ${uniqueNoteNames.join(', ')}. Use at least 8 different notes.`
        : 'No notes were recorded. Play across the keyboard using different notes.',
    },
    {
      label: 'Major chord pattern',
      met: hasMajorPattern,
      detail: hasMajorPattern
        ? 'A major chord pattern was found in your melody.'
        : 'No major chord pattern was detected. Play three notes of a major chord together or in quick succession.',
    },
    {
      label: 'Minor chord pattern',
      met: hasMinorPattern,
      detail: hasMinorPattern
        ? 'A minor chord pattern was found in your melody.'
        : 'No minor chord pattern was detected. Play three notes of a minor chord together or in quick succession.',
    },
    {
      label: 'Performance length',
      met: metDuration,
      detail: metDuration
        ? `Your performance was ${performanceDurationSeconds.toFixed(0)} seconds long.`
        : `Your performance was ${performanceDurationSeconds.toFixed(0)} seconds long. Play for at least 20 seconds.`,
    },
  ]

  return {
    passed,
    totalNoteEvents,
    uniqueNoteNames,
    uniqueNoteCount,
    hasMajorPattern,
    hasMinorPattern,
    performanceDurationSeconds,
    breakdown,
  }
}

export { noteToFrequency }
