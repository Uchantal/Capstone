import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, playTone, SCALE_NOTES, type PitchStatus } from '../../utils/voicePitch'
import Footer from '../../components/Footer'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

const A4_FREQ = 440.00

export default function VoiceCourse2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError, micReady } = useVoiceMic()

  const [pitchStatus, setPitchStatus] = useState<PitchStatus>('none')
  const [cardCPassed, setCardCPassed]   = useState(false)
  const [activeTone, setActiveTone]     = useState<string | null>(null)

  const rafRef           = useRef<number>(0)
  const activeRef        = useRef(false)
  const onPitchSinceRef  = useRef<number | null>(null)
  const cardCPassedRef   = useRef(false)

  // Gate: course 1 must be complete
  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('voice-course-1')) {
      navigate('/voice/posture-breath-voice', {
        replace: true,
        state: { lockedMessage: 'Complete Course 1 first.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  useEffect(() => {
    return () => {
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const startPitchDetection = useCallback(async () => {
    const ok = await initMic()
    if (!ok) return
    activeRef.current = true
    const loop = () => {
      if (!activeRef.current || !analyserRef.current) return
      const freq   = detectPitch(analyserRef.current)
      const status = getPitchStatus(freq, A4_FREQ)
      setPitchStatus(status)

      if (!cardCPassedRef.current) {
        if (status === 'on') {
          if (!onPitchSinceRef.current) onPitchSinceRef.current = Date.now()
          else if (Date.now() - onPitchSinceRef.current >= 2000) {
            cardCPassedRef.current = true
            setCardCPassed(true)
            onPitchSinceRef.current = null
          }
        } else {
          onPitchSinceRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [initMic, analyserRef])

  const handlePlayScale = () => {
    SCALE_NOTES.forEach((note, i) => {
      setTimeout(() => {
        playTone(note.freq, 1.5)
        setActiveTone(note.label)
        setTimeout(() => setActiveTone(null), 1500)
      }, i * 2000)
    })
  }

  const handlePlayA4 = () => {
    playTone(A4_FREQ, 3.0)
    setActiveTone('A4')
    setTimeout(() => setActiveTone(null), 3000)
  }

  const handleContinue = async () => {
    await markStageVisited('voice-course-2')
    navigate('/voice/level-1')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">
            Voice and Singing
          </button>
          <span>/</span>
          <span>Door To Know Voice</span>
          <span>/</span>
          <span className="text-text-primary">Pitch and the Musical Scale</span>
        </div>

        <ProgressBar value={2} total={2} label="Course 2 of 2" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Pitch and the Musical Scale</h1>
        <p className="text-text-secondary text-sm mb-8">
          Every note in music has a specific pitch. Singing in tune means matching those pitches with your voice.
        </p>

        {/* Card A: What Is Pitch */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">What Is Pitch</h2>
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            Pitch is how high or low a sound is. Every note in music has a specific pitch, measured in Hz
            (vibrations per second). When you sing in tune, you are matching the exact pitch of a note with
            your voice. A higher Hz value means a higher-sounding note.
          </p>
          {/* Scale diagram */}
          <div className="bg-[#F9F7F4] rounded-xl p-4">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">C Major Scale, low to high</p>
            <div className="relative">
              <div className="w-full h-1 bg-gray-300 rounded-full mb-3" />
              <div className="flex justify-between">
                {SCALE_NOTES.map((n, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-primary font-bold text-sm">{n.note}</span>
                    <span className="text-text-muted text-[9px]">{n.freq.toFixed(0)} Hz</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card B: The C Major Scale for Voice */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <h2 className="text-text-primary font-bold text-base mb-3">The C Major Scale for Voice</h2>
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            Listen to each note of the C major scale. Hum or sing along on the syllable "la". Try to match
            the pitch you hear. The indicator below will show how close your voice is.
          </p>
          <div className="flex gap-2 flex-wrap mb-4">
            {SCALE_NOTES.map(n => (
              <button
                key={n.label}
                onClick={() => { playTone(n.freq, 1.5); setActiveTone(n.label); setTimeout(() => setActiveTone(null), 1500) }}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  activeTone === n.label
                    ? 'bg-purple-600 text-white border-purple-600 scale-95'
                    : 'bg-white border-surface-border text-text-primary hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap mb-4">
            <button
              onClick={handlePlayScale}
              className="border border-purple-400 text-purple-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Play entire scale
            </button>
            {!micReady && (
              <button
                onClick={startPitchDetection}
                className="border border-gray-300 text-text-secondary text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Enable live pitch feedback
              </button>
            )}
          </div>
          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-3">{micError}</p>
          )}
          {micReady && (
            <PitchIndicator status={pitchStatus} label="Live pitch feedback (sing any scale note to test)" />
          )}
        </div>

        {/* Card C: Matching a Pitch */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-bold text-base mb-3">Matching a Pitch</h2>
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            Pitch matching is the foundation of singing in tune. The voice needs to find the note, not guess it.
            Listen to A4 below, then hum or sing the same pitch. Hold it steady until the indicator turns green.
          </p>
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <button
              onClick={handlePlayA4}
              className={`px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                activeTone === 'A4'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-purple-400 text-purple-700 hover:bg-purple-50'
              }`}
            >
              {activeTone === 'A4' ? 'Playing A4...' : 'Play A4 (440 Hz)'}
            </button>
            {!micReady && (
              <button
                onClick={startPitchDetection}
                className="bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-purple-800 transition-colors"
              >
                Start microphone
              </button>
            )}
          </div>
          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-3">{micError}</p>
          )}
          {micReady && (
            <div className="space-y-3">
              <PitchIndicator status={pitchStatus} label="Sing A4 and hold for 2 seconds" />
              {cardCPassed && (
                <div className="bg-secondary/5 border border-secondary/30 rounded-xl px-4 py-3">
                  <p className="text-secondary font-semibold text-sm">You matched the pitch.</p>
                  <p className="text-secondary text-xs mt-0.5">You can now continue to Level 1.</p>
                </div>
              )}
            </div>
          )}
          {!micReady && (
            <p className="text-text-muted text-xs">Start the microphone above to begin pitch matching.</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!cardCPassed}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue to Level 1
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}

