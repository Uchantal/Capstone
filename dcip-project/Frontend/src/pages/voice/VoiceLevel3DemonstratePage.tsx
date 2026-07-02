import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import MainLayout from '../../components/MainLayout'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, drawWaveform, DEMO_TOLERANCE, type PitchStatus } from '../../utils/voicePitch'
import api, { completeVoiceDemonstration } from '../../services/api'

// 4 prompts: A4 sustained 3s, C4 1.5s, G4 1.5s, C4 1.5s. 3/4 required to pass.
const PROMPTS = [
  { label: 'A4: sustain', note: 'A', freq: 440.00, requiredMs: 3000, displayLabel: 'Sustain A4 for 3 seconds' },
  { label: 'C4', note: 'C', freq: 261.63, requiredMs: 1500, displayLabel: 'Sing C4 for 1.5 seconds' },
  { label: 'G4', note: 'G', freq: 392.00, requiredMs: 1500, displayLabel: 'Sing G4 for 1.5 seconds' },
  { label: 'C4', note: 'C', freq: 261.63, requiredMs: 1500, displayLabel: 'Return to C4 for 1.5 seconds' },
]
const REQUIRED_CORRECT = 3


export default function VoiceLevel3DemonstratePage() {
  const navigate  = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, reload } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError } = useVoiceMic()

  const [phase,        setPhase]        = useState<'testing' | 'results'>('testing')
  const [promptIdx,    setPromptIdx]    = useState(0)
  const [pitchStatus,  setPitchStatus]  = useState<PitchStatus>('none')
  const [passed,       setPassed]       = useState(false)
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [aiFeedback, setAiFeedback] = useState('')
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false)

  const rafRef          = useRef<number>(0)
  const activeRef       = useRef(false)
  const promptIdxRef    = useRef(0)
  const correctCountRef = useRef(0)
  const submittedRef    = useRef(false)
  const onPitchSinceRef = useRef<number | null>(null)
  const waveformRef     = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => { activeRef.current = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const advance = useCallback(async (correct: boolean) => {
    if (correct) correctCountRef.current++
    const next = promptIdxRef.current + 1
    promptIdxRef.current = next

    if (next >= PROMPTS.length) {
      if (submittedRef.current) return
      submittedRef.current = true
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
      const didPass = correctCountRef.current >= REQUIRED_CORRECT
      if (didPass) {
        if (!isPreviewMode) {
          try { await completeVoiceDemonstration(3, true) } catch { /* best-effort */ }
        }
        reload()
      }
      setFinalCorrect(correctCountRef.current)
      setPassed(didPass)
      setPhase('results')
    } else {
      setPromptIdx(next)
      onPitchSinceRef.current = null
      setPitchStatus('none')
    }
  }, [reload])

  const runLoop = useCallback(() => {
    if (!activeRef.current || !analyserRef.current) return
    const prompt = PROMPTS[promptIdxRef.current]
    const freq   = detectPitch(analyserRef.current)
    const status = getPitchStatus(freq, prompt.freq, DEMO_TOLERANCE)
    setPitchStatus(status)
    if (waveformRef.current) drawWaveform(analyserRef.current, waveformRef.current)

    if (status === 'on') {
      if (!onPitchSinceRef.current) onPitchSinceRef.current = Date.now()
      else if (Date.now() - onPitchSinceRef.current >= prompt.requiredMs) {
        onPitchSinceRef.current = null
        advance(true)
        return
      }
    } else {
      onPitchSinceRef.current = null
    }
    rafRef.current = requestAnimationFrame(runLoop)
  }, [analyserRef, advance])

  const startDemo = useCallback(async () => {
    const ok = await initMic()
    if (!ok) return
    activeRef.current = true
    rafRef.current = requestAnimationFrame(runLoop)
  }, [initMic, runLoop])

  const handleSkip = () => {
    if (!activeRef.current) return
    onPitchSinceRef.current = null
    advance(false)
  }

  const handleTryAgain = () => {
    promptIdxRef.current    = 0
    correctCountRef.current = 0
    submittedRef.current    = false
    onPitchSinceRef.current = null
    setPromptIdx(0)
    setPitchStatus('none')
    setPassed(false)
    setFinalCorrect(0)
    setAiFeedback('')
    setPhase('testing')
    activeRef.current = true
    rafRef.current = requestAnimationFrame(runLoop)
  }

  useEffect(() => {
    if (phase !== 'results') return
    setAiFeedbackLoading(true)
    api.post('/ai/hint', {
      selectedText: `Voice Level 3 Demonstrate: the student completed ${finalCorrect} of ${PROMPTS.length} pitch prompts correctly (A4 sustain, C4, G4, C4 return). ${finalCorrect >= REQUIRED_CORRECT ? 'Passed.' : 'Did not pass.'}`,
      discipline: 'Voice and Singing',
      context: 'Level 3 Demonstrate results',
    })
      .then((res: { data: { hint: string } }) => setAiFeedback(res.data.hint))
      .catch(() => {})
      .finally(() => setAiFeedbackLoading(false))
  }, [phase, finalCorrect])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
            <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
            <span>/</span><span>Level 3 Demonstration</span>
          </div>

          <div className={`border-2 rounded-2xl p-8 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
            {passed ? (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 3 Demonstration</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Demonstration passed</h1>
                <p className="text-text-secondary text-sm mb-3">
                  You completed {finalCorrect} of {PROMPTS.length} prompts correctly. You are ready to sharpen your skills.
                </p>
              </>
            ) : (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 3 Demonstration</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Keep practising</h1>
                <p className="text-text-secondary text-sm mb-3">
                  You completed {finalCorrect} of {PROMPTS.length} prompts correctly. You need {REQUIRED_CORRECT} to pass.
                  Keep practising. Your voice will get there with consistent work.
                </p>
              </>
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
                onClick={() => navigate('/voice/sharpening-myself')}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Continue to Sharpening Myself
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/voice/level-3/practise')}
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
      </MainLayout>
    )
  }

  const currentPrompt = PROMPTS[promptIdx]

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span><span>Level 3 Demonstration</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3: Demonstration</h1>
        <p className="text-text-secondary text-sm mb-6">
          Sing each prompt without a reference tone. You need {REQUIRED_CORRECT} of {PROMPTS.length} correct to pass.
        </p>

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs uppercase tracking-wide">
              Prompt {promptIdx + 1} of {PROMPTS.length}
            </p>
            <div className="flex gap-1.5">
              {PROMPTS.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${
                  i < promptIdx ? 'bg-secondary' : i === promptIdx ? 'bg-primary' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <span className="text-7xl font-bold text-text-primary">{currentPrompt.note}</span>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-1">{currentPrompt.displayLabel}</p>
              <p className="text-text-secondary text-sm">{currentPrompt.label}</p>
            </div>
          </div>

          {!activeRef.current ? (
            <button
              onClick={startDemo}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
            >
              Start microphone
            </button>
          ) : (
            <PitchIndicator status={pitchStatus} label={currentPrompt.displayLabel} />
          )}

          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mt-3">{micError}</p>
          )}
        </div>

        <div className="bg-white border border-surface-border rounded-2xl p-4 mb-5">
          <p className="text-text-muted text-xs mb-2">Live audio input</p>
          <canvas ref={waveformRef} width={800} height={60} className="w-full rounded-lg bg-gray-950" />
        </div>

        {activeRef.current && (
          <div className="flex justify-end">
            <button
              onClick={handleSkip}
              className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Skip this prompt
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
