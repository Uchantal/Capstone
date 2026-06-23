import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import MainLayout from '../../components/MainLayout'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, playTone, drawWaveform, type PitchStatus } from '../../utils/voicePitch'

const REFERENCE_NOTES = [
  { label: 'A4 (sustain)', note: 'A', freq: 440.00 },
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'G4', note: 'G', freq: 392.00 },
  { label: 'E4 (vowels)', note: 'E', freq: 329.63 },
]

export default function VoiceLevel3PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { progress, loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError, micReady } = useVoiceMic()

  const [activeNote, setActiveNote]   = useState<typeof REFERENCE_NOTES[number] | null>(null)
  const [pitchStatus, setPitchStatus] = useState<PitchStatus>('none')

  const rafRef        = useRef<number>(0)
  const activeRef     = useRef(false)
  const waveformRef   = useRef<HTMLCanvasElement>(null)
  const targetFreqRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (!progress.completedStages.includes('voice-level-3')) {
      navigate('/voice/level-3', { replace: true, state: { lockedMessage: 'Complete Level 3 first.' } })
      return
    }
    markStageVisited('voice-level-3-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, loading, progress.completedStages])

  useEffect(() => {
    return () => { activeRef.current = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const runLoop = useCallback(() => {
    if (!activeRef.current || !analyserRef.current) return
    const freq   = detectPitch(analyserRef.current)
    const target = targetFreqRef.current
    setPitchStatus(target !== null ? getPitchStatus(freq, target) : 'none')
    if (waveformRef.current) drawWaveform(analyserRef.current, waveformRef.current)
    rafRef.current = requestAnimationFrame(runLoop)
  }, [analyserRef])

  const startMic = useCallback(async () => {
    const ok = await initMic()
    if (!ok) return
    activeRef.current = true
    rafRef.current = requestAnimationFrame(runLoop)
  }, [initMic, runLoop])

  const handlePlayNote = (note: typeof REFERENCE_NOTES[number]) => {
    const duration = note.note === 'A' ? 4.0 : 1.5
    playTone(note.freq, duration)
    setActiveNote(note)
    targetFreqRef.current = note.freq
    setTimeout(() => { setActiveNote(null); targetFreqRef.current = null }, duration * 1000 + 200)
    if (!micReady) startMic()
  }

  if (!isPreviewMode && (loading || !progress.completedStages.includes('voice-level-3'))) return null

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/voice/studio')} className="hover:text-text-primary transition-colors">Voice and Singing</button>
          <span>/</span><span>Level 3</span><span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 3: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise the Level 3 exercises: sustain A4 for 4 seconds, alternate C and G, and sing vowels on E4.
          Click reference notes below to hear them. When ready, move to the demonstration.
        </p>

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Reference tones</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {REFERENCE_NOTES.map(n => (
              <button
                key={n.label}
                onClick={() => handlePlayNote(n)}
                className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  activeNote?.label === n.label
                    ? 'bg-primary border-primary text-white scale-95'
                    : 'bg-white border-surface-border text-text-primary hover:border-primary/50 hover:bg-primary/10'
                }`}
              >
                <span className="font-bold text-xl">{n.note}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-2xl p-4 mb-4">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Exercise reminders</p>
          <ul className="text-text-secondary text-xs space-y-2">
            <li>Exercise 1: Sing A4 on "la" and hold steady for 4 continuous seconds</li>
            <li>Exercise 2: Move between C4 and G4 three times, 1.5 seconds on each note</li>
            <li>Exercise 3: Sing vowels A, E, I, O, U on E4, 1.5 seconds each</li>
          </ul>
        </div>

        {micError && (
          <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-4">{micError}</p>
        )}

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          {micReady ? (
            <PitchIndicator
              status={pitchStatus}
              label={activeNote ? `Listening for ${activeNote.note} (${activeNote.freq.toFixed(0)} Hz)` : 'Click a reference note, then sing it'}
            />
          ) : (
            <button
              onClick={startMic}
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Enable microphone for live feedback
            </button>
          )}
        </div>

        <div className="bg-white border border-surface-border rounded-2xl p-4 mb-8">
          <p className="text-text-muted text-xs mb-2">Live audio input</p>
          <canvas ref={waveformRef} width={800} height={60} className="w-full rounded-lg bg-gray-950" />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/voice/level-3/demonstrate')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
