import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, playTone, drawWaveform, type PitchStatus } from '../../utils/voicePitch'
import Footer from '../../components/Footer'

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

const NOTES = [
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'E4', note: 'E', freq: 329.63 },
  { label: 'G4', note: 'G', freq: 392.00 },
]

const REQUIRED_MS = 2000

export default function VoiceLevel1Page() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError } = useVoiceMic()

  const [noteIdx,      setNoteIdx]      = useState(0)
  const [phase,        setPhase]        = useState<'playing' | 'singing' | 'complete'>('playing')
  const [pitchStatus,  setPitchStatus]  = useState<PitchStatus>('none')
  const [matchedCount, setMatchedCount] = useState(0)

  const rafRef          = useRef<number>(0)
  const phaseRef        = useRef<'playing' | 'singing' | 'complete'>('playing')
  const noteIdxRef      = useRef(0)
  const onPitchSinceRef = useRef<number | null>(null)
  const waveformRef     = useRef<HTMLCanvasElement>(null)
  const startedRef      = useRef(false)

  // Gate: both courses done
  useEffect(() => {
    if (loading) return
    if (!progress.completedStages.includes('voice-course-2')) {
      navigate('/voice/pitch-and-scale', {
        replace: true,
        state: { lockedMessage: 'Complete both courses first.' },
      })
    }
  }, [loading, progress.completedStages, navigate])

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [])

  const runLoop = useCallback(() => {
    if (phaseRef.current !== 'singing' || !analyserRef.current) return
    const freq   = detectPitch(analyserRef.current)
    const status = getPitchStatus(freq, NOTES[noteIdxRef.current].freq)
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
        const newCount = next
        setMatchedCount(newCount)

        if (next >= NOTES.length) {
          phaseRef.current = 'complete'
          setPhase('complete')
          markStageVisited('voice-level-1')
          return
        }
        setNoteIdx(next)
        setPhase('playing')
        playTone(NOTES[next].freq, 2.0)
        setTimeout(() => {
          phaseRef.current = 'singing'
          setPhase('singing')
          rafRef.current = requestAnimationFrame(runLoop)
        }, 2200)
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
    playTone(NOTES[0].freq, 2.0)
    setTimeout(() => {
      phaseRef.current = 'singing'
      setPhase('singing')
      rafRef.current = requestAnimationFrame(runLoop)
    }, 2200)
  }, [initMic, runLoop])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  const currentNote = NOTES[Math.min(noteIdx, NOTES.length - 1)]

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
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
          <span className="text-text-primary">Level 1</span>
        </div>

        <ProgressBar value={1} total={3} label="Level 1 of 3" />

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 1: Pitch Matching on Single Notes</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Listen to the note, then sing or hum it back on the syllable "la". Hold it steady for a moment.
          The indicator turns green when you are on pitch. Hold green for 2 seconds to move to the next note.
        </p>

        {/* Progress tracker */}
        <div className="flex gap-3 mb-6">
          {NOTES.map((n, i) => (
            <div key={n.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${
              i < matchedCount
                ? 'bg-green-100 border-green-400 text-green-700'
                : i === noteIdx && phase !== 'complete'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-border text-text-muted'
            }`}>
              {i < matchedCount ? 'Matched' : n.note}
            </div>
          ))}
        </div>

        {phase === 'complete' ? (
          <div className="bg-secondary/5 border-2 border-secondary/30 rounded-2xl p-8 text-center mb-6">
            <h2 className="text-text-primary font-bold text-xl mb-2">Level 1 Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You matched C, E, and G. You are ready to practise and then demonstrate this skill.
            </p>
            <button
              onClick={() => navigate('/voice/level-1/practise')}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue to Practice
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current note card */}
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-text-muted text-xs uppercase tracking-wide">
                  Note {noteIdx + 1} of {NOTES.length}
                </p>
                <div className="flex gap-1.5">
                  {NOTES.map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${
                      i < matchedCount ? 'bg-green-500' : i === noteIdx ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6 mb-4">
                <span className="text-7xl font-bold text-text-primary">{currentNote.note}</span>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
                    {phase === 'playing' ? 'Listen to this note' : 'Now sing this note back'}
                  </p>
                  <p className="text-text-secondary text-sm">{currentNote.label}: {currentNote.freq.toFixed(2)} Hz</p>
                </div>
              </div>
              {phase === 'singing' && (
                <PitchIndicator status={pitchStatus} label="Hold green for 2 seconds to advance" />
              )}
              {phase === 'playing' && !startedRef.current && (
                <button
                  onClick={startExercise}
                  className="bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm"
                >
                  Start exercise
                </button>
              )}
              {phase === 'playing' && startedRef.current && (
                <p className="text-text-muted text-sm">Reference tone playing...</p>
              )}
            </div>

            {/* Waveform */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <p className="text-text-muted text-xs mb-2">Live audio input</p>
              <canvas ref={waveformRef} width={800} height={60} className="w-full rounded-lg bg-gray-950" />
            </div>

            {micError && (
              <p className="text-xs text-accent bg-red-50 border border-red-200 rounded-lg px-3 py-2">{micError}</p>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
