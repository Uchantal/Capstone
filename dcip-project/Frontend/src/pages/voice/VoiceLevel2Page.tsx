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

const SCALE = [
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'D4', note: 'D', freq: 293.66 },
  { label: 'E4', note: 'E', freq: 329.63 },
  { label: 'F4', note: 'F', freq: 349.23 },
  { label: 'G4', note: 'G', freq: 392.00 },
]

const REQUIRED_MS = 1500

export default function VoiceLevel2Page() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError } = useVoiceMic()

  const [noteIdx,      setNoteIdx]      = useState(0)
  const [phase,        setPhase]        = useState<'playing' | 'singing' | 'complete'>('playing')
  const [pitchStatus,  setPitchStatus]  = useState<PitchStatus>('none')

  const rafRef          = useRef<number>(0)
  const phaseRef        = useRef<'playing' | 'singing' | 'complete'>('playing')
  const noteIdxRef      = useRef(0)
  const onPitchSinceRef = useRef<number | null>(null)
  const waveformRef     = useRef<HTMLCanvasElement>(null)
  const startedRef      = useRef(false)

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [])

  const runLoop = useCallback(() => {
    if (phaseRef.current !== 'singing' || !analyserRef.current) return
    const freq   = detectPitch(analyserRef.current)
    const status = getPitchStatus(freq, SCALE[noteIdxRef.current].freq)
    setPitchStatus(status)
    if (waveformRef.current) drawWaveform(analyserRef.current, waveformRef.current)

    if (status === 'on') {
      if (!onPitchSinceRef.current) onPitchSinceRef.current = Date.now()
      else if (Date.now() - onPitchSinceRef.current >= REQUIRED_MS) {
        onPitchSinceRef.current = null
        cancelAnimationFrame(rafRef.current)
        phaseRef.current = 'playing'

        const next = noteIdxRef.current + 1
        noteIdxRef.current = next
        setNoteIdx(next)

        if (next >= SCALE.length) {
          phaseRef.current = 'complete'
          setPhase('complete')
          markStageVisited('voice-level-2')
          return
        }
        setPhase('playing')
        playTone(SCALE[next].freq, 1.5)
        setTimeout(() => {
          phaseRef.current = 'singing'
          setPhase('singing')
          rafRef.current = requestAnimationFrame(runLoop)
        }, 1700)
        return
      }
    } else {
      onPitchSinceRef.current = null
    }
    rafRef.current = requestAnimationFrame(runLoop)
  }, [analyserRef, markStageVisited])

  const startExercise = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    const ok = await initMic()
    if (!ok) return
    playTone(SCALE[0].freq, 1.5)
    setTimeout(() => {
      phaseRef.current = 'singing'
      setPhase('singing')
      rafRef.current = requestAnimationFrame(runLoop)
    }, 1700)
  }, [initMic, runLoop])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const currentNote = SCALE[Math.min(noteIdx, SCALE.length - 1)]

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
          <span className="text-text-primary">Level 2</span>
        </div>

        <ProgressBar value={2} total={3} label="Level 2 of 3" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 2: Singing the C Major Scale</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Sing each note as it is played. Move through the scale one note at a time.
          Hold each pitch steady for 1.5 seconds to advance automatically.
        </p>

        {/* Scale progress */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {SCALE.map((n, i) => (
            <div key={n.label} className={`px-4 py-2 rounded-full border text-sm font-semibold ${
              i < noteIdx
                ? 'bg-secondary/10 border-secondary text-secondary'
                : i === noteIdx && phase !== 'complete'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-surface-border text-text-muted'
            }`}>
              {n.note}
            </div>
          ))}
        </div>

        {phase === 'complete' ? (
          <div className="bg-secondary/5 border-2 border-secondary/30 rounded-2xl p-8 text-center mb-6">
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 2 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You sang the C major scale from C to G. You are ready to practise and then demonstrate.
            </p>
            <button
              onClick={() => navigate('/voice/level-2/practise')}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue to Practice
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-surface-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-text-muted text-xs uppercase tracking-wide">
                  Note {noteIdx + 1} of {SCALE.length}
                </p>
                <div className="flex gap-1.5">
                  {SCALE.map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${
                      i < noteIdx ? 'bg-secondary' : i === noteIdx ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 mb-5">
                <span className="text-7xl font-bold text-text-primary">{currentNote.note}</span>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
                    {phase === 'playing' ? 'Listen...' : 'Now sing this note'}
                  </p>
                  <p className="text-text-secondary text-sm">{currentNote.label}: {currentNote.freq.toFixed(2)} Hz</p>
                </div>
              </div>

              {phase === 'singing' && (
                <PitchIndicator status={pitchStatus} label="Hold green for 1.5 seconds to advance" />
              )}
              {phase === 'playing' && !startedRef.current && (
                <button
                  onClick={startExercise}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Start scale exercise
                </button>
              )}
              {phase === 'playing' && startedRef.current && (
                <p className="text-text-muted text-sm">Reference tone playing...</p>
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
