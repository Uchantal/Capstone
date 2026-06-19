import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import { completeGuitarDemonstration } from '../../services/api'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import Footer from '../../components/Footer'

// STRING_DATA index: 0=e4, 1=B3, 2=G3, 3=D3, 4=A2, 5=E2
const KNOWN_CHORDS = ['Em', 'Am', 'G', 'C'] as const

interface Prompt {
  label: string
  type: 'note' | 'chord'
  matchNote?: (si: number, fret: number) => boolean
  matchChord?: (id: string) => boolean
  highlight: { stringIdx: number; fret: number; label?: string }[]
}

const PROMPTS: Prompt[] = [
  {
    label:     'Play a D note on the D string',
    type:      'note',
    matchNote: (si, fret) => si === 3 && fret === 0,
    highlight: [{ stringIdx: 3, fret: 0, label: 'D' }],
  },
  {
    label:      'Play the Em chord',
    type:       'chord',
    matchChord: (id) => id === 'Em',
    highlight:  [],
  },
  {
    label:     'Play a D note on the B string',
    type:      'note',
    matchNote: (si, fret) => si === 1 && fret === 3,
    highlight: [{ stringIdx: 1, fret: 3, label: 'D' }],
  },
  {
    label:      'Play any chord you know',
    type:       'chord',
    matchChord: (id) => (KNOWN_CHORDS as readonly string[]).includes(id),
    highlight:  [],
  },
]

const TOTAL_PROMPTS    = PROMPTS.length
const REQUIRED_CORRECT = 3

type Phase      = 'testing' | 'results'
type ValidState = 'waiting' | 'correct' | 'wrong'

export default function GuitarLevel3DemonstratePage() {
  const navigate = useNavigate()
  const { progress, loading, reload } = useGuitarDemonstrationProgress()

  useEffect(() => {
    if (loading) return
    if (!progress.level2DemonstrationPassed) {
      navigate('/guitar/level-2/demonstrate', { replace: true, state: { lockedMessage: 'Complete the Level 2 demonstration first.' } })
      return
    }
    if (!progress.completedStages.includes('guitar-level-3-practise')) {
      navigate('/guitar/level-3/practise', { replace: true, state: { lockedMessage: 'Complete the Level 3 practise session first.' } })
    }
  }, [loading, progress.level2DemonstrationPassed, progress.completedStages, navigate])

  const [phase, setPhase]           = useState<Phase>('testing')
  const [promptIdx, setPromptIdx]   = useState(0)
  const [validState, setValidState] = useState<ValidState>('waiting')
  const [passed, setPassed]         = useState(false)

  const correctCountRef = useRef(0)
  const promptIdxRef   = useRef(0)
  const submittedRef   = useRef(false)

  const advance = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) correctCountRef.current += 1
    promptIdxRef.current += 1
    if (promptIdxRef.current >= TOTAL_PROMPTS) {
      if (submittedRef.current) return
      submittedRef.current = true
      const didPass = correctCountRef.current >= REQUIRED_CORRECT
      setPassed(didPass)
      completeGuitarDemonstration(3, didPass).then(() => reload()).catch(() => {})
      setPhase('results')
    } else {
      setPromptIdx(promptIdxRef.current)
      setValidState('waiting')
    }
  }, [reload])

  const handleNotePlay = useCallback((si: number, fret: number) => {
    if (validState !== 'waiting') return
    const prompt = PROMPTS[promptIdxRef.current]
    if (prompt.type === 'note' && prompt.matchNote?.(si, fret)) {
      setValidState('correct')
      setTimeout(() => advance(true), 700)
    } else if (prompt.type === 'note') {
      setValidState('wrong')
      setTimeout(() => setValidState('waiting'), 600)
    }
  }, [validState, advance])

  const handleChordPlay = useCallback((id: string) => {
    if (validState !== 'waiting') return
    const prompt = PROMPTS[promptIdxRef.current]
    if (prompt.type === 'chord' && prompt.matchChord?.(id)) {
      setValidState('correct')
      setTimeout(() => advance(true), 700)
    } else if (prompt.type === 'chord') {
      setValidState('wrong')
      setTimeout(() => setValidState('waiting'), 600)
    }
  }, [validState, advance])

  const handleSkip = () => {
    if (validState === 'correct') return
    advance(false)
  }

  const handleTryAgain = () => {
    correctCountRef.current = 0
    promptIdxRef.current    = 0
    submittedRef.current    = false
    setPromptIdx(0)
    setValidState('waiting')
    setPhase('testing')
  }

  const ready = !loading && progress.level2DemonstrationPassed && progress.completedStages.includes('guitar-level-3-practise')

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-bg-page">
        <TopNav />
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10">
          <h1 className="text-text-primary font-bold text-2xl mb-6">Level 3 Demonstration Result</h1>

          <div className={`border-2 rounded-2xl p-6 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-border bg-white'}`}>
            <p className={`font-bold text-xl mb-2 ${passed ? 'text-[#2D6A4F]' : 'text-accent'}`}>
              {passed ? 'Level 3 Demonstration passed.' : 'Not quite.'}
            </p>
            {passed ? (
              <p className="text-text-secondary text-sm">
                You have earned the Intermediate Guitar badge. Complete Production to reach Advanced.
              </p>
            ) : (
              <p className="text-text-secondary text-sm">
                Go back and practise, then try again.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {passed ? (
              <button
                onClick={() => navigate('/guitar/sharpening-myself')}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Continue to Sharpening Myself
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/guitar/level-3/practise')}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Practise Again
                </button>
                <button
                  onClick={handleTryAgain}
                  className="w-full border border-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Try Demonstration Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentPrompt = PROMPTS[promptIdx]

  const feedbackText =
    validState === 'correct' ? 'Correct. Moving on.' :
    validState === 'wrong'   ? 'Not quite. Follow the instruction above.' :
    currentPrompt.type === 'chord'
      ? 'Use the chord library below to strum the chord.'
      : 'Find the correct position on the fretboard.'

  const feedbackClass =
    validState === 'correct' ? 'text-[#2D6A4F] font-semibold' :
    validState === 'wrong'   ? 'text-accent' :
    'text-text-secondary'

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 3</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3 Demonstration</h1>
        <p className="text-text-secondary text-sm mb-6">
          Get {REQUIRED_CORRECT} of {TOTAL_PROMPTS} correct to pass.
        </p>

        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs uppercase tracking-wide">Prompt {promptIdx + 1} of {TOTAL_PROMPTS}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_PROMPTS }).map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < promptIdx ? 'bg-secondary' : i === promptIdx ? 'bg-primary' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <p className="text-text-primary font-semibold text-base mb-3">{currentPrompt.label}</p>
          <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
        </div>

        <GuitarFretboard
          onNotePlay={handleNotePlay}
          onChordPlay={handleChordPlay}
          highlightPositions={currentPrompt.highlight}
          showChords={true}
        />

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSkip}
            disabled={validState === 'correct'}
            className="border border-border text-text-secondary text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Skip this prompt
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
