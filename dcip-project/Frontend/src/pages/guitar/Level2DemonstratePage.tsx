import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import GuitarFretboard from '../../components/guitar/GuitarFretboard'
import api, { completeGuitarDemonstration } from '../../services/api'
import { useGuitarDemonstrationProgress } from '../../hooks/useGuitarDemonstrationProgress'
import DcipLogoLink from '../../components/DcipLogoLink'

const PROMPTS = [
  { label: 'Play a C note on the A string', stringIdx: 4, fret: 3, stringName: 'A string' },
  { label: 'Play a C note on the G string', stringIdx: 2, fret: 5, stringName: 'G string' },
  { label: 'Play a C note on the B string', stringIdx: 1, fret: 1, stringName: 'B string' },
] as const

const TOTAL_PROMPTS    = PROMPTS.length
const REQUIRED_CORRECT = 2

type Phase      = 'testing' | 'results'
type ValidState = 'waiting' | 'correct' | 'wrong'

export default function GuitarLevel2DemonstratePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, reload } = useGuitarDemonstrationProgress()

  const [phase, setPhase]           = useState<Phase>('testing')
  const [promptIdx, setPromptIdx]   = useState(0)
  const [validState, setValidState] = useState<ValidState>('waiting')
  const [passed, setPassed]         = useState(false)
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [aiFeedback, setAiFeedback] = useState('')
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false)

  const correctCountRef = useRef(0)
  const promptIdxRef    = useRef(0)
  const submittedRef    = useRef(false)

  const advance = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) correctCountRef.current += 1
    promptIdxRef.current += 1
    if (promptIdxRef.current >= TOTAL_PROMPTS) {
      if (submittedRef.current) return
      submittedRef.current = true
      const didPass = correctCountRef.current >= REQUIRED_CORRECT
      setPassed(didPass)
      setFinalCorrect(correctCountRef.current)
      if (!isPreviewMode) {
        completeGuitarDemonstration(2, didPass).then(() => reload()).catch(() => {})
      }
      setPhase('results')
    } else {
      setPromptIdx(promptIdxRef.current)
      setValidState('waiting')
    }
  }, [reload])

  const handleNotePlay = useCallback((si: number, fret: number) => {
    if (validState !== 'waiting') return
    const target = PROMPTS[promptIdxRef.current]
    if (si === target.stringIdx && fret === target.fret) {
      setValidState('correct')
      setTimeout(() => advance(true), 700)
    } else {
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
    setFinalCorrect(0)
    setAiFeedback('')
    setPhase('testing')
  }

  useEffect(() => {
    if (phase !== 'results') return
    setAiFeedbackLoading(true)
    api.post('/ai/hint', {
      selectedText: `Guitar Level 2 Demonstrate: the student got ${finalCorrect} of ${TOTAL_PROMPTS} C note positions correct. ${finalCorrect >= REQUIRED_CORRECT ? 'Passed.' : 'Did not pass.'}`,
      discipline: 'Guitar',
      context: 'Level 2 Demonstrate results',
    })
      .then((res: { data: { hint: string } }) => setAiFeedback(res.data.hint))
      .catch(() => {})
      .finally(() => setAiFeedbackLoading(false))
  }, [phase, finalCorrect])

  if (!isPreviewMode && loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
          <DcipLogoLink />
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
            <span>/</span>
            <span>Level 2</span>
            <span>/</span>
            <span className="text-text-primary">Demonstrate</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-auto">
          <div className="max-w-md w-full">
            <h1 className="text-text-primary font-bold text-2xl mb-6">Level 2 Demonstration Result</h1>
            <div className={`border-2 rounded-2xl p-6 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
              <p className={`font-bold text-xl mb-2 ${passed ? 'text-[#2D6A4F]' : 'text-accent'}`}>
                {passed ? 'Level 2 Demonstration passed.' : 'Not quite.'}
              </p>
              {passed ? (
                <>
                  <p className="text-text-secondary text-sm mb-1">You got {finalCorrect} of {TOTAL_PROMPTS} prompts correct. You have earned the Intermediate Guitar badge.</p>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-3">
                    Intermediate Guitar Badge
                  </div>
                </>
              ) : (
                <p className="text-text-secondary text-sm mb-3">You got {finalCorrect} of {TOTAL_PROMPTS} prompts correct. You need {REQUIRED_CORRECT} to pass. Go back and practise, then try again.</p>
              )}
              {aiFeedbackLoading && (
                <p className="text-xs text-text-muted italic">AI is preparing your feedback...</p>
              )}
              {aiFeedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">Coach's note</p>
                  <p className="text-text-secondary text-sm leading-relaxed">{aiFeedback}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {passed ? (
                <button
                  onClick={() => navigate('/guitar/level-3')}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Continue to Level 3
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/guitar/level-2/practise')}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                  >
                    Practise Again
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="w-full border border-surface-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Try Demonstration Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentPrompt = PROMPTS[promptIdx]

  const feedbackText =
    validState === 'correct' ? 'Correct. Moving on.' :
    validState === 'wrong'   ? `That is not the right position. Find C on the ${currentPrompt.stringName}.` :
    `Play C on the ${currentPrompt.stringName}.`

  const feedbackClass =
    validState === 'correct' ? 'text-[#2D6A4F] font-semibold' :
    validState === 'wrong'   ? 'text-accent' :
    'text-text-secondary'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button onClick={() => navigate('/guitar/virtual-instrument')} className="hover:text-text-primary transition-colors">Guitar</button>
          <span>/</span>
          <span>Level 2</span>
          <span>/</span>
          <span className="text-text-primary">Demonstrate</span>
        </div>
        <button
          onClick={handleSkip}
          disabled={validState === 'correct'}
          className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Skip this note
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-muted text-xs uppercase tracking-wide">Prompt {promptIdx + 1} of {TOTAL_PROMPTS}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_PROMPTS }).map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < promptIdx ? 'bg-secondary' : i === promptIdx ? 'bg-primary' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <p className="text-text-primary font-semibold text-base mb-2">{currentPrompt.label}</p>
          <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
        </div>

        <div className="flex-1 bg-[#E8E4DC] flex flex-col justify-center p-4 overflow-auto">
          <GuitarFretboard onNotePlay={handleNotePlay} showChords={false} />
        </div>
      </div>
    </div>
  )
}
