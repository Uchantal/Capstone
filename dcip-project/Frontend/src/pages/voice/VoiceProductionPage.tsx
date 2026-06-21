import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, drawWaveform } from '../../utils/voicePitch'
import { runVoiceVerification, type PitchEvent } from '../../utils/voiceVerification'
import { completeVoiceProduction } from '../../services/api'
import Footer from '../../components/Footer'

type Phase = 'intro' | 'recording' | 'results'

export default function VoiceProductionPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading, reload } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micStreamRef, micError } = useVoiceMic()

  const [phase,        setPhase]        = useState<Phase>('intro')
  const [elapsed,      setElapsed]      = useState(0)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [result,       setResult]       = useState<ReturnType<typeof runVoiceVerification> | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const pitchEventsRef   = useRef<PitchEvent[]>([])
  const startMsRef       = useRef(0)
  const endMsRef         = useRef(0)
  const rafRef           = useRef<number>(0)
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const pitchTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveformRef      = useRef<HTMLCanvasElement>(null)
  const submittedRef     = useRef(false)

  useEffect(() => {
    if (loading) return
    const hasSharpening = progress.completedStages.includes('voice-sharpening')
    if (!progress.level3DemonstrationPassed || !hasSharpening) {
      navigate('/voice/sharpening-myself', {
        replace: true,
        state: { lockedMessage: 'Complete the Sharpening Myself stage first.' },
      })
    }
  }, [loading, progress, navigate])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (timerRef.current)      clearInterval(timerRef.current)
      if (pitchTimerRef.current) clearInterval(pitchTimerRef.current)
      mediaRecorderRef.current?.stop()
    }
  }, [])

  const drawLoop = () => {
    if (!analyserRef.current || !waveformRef.current) return
    drawWaveform(analyserRef.current, waveformRef.current)
    rafRef.current = requestAnimationFrame(drawLoop)
  }

  const startRecording = async () => {
    const ok = await initMic()
    if (!ok || !micStreamRef.current) return

    chunksRef.current     = []
    pitchEventsRef.current = []
    startMsRef.current    = Date.now()
    setElapsed(0)

    const mr = new MediaRecorder(micStreamRef.current)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setRecordingUrl(URL.createObjectURL(blob))
    }
    mr.start(100)
    mediaRecorderRef.current = mr

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000))
    }, 1000)

    pitchTimerRef.current = setInterval(() => {
      const freq = analyserRef.current ? detectPitch(analyserRef.current) : null
      pitchEventsRef.current.push({ timestamp: Date.now(), freq })
    }, 100)

    rafRef.current = requestAnimationFrame(drawLoop)
    setPhase('recording')
  }

  const stopRecording = async () => {
    endMsRef.current = Date.now()
    mediaRecorderRef.current?.stop()
    cancelAnimationFrame(rafRef.current)
    if (timerRef.current)      clearInterval(timerRef.current)
    if (pitchTimerRef.current) clearInterval(pitchTimerRef.current)

    const verification = runVoiceVerification(pitchEventsRef.current, startMsRef.current, endMsRef.current)
    setResult(verification)

    if (!submittedRef.current) {
      submittedRef.current = true
      try { await completeVoiceProduction(verification.passed) } catch { /* best-effort */ }
      if (verification.passed) reload()
    }

    setPhase('results')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'results' && result) {
    return (
      <div className="min-h-screen bg-white">
        <TopNav />
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
            <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">Voice and Singing</button>
            <span>/</span><span className="text-text-primary">Production</span>
          </div>

          <div className={`border-2 rounded-2xl p-8 mb-6 ${result.passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
            {result.passed ? (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Production Session</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Production complete</h1>
                <p className="text-text-secondary text-sm mb-4">
                  Your performance met all four quality criteria. You have earned the Advanced Voice badge.
                </p>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
                  Advanced Voice Badge
                </div>
              </>
            ) : (
              <>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Production Session</p>
                <h1 className="text-text-primary font-bold text-2xl mb-2">Not yet passing</h1>
                <p className="text-text-secondary text-sm">
                  Your recording did not meet all criteria. Review the breakdown below and try again.
                </p>
              </>
            )}
          </div>

          {/* Breakdown table */}
          <div className="bg-white border border-surface-border rounded-2xl p-6 mb-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Performance breakdown</p>
            <div className="space-y-3">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 text-sm font-semibold flex-shrink-0 ${item.met ? 'text-[#2D6A4F]' : 'text-accent'}`}>
                    {item.met ? 'Met' : 'Not met'}
                  </span>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{item.label}</p>
                    <p className="text-text-muted text-xs">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recordingUrl && (
            <div className="bg-white border border-surface-border rounded-2xl p-6 mb-6">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Your recording</p>
              <audio controls src={recordingUrl} className="w-full" />
            </div>
          )}

          <div className="space-y-3">
            {result.passed ? (
              <button
                onClick={() => navigate('/portfolio')}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Go to Portfolio
              </button>
            ) : (
              <button
                onClick={() => {
                  submittedRef.current = false
                  setPhase('intro')
                  setResult(null)
                  setRecordingUrl(null)
                  setElapsed(0)
                }}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Try again
              </button>
            )}
            <button
              onClick={() => navigate('/voice/sharpening-myself')}
              className="w-full border border-surface-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Return to Sharpening Myself
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">Voice and Singing</button>
          <span>/</span><span className="text-text-primary">Production</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Production Session</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          This is your vocal production session. Record yourself singing freely for at least 15 seconds.
          The system will evaluate your pitch accuracy, note variety, and sustained control.
        </p>

        {/* Criteria */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Passing criteria</p>
          <ul className="text-text-secondary text-sm space-y-2">
            <li>Recording at least 15 seconds long</li>
            <li>At least 30 pitch events detected</li>
            <li>At least 3 different notes matched</li>
            <li>At least 3 continuous seconds on a single pitch</li>
          </ul>
        </div>

        {phase === 'intro' && (
          <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
            <p className="text-text-secondary text-sm mb-4">
              When you are ready, press Start to begin recording. Sing freely, use different notes, and hold some phrases steady.
            </p>
            {micError && (
              <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-4">{micError}</p>
            )}
            <button
              onClick={startRecording}
              className="bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-colors"
            >
              Start recording
            </button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent/50 rounded-full animate-pulse" />
                <span className="text-accent font-semibold text-sm">Recording</span>
              </div>
              <span className="text-text-primary font-mono text-lg font-bold">{formatTime(elapsed)}</span>
            </div>

            <div className="mb-4">
              <p className="text-text-muted text-xs mb-2">Live audio input</p>
              <canvas ref={waveformRef} width={800} height={80} className="w-full rounded-lg bg-gray-950" />
            </div>

            {micError && (
              <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-4">{micError}</p>
            )}

            <button
              onClick={stopRecording}
              disabled={elapsed < 15}
              className="bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {elapsed < 15 ? `Stop (available after ${15 - elapsed}s)` : 'Stop and submit'}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
