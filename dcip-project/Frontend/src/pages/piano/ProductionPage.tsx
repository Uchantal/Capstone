import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { useChordValidation } from '../../hooks/useChordValidation'
import {
  ALL_TWELVE_CHORDS,
  buildChord,
  CHROMATIC_SCALE,
  FLAT_NAMES,
} from '../../utils/pianoTheory'
import { saveProductionResult } from '../../services/api'

const TOTAL_PROMPTS = 8

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function noteNamesToIds(noteNames: string[]): string[] {
  const normalize = (n: string) => {
    const e = Object.entries(FLAT_NAMES).find(([, flat]) => flat === n)
    return e ? e[0] : n
  }
  const normalized = noteNames.map(normalize)
  let oct = 4
  const result: string[] = []
  let prevIdx = -1
  for (const note of normalized) {
    const idx = CHROMATIC_SCALE.indexOf(note as typeof CHROMATIC_SCALE[number])
    if (idx <= prevIdx && result.length > 0) oct++
    result.push(note + oct)
    prevIdx = idx
  }
  return result
}

interface AttemptDetail {
  chordSymbol: string
  correct: boolean
  timeTakenMs: number
}

export default function ProductionPage() {
  const navigate = useNavigate()
  const prompts = useMemo(() => pickRandom(ALL_TWELVE_CHORDS, TOTAL_PROMPTS), [])

  const [promptIdx, setPromptIdx] = useState(0)
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [phase, setPhase] = useState<'playing' | 'results'>('playing')
  const [attempts, setAttempts] = useState<AttemptDetail[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const promptStartRef = useRef(Date.now())
  const matchedRef = useRef(false)

  useEffect(() => {
    promptStartRef.current = Date.now()
    matchedRef.current = false
  }, [promptIdx])

  const currentPrompt = prompts[promptIdx]
  const expectedNoteNames = buildChord(currentPrompt.root, currentPrompt.type, currentPrompt.useFlats)
  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  const handleMatch = useCallback(() => {
    if (matchedRef.current) return
    matchedRef.current = true
    const timeTakenMs = Date.now() - promptStartRef.current
    const detail: AttemptDetail = { chordSymbol: currentPrompt.symbol, correct: true, timeTakenMs }

    setAttempts(prev => {
      const next = [...prev, detail]
      if (promptIdx + 1 >= TOTAL_PROMPTS) {
        setTimeout(() => setPhase('results'), 500)
      } else {
        setTimeout(() => {
          setPromptIdx(i => i + 1)
          setPressedNotes([])
        }, 600)
      }
      return next
    })
  }, [currentPrompt.symbol, promptIdx])

  useChordValidation(pressedNoteNames, expectedNoteNames, handleMatch)

  const handleCannotPlay = () => {
    if (matchedRef.current) return
    matchedRef.current = true
    const timeTakenMs = Date.now() - promptStartRef.current
    const detail: AttemptDetail = { chordSymbol: currentPrompt.symbol, correct: false, timeTakenMs }
    setAttempts(prev => {
      const next = [...prev, detail]
      if (promptIdx + 1 >= TOTAL_PROMPTS) {
        setPhase('results')
      } else {
        setPromptIdx(i => i + 1)
        setPressedNotes([])
      }
      return next
    })
  }

  const correctCount = attempts.filter(a => a.correct).length
  const outcome = correctCount >= 6 ? 'demonstrated' : 'needs-more-practice'

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      await saveProductionResult({
        discipline: 'music-piano',
        totalPrompts: TOTAL_PROMPTS,
        correctCount,
        outcome,
        attemptDetails: attempts,
      })
      setSaved(true)
    } catch {
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        {/* Minimal nav */}
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Piano</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </nav>

        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10 w-full">
          {/* Score */}
          <div className={`border-2 rounded-2xl p-6 mb-6 text-center ${
            outcome === 'demonstrated'
              ? 'border-secondary/30 bg-secondary/5'
              : 'border-border bg-white'
          }`}>
            <p className="text-text-muted text-sm mb-2">Your result</p>
            <p className="text-text-primary font-bold text-5xl mb-2">
              {correctCount}<span className="text-text-muted text-2xl">/{TOTAL_PROMPTS}</span>
            </p>
            <p className={`font-bold text-base ${outcome === 'demonstrated' ? 'text-secondary' : 'text-text-secondary'}`}>
              {outcome === 'demonstrated' ? 'Demonstrated' : 'Keep Practising'}
            </p>
            <p className="text-text-secondary text-xs mt-2">
              {outcome === 'demonstrated'
                ? 'You identified 6 or more chords correctly. Well done.'
                : 'You got fewer than 6 correct. Go back and practise more, then try again.'}
            </p>
          </div>

          {/* Attempt details */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
            <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
              <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Attempt Details</p>
            </div>
            <div className="divide-y divide-border">
              {attempts.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-xs w-4">{i + 1}</span>
                    <span className="text-text-primary font-bold text-base">{a.chordSymbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-text-muted text-xs">{(a.timeTakenMs / 1000).toFixed(1)}s</span>
                    <span className={`text-xs font-semibold ${a.correct ? 'text-secondary' : 'text-accent'}`}>
                      {a.correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!saved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Results to Portfolio'}
              </button>
            ) : (
              <div className="w-full bg-secondary/10 text-secondary font-semibold py-3 rounded-xl text-center text-sm">
                Results saved
              </div>
            )}
            <button
              onClick={() => navigate('/piano/sharpening-myself')}
              className="w-full border border-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Go back to practice
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full border border-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progressPct = (promptIdx / TOTAL_PROMPTS) * 100

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DC</span>
          </div>
          <span className="text-text-primary font-bold text-sm">DCIP Piano</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-xs">{promptIdx + 1} of {TOTAL_PROMPTS}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200">
        <div className="h-1 bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 w-full">
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Production Test</p>
          <p className="text-text-secondary text-sm mb-4">
            Play the chord shown below. Hold the notes together for a moment. No hints are shown. This is your chance to demonstrate what you have learned.
          </p>
          <div className="flex items-baseline gap-4 mb-3">
            <span className="text-7xl font-bold text-text-primary leading-none">
              {currentPrompt.symbol}
            </span>
            <span className="text-text-muted text-sm">
              {currentPrompt.type === 'major' ? 'major chord' : 'minor chord'}
            </span>
          </div>
          <p className="text-text-muted text-xs">
            Press the three notes of this chord at the same time and hold them.
          </p>
        </div>

        <PianoKeyboard
          onNotesChange={setPressedNotes}
          highlightNotes={noteNamesToIds(expectedNoteNames)}
        />

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleCannotPlay}
            className="text-text-muted text-xs hover:text-text-secondary transition-colors underline underline-offset-2"
          >
            I cannot play this chord
          </button>
        </div>
      </div>
    </div>
  )
}
