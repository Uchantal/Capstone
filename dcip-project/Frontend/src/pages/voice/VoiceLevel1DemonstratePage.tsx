import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import MainLayout from '../../components/MainLayout'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, drawWaveform, DEMO_TOLERANCE, type PitchStatus } from '../../utils/voicePitch'
import api, { completeVoiceDemonstration } from '../../services/api'
import AskAIHint from '../../components/ai/AskAIHint'

const DEMO_NOTES = [
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'E4', note: 'E', freq: 329.63 },
  { label: 'G4', note: 'G', freq: 392.00 },
]
const REQUIRED_CORRECT = 2
const REQUIRED_MS      = 2000


type Phase = 'testing' | 'results'

export default function VoiceLevel1DemonstratePage() {
  const navigate  = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, reload } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError } = useVoiceMic()

  const [phase,        setPhase]        = useState<Phase>('testing')
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
  const runLoopRef      = useRef<() => void>(() => {})

  useEffect(() => {
    return () => { activeRef.current = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const advance = useCallback(async (correct: boolean) => {
    if (correct) correctCountRef.current++
    const next = promptIdxRef.current + 1
    promptIdxRef.current = next

    if (next >= DEMO_NOTES.length) {
      if (submittedRef.current) return
      submittedRef.current = true
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
      const didPass = correctCountRef.current >= REQUIRED_CORRECT
      if (didPass) {
        if (!isPreviewMode) {
          try { await completeVoiceDemonstration(1, true) } catch { /* best-effort */ }
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
      rafRef.current = requestAnimationFrame(runLoopRef.current)
    }
  }, [reload])

  const runLoop = useCallback(() => {
    if (!activeRef.current || !analyserRef.current) return
    const freq   = detectPitch(analyserRef.current)
    const status = getPitchStatus(freq, DEMO_NOTES[promptIdxRef.current].freq, DEMO_TOLERANCE)
    setPitchStatus(status)
    if (waveformRef.current) drawWaveform(analyserRef.current, waveformRef.current)

    if (status === 'on') {
      if (!onPitchSinceRef.current) onPitchSinceRef.current = Date.now()
      else if (Date.now() - onPitchSinceRef.current >= REQUIRED_MS) {
        onPitchSinceRef.current = null
        advance(true)
        return
      }
    } else {
      onPitchSinceRef.current = null
    }
    rafRef.current = requestAnimationFrame(runLoopRef.current)
  }, [analyserRef, advance])

  useEffect(() => { runLoopRef.current = runLoop }, [runLoop])

  const startDemo = useCallback(async () => {
    const ok = await initMic()
    if (!ok) return
    activeRef.current = true
    rafRef.current = requestAnimationFrame(runLoopRef.current)
  }, [initMic])

  const handleSkip = () => {
    if (!activeRef.current) return
    onPitchSinceRef.current = null
    advance(false)
  }

  const handleTryAgain = () => {
    promptIdxRef.current   = 0
    correctCountRef.current = 0
    submittedRef.current   = false
    onPitchSinceRef.current = null
    setPromptIdx(0)
    setPitchStatus('none')
    setPassed(false)
    setFinalCorrect(0)
    setAiFeedback('')
    setPhase('testing')
    activeRef.current = true
    rafRef.current = requestAnimationFrame(runLoopRef.current)
  }

  useEffect(() => {
    if (phase !== 'results') return
    setAiFeedbackLoading(true)
    api.post('/ai/hint', {
      selectedText: `Voice Level 1 Demonstrate: the student matched ${finalCorrect} of ${DEMO_NOTES.length} notes (C4, E4, G4) correctly. ${finalCorrect >= REQUIRED_CORRECT ? 'Passed.' : 'Did not pass.'}`,
      discipline: 'Voice and Singing',
      context: 'Level 1 Demonstrate results',
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
            <span>/</span><span>Level 1 Demonstration</span>
          </div>

          <div className={`border-2 rounded-2xl p-8 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
            {passed ? (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 1 Demonstration</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Demonstration passed</h1>
                <p className="text-text-secondary text-sm mb-2">
                  You matched {finalCorrect} of {DEMO_NOTES.length} notes. You have earned the Beginner Voice badge.
                </p>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-3">
                  Beginner Voice Badge
                </div>
              </>
            ) : (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level 1 Demonstration</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Keep practising</h1>
                <p className="text-text-secondary text-sm mb-3">
                  You matched {finalCorrect} of {DEMO_NOTES.length} notes. You need {REQUIRED_CORRECT} to pass.
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
                onClick={() => navigate('/voice/level-2')}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Continue to Level 2
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/voice/level-1/practise')}
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

  const currentNote = DEMO_NOTES[promptIdx]

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
          <span>/</span><span>Level 1 Demonstration</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 1: Demonstration</h1>
        <p className="text-text-secondary text-sm mb-6">
          Sing each note shown below without hearing it first. Hold steady for 2 seconds to mark it correct.
          You need {REQUIRED_CORRECT} of {DEMO_NOTES.length} correct to pass.
        </p>

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs uppercase tracking-wide">
              Note {promptIdx + 1} of {DEMO_NOTES.length}
            </p>
            <div className="flex gap-1.5">
              {DEMO_NOTES.map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${
                  i < promptIdx ? 'bg-secondary' : i === promptIdx ? 'bg-primary' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <span className="text-7xl font-bold text-text-primary">{currentNote.note}</span>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Sing this note</p>
              <p className="text-text-secondary text-sm">{currentNote.label}</p>
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
            <PitchIndicator status={pitchStatus} label="Hold green for 2 seconds to advance" />
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
              Skip this note
            </button>
          </div>
        )}
      </div>
      <AskAIHint discipline="Voice" context="Voice Level 1 — Demonstrate (hold each of the three notes C4, E4, G4 in tune for 2 seconds each)" />
    </MainLayout>
  )
}
