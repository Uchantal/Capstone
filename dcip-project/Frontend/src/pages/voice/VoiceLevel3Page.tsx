import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../../components/MainLayout'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, playTone, drawWaveform, type PitchStatus } from '../../utils/voicePitch'

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

// Exercise 1: Sustain A4 for 4 seconds
// Exercise 2: C4 -> G4 movement, 3 repetitions (each rep: 1.5s C then 1.5s G)
// Exercise 3: Vowels A-E-I-O-U on E4, 1.5s each

const VOWELS = ['A', 'E', 'I', 'O', 'U']

type ExercisePhase =
  | 'ex1-playing' | 'ex1-singing'
  | 'ex2-playing-c' | 'ex2-singing-c' | 'ex2-playing-g' | 'ex2-singing-g'
  | 'ex3-playing' | 'ex3-singing'
  | 'complete'

export default function VoiceLevel3Page() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError } = useVoiceMic()

  const [phase,        setPhase]        = useState<ExercisePhase>('ex1-playing')
  const [pitchStatus,  setPitchStatus]  = useState<PitchStatus>('none')
  const [ex2Rep,       setEx2Rep]       = useState(0)
  const [ex3Vowel,     setEx3Vowel]     = useState(0)
  const [started,      setStarted]      = useState(false)

  const rafRef          = useRef<number>(0)
  const phaseRef        = useRef<ExercisePhase>('ex1-playing')
  const onPitchSinceRef = useRef<number | null>(null)
  const ex2RepRef       = useRef(0)
  const ex3VowelRef     = useRef(0)
  const waveformRef     = useRef<HTMLCanvasElement>(null)

  const TARGET_FREQ: Record<string, number> = {
    'ex1-singing': 440.00,
    'ex2-singing-c': 261.63,
    'ex2-singing-g': 392.00,
    'ex3-singing': 329.63,
  }

  const REQUIRED_MS: Record<string, number> = {
    'ex1-singing': 4000,
    'ex2-singing-c': 1500,
    'ex2-singing-g': 1500,
    'ex3-singing': 1500,
  }

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [])

  const transition = useCallback((next: ExercisePhase) => {
    phaseRef.current = next
    setPhase(next)
    onPitchSinceRef.current = null
    setPitchStatus('none')
  }, [])

  const runLoop = useCallback(() => {
    const ph = phaseRef.current
    if (!analyserRef.current) return
    if (ph === 'complete' || ph === 'ex1-playing' || ph === 'ex2-playing-c' || ph === 'ex2-playing-g' || ph === 'ex3-playing') {
      return
    }

    const freq   = detectPitch(analyserRef.current)
    const target = TARGET_FREQ[ph]
    const reqMs  = REQUIRED_MS[ph]
    const status: PitchStatus = target ? getPitchStatus(freq, target) : 'none'
    setPitchStatus(status)
    if (waveformRef.current) drawWaveform(analyserRef.current, waveformRef.current)

    if (status === 'on') {
      if (!onPitchSinceRef.current) onPitchSinceRef.current = Date.now()
      else if (Date.now() - onPitchSinceRef.current >= reqMs) {
        onPitchSinceRef.current = null
        cancelAnimationFrame(rafRef.current)

        if (ph === 'ex1-singing') {
          // Start exercise 2
          playTone(261.63, 1.5)
          transition('ex2-playing-c')
          setTimeout(() => {
            transition('ex2-singing-c')
            rafRef.current = requestAnimationFrame(runLoop)
          }, 1700)
          return
        }

        if (ph === 'ex2-singing-c') {
          playTone(392.00, 1.5)
          transition('ex2-playing-g')
          setTimeout(() => {
            transition('ex2-singing-g')
            rafRef.current = requestAnimationFrame(runLoop)
          }, 1700)
          return
        }

        if (ph === 'ex2-singing-g') {
          const nextRep = ex2RepRef.current + 1
          ex2RepRef.current = nextRep
          setEx2Rep(nextRep)
          if (nextRep < 3) {
            playTone(261.63, 1.5)
            transition('ex2-playing-c')
            setTimeout(() => {
              transition('ex2-singing-c')
              rafRef.current = requestAnimationFrame(runLoop)
            }, 1700)
          } else {
            // Start exercise 3
            playTone(329.63, 1.5)
            transition('ex3-playing')
            setTimeout(() => {
              transition('ex3-singing')
              rafRef.current = requestAnimationFrame(runLoop)
            }, 1700)
          }
          return
        }

        if (ph === 'ex3-singing') {
          const nextVowel = ex3VowelRef.current + 1
          ex3VowelRef.current = nextVowel
          setEx3Vowel(nextVowel)
          if (nextVowel < VOWELS.length) {
            playTone(329.63, 1.5)
            transition('ex3-playing')
            setTimeout(() => {
              transition('ex3-singing')
              rafRef.current = requestAnimationFrame(runLoop)
            }, 1700)
          } else {
            transition('complete')
            markStageVisited('voice-level-3')
          }
          return
        }
        return
      }
    } else {
      onPitchSinceRef.current = null
    }
    rafRef.current = requestAnimationFrame(runLoop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyserRef, transition, markStageVisited])

  const startExercise = useCallback(async () => {
    if (started) return
    setStarted(true)
    const ok = await initMic()
    if (!ok) return
    // Exercise 1: play A4, then sing
    playTone(440.00, 2.0)
    setTimeout(() => {
      transition('ex1-singing')
      rafRef.current = requestAnimationFrame(runLoop)
    }, 2200)
  }, [started, initMic, transition, runLoop])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const exNumber = phase.startsWith('ex1') ? 1 : phase.startsWith('ex2') ? 2 : phase.startsWith('ex3') ? 3 : 0

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">Voice and Singing</button>
          <span>/</span><span>Door To Know Voice</span><span>/</span>
          <span className="text-text-primary">Level 3</span>
        </div>

        <ProgressBar value={3} total={3} label="Level 3 of 3" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3: Advanced Vocal Control</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Three exercises: sustain A4 for 4 seconds, move between C and G three times, then sing vowels on E4.
        </p>

        {/* Exercise overview */}
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map(n => (
            <div key={n} className={`flex-1 rounded-xl border p-3 text-center text-xs font-semibold ${
              n < exNumber ? 'bg-secondary/10 border-secondary text-secondary'
              : n === exNumber && phase !== 'complete' ? 'bg-primary/10 border-primary text-primary'
              : 'bg-white border-surface-border text-text-muted'
            }`}>
              Exercise {n}
            </div>
          ))}
        </div>

        {phase === 'complete' ? (
          <div className="bg-secondary/5 border-2 border-secondary/30 rounded-2xl p-8 text-center mb-6">
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 3 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You sustained A4, moved through C to G three times, and sang vowels on E4. You are ready to practise.
            </p>
            <button
              onClick={() => navigate('/voice/level-3/practise')}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue to Practice
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-surface-border rounded-2xl p-6">
              {/* Exercise 1 */}
              {phase.startsWith('ex1') && (
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Exercise 1 of 3: Sustain</p>
                  <p className="text-text-primary font-semibold mb-1">Sustain A4 for 4 seconds</p>
                  <p className="text-text-secondary text-xs mb-4">Sing on "la" and hold the pitch steady. Hold green for 4 continuous seconds.</p>
                  {phase === 'ex1-singing' && (
                    <PitchIndicator status={pitchStatus} label="A4, 440 Hz, hold for 4 seconds" />
                  )}
                  {phase === 'ex1-playing' && !started && (
                    <button onClick={startExercise}
                      className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm">
                      Start exercises
                    </button>
                  )}
                  {phase === 'ex1-playing' && started && (
                    <p className="text-text-muted text-sm">Reference tone playing, listen to A4...</p>
                  )}
                </div>
              )}

              {/* Exercise 2 */}
              {phase.startsWith('ex2') && (
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-3">
                    Exercise 2 of 3: Movement (repetition {ex2Rep + 1} of 3)
                  </p>
                  <p className="text-text-primary font-semibold mb-1">C to G movement</p>
                  <p className="text-text-secondary text-xs mb-4">
                    Sing C4 then G4 alternating three times. Hold each note for 1.5 seconds.
                  </p>
                  {(phase === 'ex2-playing-c' || phase === 'ex2-playing-g') && (
                    <p className="text-text-muted text-sm">
                      Reference tone, {phase === 'ex2-playing-c' ? 'C4' : 'G4'} playing...
                    </p>
                  )}
                  {(phase === 'ex2-singing-c' || phase === 'ex2-singing-g') && (
                    <PitchIndicator
                      status={pitchStatus}
                      label={`Sing ${phase === 'ex2-singing-c' ? 'C4' : 'G4'}, hold for 1.5 seconds`}
                    />
                  )}
                  <div className="flex gap-2 mt-4">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < ex2Rep ? 'bg-secondary' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise 3 */}
              {phase.startsWith('ex3') && (
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-3">
                    Exercise 3 of 3: Vowels ({ex3Vowel + 1} of 5)
                  </p>
                  <p className="text-text-primary font-semibold mb-1">Vowels on E4</p>
                  <p className="text-text-secondary text-xs mb-4">
                    Sing the vowel "{VOWELS[Math.min(ex3Vowel, VOWELS.length - 1)]}" on E4 and hold for 1.5 seconds.
                  </p>
                  {phase === 'ex3-playing' && (
                    <p className="text-text-muted text-sm">Reference tone, E4 playing...</p>
                  )}
                  {phase === 'ex3-singing' && (
                    <PitchIndicator
                      status={pitchStatus}
                      label={`Sing vowel "${VOWELS[Math.min(ex3Vowel, VOWELS.length - 1)]}" on E4, 1.5 seconds`}
                    />
                  )}
                  <div className="flex gap-1.5 mt-4">
                    {VOWELS.map((v, i) => (
                      <div key={v} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                        i < ex3Vowel ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white border-surface-border text-text-muted'
                      }`}>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-surface-border rounded-2xl p-4">
              <p className="text-text-muted text-xs mb-2">Live audio input</p>
              <canvas ref={waveformRef} width={800} height={60} className="w-full rounded-lg bg-gray-950" />
            </div>

            {micError && (
              <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">{micError}</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
