import { SCALE_NOTES, PITCH_TOLERANCE } from './voicePitch'

export interface PitchEvent {
  timestamp: number
  freq: number | null
}

export interface VoiceVerificationResult {
  passed: boolean
  recordingDurationSeconds: number
  pitchEventsDetected: number
  onPitchEventsCount: number
  uniqueNotesMatched: string[]
  uniqueNoteCount: number
  sustainedNoteDetected: boolean
  breakdown: { label: string; met: boolean; detail: string }[]
}

export function runVoiceVerification(
  events: PitchEvent[],
  startMs: number,
  endMs: number,
): VoiceVerificationResult {
  const recordingDurationSeconds = (endMs - startMs) / 1000

  const activeEvents = events.filter(e => e.freq !== null)
  const pitchEventsDetected = activeEvents.length

  const uniqueNotesSet = new Set<string>()
  let onPitchEventsCount = 0
  for (const ev of activeEvents) {
    for (const note of SCALE_NOTES) {
      if (Math.abs((ev.freq as number) - note.freq) <= PITCH_TOLERANCE) {
        uniqueNotesSet.add(note.label)
        onPitchEventsCount++
        break
      }
    }
  }
  const uniqueNotesMatched = [...uniqueNotesSet]
  const uniqueNoteCount = uniqueNotesMatched.length

  // Sustained note: any single scale note held for 30+ consecutive 100ms events = 3 seconds
  let sustainedNoteDetected = false
  let streak = 0
  let streakNote: string | null = null

  for (const ev of events) {
    if (ev.freq === null) { streak = 0; streakNote = null; continue }
    let matchedNote: string | null = null
    for (const note of SCALE_NOTES) {
      if (Math.abs(ev.freq - note.freq) <= PITCH_TOLERANCE) { matchedNote = note.label; break }
    }
    if (matchedNote !== null && matchedNote === streakNote) {
      streak++
      if (streak >= 30) { sustainedNoteDetected = true; break }
    } else {
      streakNote = matchedNote
      streak = matchedNote ? 1 : 0
    }
  }

  const metDuration = recordingDurationSeconds >= 15
  const metVoice    = pitchEventsDetected >= 30
  const metScale    = uniqueNoteCount >= 3
  const metSustain  = sustainedNoteDetected
  const passed      = metDuration && metVoice && metScale && metSustain

  const breakdown: { label: string; met: boolean; detail: string }[] = [
    {
      label: 'Recording length',
      met: metDuration,
      detail: metDuration
        ? `Your recording was ${recordingDurationSeconds.toFixed(0)} seconds long.`
        : `Your recording was ${recordingDurationSeconds.toFixed(0)} seconds. Record for at least 15 seconds.`,
    },
    {
      label: 'Voice detected',
      met: metVoice,
      detail: metVoice
        ? 'Your voice was detected throughout the recording.'
        : 'Not enough vocal activity was detected. Make sure your microphone is working and sing clearly.',
    },
    {
      label: 'Scale notes matched',
      met: metScale,
      detail: metScale
        ? `You sang ${uniqueNoteCount} scale pitches: ${uniqueNotesMatched.join(', ')}.`
        : uniqueNoteCount > 0
        ? `You matched ${uniqueNoteCount} scale note${uniqueNoteCount === 1 ? '' : 's'}. Sing at least 3 pitches from C D E F G A B C.`
        : 'No scale pitches were matched. Try singing the C major scale.',
    },
    {
      label: 'Sustained note',
      met: metSustain,
      detail: metSustain
        ? 'You held a pitch steady for at least 3 seconds.'
        : 'No pitch was held for 3 continuous seconds. Try holding one note for longer.',
    },
  ]

  return {
    passed,
    recordingDurationSeconds,
    pitchEventsDetected,
    onPitchEventsCount,
    uniqueNotesMatched,
    uniqueNoteCount,
    sustainedNoteDetected,
    breakdown,
  }
}
