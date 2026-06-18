import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { noteAt } from '../../components/guitar/GuitarLevelScreen'
import { saveProductionResult } from '../../services/api'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'

const TOTAL_PROMPTS = 8

interface NotePrompt { type: 'note'; label: string; note: string }
interface ChordPrompt { type: 'chord'; label: string; chordId: string }
type Prompt = NotePrompt | ChordPrompt

const ALL_PROMPTS: Prompt[] = [
  { type: 'note',  label: 'Play any E note',  note: 'E' },
  { type: 'chord', label: 'Play the Em chord', chordId: 'Em' },
  { type: 'note',  label: 'Play any C note',  note: 'C' },
  { type: 'chord', label: 'Play the G chord',  chordId: 'G' },
  { type: 'note',  label: 'Play any D note',  note: 'D' },
  { type: 'chord', label: 'Play the Am chord', chordId: 'Am' },
  { type: 'note',  label: 'Play any B note',  note: 'B' },
  { type: 'chord', label: 'Play the C chord',  chordId: 'C' },
]

interface AttemptDetail {
  promptLabel: string
  correct: boolean
  timeTakenMs: number
}

export default function GuitarProductionPage() {
  const navigate = useNavigate()
  const { completedStages, loading: progressLoading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (progressLoading) return
    if (!completedStages.includes('guitar-sharpening')) {
      navigate('/guitar/sharpening-myself', {
        replace: true,
        state: { lockedMessage: 'Complete Sharpening Myself first.' },
      })
    }
  }, [completedStages, progressLoading, navigate])

  const prompts = useMemo<Prompt[]>(() => [...ALL_PROMPTS].sort(() => Math.random() - 0.5), [])

  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro')
  const [promptIdx, setPromptIdx] = useState(0)
  const [attempts, setAttempts] = useState<AttemptDetail[]>([])
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const promptStartRef = useRef(Date.now())
  const matchedRef = useRef(false)

  useEffect(() => {
    if (phase === 'playing') {
      promptStartRef.current = Date.now()
      matchedRef.current = false
      setFeedback('idle')
    }
  }, [promptIdx, phase])

  const currentPrompt = prompts[promptIdx]

  const advance = useCallback((correct: boolean) => {
    if (matchedRef.current) return
    matchedRef.current = true
    const timeTakenMs = Date.now() - promptStartRef.current

    setFeedback(correct ? 'correct' : 'idle')
    setAttempts(prev => {
      const next = [...prev, { promptLabel: currentPrompt.label, correct, timeTakenMs }]
      setTimeout(() => {
        if (promptIdx + 1 >= TOTAL_PROMPTS) {
          setPhase('results')
        } else {
          setPromptIdx(i => i + 1)
        }
      }, correct ? 600 : 0)
      return next
    })
  }, [currentPrompt, promptIdx])

  const handleNotePlay = useCallback((si: number, fret: number) => {
    if (phase !== 'playing' || matchedRef.current) return
    if (currentPrompt.type === 'note') {
      const played = noteAt(si, fret)
      if (played === currentPrompt.note) {
        advance(true)
      }
    }
  }, [phase, currentPrompt, advance])

  const handleChordPlay = useCallback((chordId: string) => {
    if (phase !== 'playing' || matchedRef.current) return
    if (currentPrompt.type === 'chord') {
      if (chordId === currentPrompt.chordId) {
        advance(true)
      }
    }
  }, [phase, currentPrompt, advance])

  const correctCount = attempts.filter(a => a.correct).length
  const outcome = correctCount >= 6 ? 'demonstrated' : 'needs-more-practice'

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      await saveProductionResult({
        discipline: 'music-guitar',
        totalPrompts: TOTAL_PROMPTS,
        correctCount,
        outcome,
        attemptDetails: attempts.map(a => ({
          chordSymbol: a.promptLabel,
          correct: a.correct,
          timeTakenMs: a.timeTakenMs,
        })),
      })
      await markComplete('guitar-production')
      setSaved(true)
    } catch {
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </nav>
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-16 w-full">
          <h1 className="text-text-primary font-bold text-3xl mb-4">Production</h1>
          <p className="text-text-secondary text-base mb-6 max-w-xl">
            This is your moment to demonstrate what you have learned. You will receive eight prompts, a mix of note-finding and chord tasks, drawn from everything covered in Door To Know Guitar. Play each one correctly to advance. No hints are shown.
          </p>
          <p className="text-text-secondary text-sm mb-10">
            For note prompts, any valid position of that note on the fretboard is accepted. For chord prompts, use the chord library.
          </p>
          <button
            onClick={() => setPhase('playing')}
            className="bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:bg-primary-dark transition-colors text-base"
          >
            Begin
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Exit
          </button>
        </nav>

        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10 w-full">
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
              {outcome === 'demonstrated' ? 'Demonstrated' : 'Needs More Practice'}
            </p>
            <p className="text-text-secondary text-xs mt-2">
              {outcome === 'demonstrated'
                ? 'You answered 6 or more correctly. Well done.'
                : 'You got fewer than 6 correct. Go back and practise more, then try again.'}
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
            <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
              <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Attempt Details</p>
            </div>
            <div className="divide-y divide-border">
              {attempts.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-xs w-4">{i + 1}</span>
                    <span className="text-text-primary text-sm font-medium">{a.promptLabel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-text-muted text-xs">{(a.timeTakenMs / 1000).toFixed(1)}s</span>
                    <span className={`text-xs font-semibold ${a.correct ? 'text-secondary' : 'text-accent'}`}>
                      {a.correct ? 'Correct' : 'Moved on'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              onClick={() => navigate('/guitar/sharpening-myself')}
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

  // Playing phase
  const progressPct = (promptIdx / TOTAL_PROMPTS) * 100

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DC</span>
          </div>
          <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
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

      <div className="w-full h-1 bg-gray-200">
        <div className="h-1 bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 w-full">
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">
            {currentPrompt.type === 'note' ? 'Note prompt' : 'Chord prompt'}
          </p>
          <p className="text-text-primary font-bold text-3xl mb-3">{currentPrompt.label}</p>
          {feedback === 'correct' ? (
            <p className="text-secondary font-semibold text-sm">Correct!</p>
          ) : (
            <p className="text-text-muted text-xs">
              {currentPrompt.type === 'note'
                ? 'Play that note at any position on the fretboard.'
                : 'Use the chord library below to strum the chord.'}
            </p>
          )}
        </div>

        <GuitarFretboard
          onNotePlay={handleNotePlay}
          onChordPlay={handleChordPlay}
          showChords={true}
        />
      </div>
    </div>
  )
}
