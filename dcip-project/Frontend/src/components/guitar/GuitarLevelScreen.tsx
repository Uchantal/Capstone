import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard from './GuitarFretboard'

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const OPEN_NOTES = ['E', 'B', 'G', 'D', 'A', 'E']

export function noteAt(stringIdx: number, fret: number): string {
  const openIdx = CHROMATIC.indexOf(OPEN_NOTES[stringIdx])
  return CHROMATIC[(openIdx + fret) % 12]
}

// ─── Level 1: find E positions ────────────────────────────────────────────────

interface Level1Props {
  onComplete: () => void
  nextPath: string
}

const E_POSITIONS = [
  { stringIdx: 0, fret: 0 },
  { stringIdx: 0, fret: 12 },
  { stringIdx: 1, fret: 5 },
  { stringIdx: 2, fret: 9 },
  { stringIdx: 3, fret: 2 },
  { stringIdx: 4, fret: 7 },
  { stringIdx: 5, fret: 0 },
  { stringIdx: 5, fret: 12 },
]
const REQUIRED_FOUND = 4

export function Level1Screen({ onComplete, nextPath }: Level1Props) {
  const navigate = useNavigate()
  const [foundKeys, setFoundKeys] = useState<Set<string>>(new Set())
  const [lastFeedback, setLastFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [completed, setCompleted] = useState(false)

  const handleNotePlay = (stringIdx: number, fret: number) => {
    if (completed) return
    const note = noteAt(stringIdx, fret)
    const key = `${stringIdx}-${fret}`
    const isEPosition = E_POSITIONS.some(p => p.stringIdx === stringIdx && p.fret === fret)

    if (isEPosition && note === 'E') {
      setLastFeedback('correct')
      setFoundKeys(prev => {
        const next = new Set(prev)
        next.add(key)
        if (next.size >= REQUIRED_FOUND) {
          setTimeout(() => setCompleted(true), 600)
        }
        return next
      })
    } else {
      setLastFeedback('wrong')
    }
    setTimeout(() => setLastFeedback('idle'), 600)
  }

  const feedbackText =
    lastFeedback === 'correct' ? 'E note found!' :
    lastFeedback === 'wrong'   ? 'Not an E. Keep exploring.' :
    `Find and play the note E anywhere on the fretboard. You need ${REQUIRED_FOUND} different positions.`

  const feedbackClass =
    lastFeedback === 'correct' ? 'text-secondary font-semibold' :
    lastFeedback === 'wrong'   ? 'text-accent' :
    'text-text-muted'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Door To Know Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Level 1</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4 overflow-y-auto">
          <div className="mb-3">
            <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1">Level 1 of 3</p>
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-primary rounded-full" style={{ width: '33%' }} />
            </div>
          </div>
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 1: Finding One Note Across the Neck</h1>
          <p className="text-text-secondary text-sm mb-3">The note E appears in eight positions up to fret 12. Find at least four of them.</p>

          <div className="bg-white border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs uppercase tracking-wide">Progress</p>
              <p className="text-text-primary font-bold text-sm">{foundKeys.size} / {REQUIRED_FOUND} found</p>
            </div>
            <div className="flex gap-1.5 mb-3">
              {Array.from({ length: REQUIRED_FOUND }).map((_, i) => (
                <span key={i} className={`flex-1 h-2 rounded-full ${i < foundKeys.size ? 'bg-secondary' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard onNotePlay={handleNotePlay} showChords={false} />
        </div>
      </div>

      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 1 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You found {foundKeys.size} positions of the note E. Well done.
            </p>
            <button
              onClick={() => { onComplete(); navigate(nextPath) }}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Level 2: C on A string (fret 3), G string (fret 5), B string (fret 1) ──

interface Level2Props {
  onComplete: () => void
  nextPath: string
}

const C_TARGETS = [
  { stringIdx: 4, fret: 3, string: 'A string', fretLabel: 'fret 3' },
  { stringIdx: 2, fret: 5, string: 'G string', fretLabel: 'fret 5' },
  { stringIdx: 1, fret: 1, string: 'B string', fretLabel: 'fret 1' },
]

export function Level2Screen({ onComplete, nextPath }: Level2Props) {
  const navigate = useNavigate()
  const [foundKeys, setFoundKeys] = useState<Set<string>>(new Set())
  const [lastFeedback, setLastFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [completed, setCompleted] = useState(false)

  const handleNotePlay = (stringIdx: number, fret: number) => {
    if (completed) return
    const key = `${stringIdx}-${fret}`
    const isTarget = C_TARGETS.some(t => t.stringIdx === stringIdx && t.fret === fret)
    if (isTarget) {
      setLastFeedback('correct')
      setFoundKeys(prev => {
        const next = new Set(prev)
        next.add(key)
        if (next.size >= C_TARGETS.length) {
          setTimeout(() => setCompleted(true), 600)
        }
        return next
      })
    } else {
      setLastFeedback('wrong')
    }
    setTimeout(() => setLastFeedback('idle'), 600)
  }

  const remaining = C_TARGETS.filter(t => !foundKeys.has(`${t.stringIdx}-${t.fret}`))
  const feedbackText =
    lastFeedback === 'correct' ? 'Found it!' :
    lastFeedback === 'wrong'   ? 'That is not one of the three target positions. Check the list.' :
    remaining.length > 0
      ? `Next: play C on the ${remaining[0].string} at ${remaining[0].fretLabel}.`
      : 'All three found!'

  const feedbackClass =
    lastFeedback === 'correct' ? 'text-secondary font-semibold' :
    lastFeedback === 'wrong'   ? 'text-accent' :
    'text-text-muted'

  const highlightPositions = C_TARGETS.map(t => ({
    stringIdx: t.stringIdx,
    fret: t.fret,
    label: foundKeys.has(`${t.stringIdx}-${t.fret}`) ? '' : 'C',
  }))

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Door To Know Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Level 2</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4 overflow-y-auto">
          <div className="mb-3">
            <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1">Level 2 of 3</p>
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-primary rounded-full" style={{ width: '67%' }} />
            </div>
          </div>
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 2: Same Note, Different Strings</h1>
          <p className="text-text-secondary text-sm mb-3">Play the note C on three specific strings. The highlighted positions show you exactly where to find them.</p>

          <div className="bg-white border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs uppercase tracking-wide">Target positions</p>
              <p className="text-text-primary font-bold text-sm">{foundKeys.size} / {C_TARGETS.length} played</p>
            </div>
            <div className="space-y-2 mb-3">
              {C_TARGETS.map(t => {
                const done = foundKeys.has(`${t.stringIdx}-${t.fret}`)
                return (
                  <div key={`${t.stringIdx}-${t.fret}`} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${done ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? 'border-secondary bg-secondary' : 'border-gray-300'}`}>
                      {done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-text-primary text-sm">C on the <span className="font-semibold">{t.string}</span> at <span className="font-semibold">{t.fretLabel}</span></span>
                  </div>
                )
              })}
            </div>
            <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard onNotePlay={handleNotePlay} showChords={false} highlightPositions={highlightPositions} />
        </div>
      </div>

      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 2 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You played C on three different strings. The note exists in many places.
            </p>
            <button
              onClick={() => { onComplete(); navigate(nextPath) }}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Level 3: sequence task — D open, Em chord, D on B string fret 3 ─────────

interface Level3Props {
  onComplete: () => void
  nextPath: string
}

const STEPS_L3 = [
  {
    type: 'note' as const,
    instruction: 'Play the note D on the D string. It is the open D string (no fret held).',
    matchNote: (si: number, fret: number) => si === 3 && fret === 0,
    highlight: [{ stringIdx: 3, fret: 0, label: 'D' }],
  },
  {
    type: 'chord' as const,
    instruction: 'Now play the Em chord using the chord library below.',
    matchChord: (id: string) => id === 'Em',
    highlight: [] as { stringIdx: number; fret: number; label: string }[],
  },
  {
    type: 'note' as const,
    instruction: 'Finally, play the note D again, this time on the B string at fret 3.',
    matchNote: (si: number, fret: number) => si === 1 && fret === 3,
    highlight: [{ stringIdx: 1, fret: 3, label: 'D' }],
  },
]

export function Level3Screen({ onComplete, nextPath }: Level3Props) {
  const navigate = useNavigate()
  const [stepIdx, setStepIdx] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [completed, setCompleted] = useState(false)

  const currentStep = STEPS_L3[stepIdx]

  const advance = () => {
    setLastFeedback('correct')
    setTimeout(() => {
      if (stepIdx + 1 >= STEPS_L3.length) {
        setCompleted(true)
      } else {
        setStepIdx(i => i + 1)
        setLastFeedback('idle')
      }
    }, 700)
  }

  const handleNotePlay = (si: number, fret: number) => {
    if (completed || lastFeedback === 'correct') return
    if (currentStep.type === 'note' && currentStep.matchNote(si, fret)) {
      advance()
    } else if (currentStep.type === 'note') {
      setLastFeedback('wrong')
      setTimeout(() => setLastFeedback('idle'), 600)
    }
  }

  const handleChordPlay = (id: string) => {
    if (completed || lastFeedback === 'correct') return
    if (currentStep.type === 'chord' && currentStep.matchChord(id)) {
      advance()
    } else if (currentStep.type === 'chord') {
      setLastFeedback('wrong')
      setTimeout(() => setLastFeedback('idle'), 600)
    }
  }

  const feedbackText =
    lastFeedback === 'correct' ? 'Correct! Moving to the next step.' :
    lastFeedback === 'wrong'   ? 'Not quite. Follow the instruction above.' :
    currentStep.instruction

  const feedbackClass =
    lastFeedback === 'correct' ? 'text-secondary font-semibold' :
    lastFeedback === 'wrong'   ? 'text-accent' :
    'text-text-secondary'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Door To Know Guitar</span>
          <span>/</span>
          <span className="text-text-primary">Level 3</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4 overflow-y-auto">
          <div className="mb-3">
            <p className="text-text-muted text-[9px] uppercase tracking-wide mb-1">Level 3 of 3</p>
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-primary rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <h1 className="text-text-primary font-bold text-lg mb-1">Level 3: Notes and Chords Together</h1>
          <p className="text-text-secondary text-sm mb-3">Play a three-step sequence combining a single note, a chord, and that note again in a new position.</p>

          <div className="bg-white border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs uppercase tracking-wide">Step {stepIdx + 1} of {STEPS_L3.length}</p>
              <div className="flex gap-1.5">
                {STEPS_L3.map((_, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${i < stepIdx ? 'bg-secondary' : i === stepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
            <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard
            onNotePlay={handleNotePlay}
            onChordPlay={handleChordPlay}
            highlightPositions={currentStep.highlight}
            showChords={true}
          />
        </div>
      </div>

      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 3 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You combined single notes and a chord shape in sequence.
            </p>
            <button
              onClick={() => { onComplete(); navigate(nextPath) }}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
