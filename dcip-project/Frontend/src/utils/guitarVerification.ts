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

export interface GuitarVerificationResult {
  passed: boolean
  totalNoteEvents: number
  uniqueNoteNames: string[]
  uniqueNoteCount: number
  stringsUsed: string[]
  stringCount: number
  chordShapesUsed: string[]
  chordShapeCount: number
  performanceDurationSeconds: number
  breakdown: BreakdownItem[]
}

export function verifyGuitarPerformance(
  events: NoteEvent[],
  chordsPlayed: string[],
): GuitarVerificationResult {
  const totalNoteEvents = events.length

  const uniqueNoteNames = [...new Set(events.map(e => e.note))]
  const uniqueNoteCount = uniqueNoteNames.length

  const stringsUsed = [...new Set(events.map(e => e.string).filter((s): s is string => Boolean(s)))]
  const stringCount = stringsUsed.length

  const chordShapesUsed = [...new Set(chordsPlayed)]
  const chordShapeCount = chordShapesUsed.length

  const performanceDurationSeconds =
    events.length < 2
      ? 0
      : (Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp))) / 1000

  const metNotes = totalNoteEvents >= 12
  const metUnique = uniqueNoteCount >= 6
  const metStrings = stringCount >= 4
  const metChord = chordShapeCount >= 1
  const metDuration = performanceDurationSeconds >= 20

  const passed = metNotes && metUnique && metStrings && metChord && metDuration

  const breakdown: BreakdownItem[] = [
    {
      label: 'Notes played',
      met: metNotes,
      detail: metNotes
        ? `You played ${totalNoteEvents} individual notes.`
        : `You played ${totalNoteEvents} note${totalNoteEvents === 1 ? '' : 's'}. Play at least 12 notes across the fretboard.`,
    },
    {
      label: 'Note variety',
      met: metUnique,
      detail: metUnique
        ? `You used ${uniqueNoteCount} different notes: ${uniqueNoteNames.join(', ')}.`
        : uniqueNoteNames.length > 0
        ? `You used ${uniqueNoteCount} different note${uniqueNoteCount === 1 ? '' : 's'}: ${uniqueNoteNames.join(', ')}. Use at least 6 different notes.`
        : 'No notes were recorded. Play notes across the fretboard.',
    },
    {
      label: 'Strings explored',
      met: metStrings,
      detail: metStrings
        ? `You played on ${stringCount} strings: ${stringsUsed.join(', ')}.`
        : stringsUsed.length > 0
        ? `You played on ${stringCount} string${stringCount === 1 ? '' : 's'}: ${stringsUsed.join(', ')}. Move across at least 4 strings.`
        : 'No string data recorded. Play notes on different strings.',
    },
    {
      label: 'Chord used',
      met: metChord,
      detail: metChord
        ? `You used ${chordShapeCount > 1 ? 'chords' : 'a chord'}: ${chordShapesUsed.join(', ')}.`
        : 'No chord was played. Use the chord library to strum at least one chord.',
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
    stringsUsed,
    stringCount,
    chordShapesUsed,
    chordShapeCount,
    performanceDurationSeconds,
    breakdown,
  }
}
