import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import MainLayout from '../../components/MainLayout'
import PitchIndicator from '../../components/voice/PitchIndicator'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { detectPitch, getPitchStatus, playTone, drawWaveform, type PitchStatus } from '../../utils/voicePitch'

const SCALE = [
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'D4', note: 'D', freq: 293.66 },
  { label: 'E4', note: 'E', freq: 329.63 },
  { label: 'F4', note: 'F', freq: 349.23 },
  { label: 'G4', note: 'G', freq: 392.00 },
]

export default function VoiceLevel2PractisePage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micError, micReady } = useVoiceMic()

  const [activeNote, setActiveNote]   = useState<typeof SCALE[number] | null>(null)
  const [pitchStatus, setPitchStatus] = useState<PitchStatus>('none')

  const rafRef        = useRef<number>(0)
  const activeRef     = useRef(false)
  const waveformRef   = useRef<HTMLCanvasElement>(null)
  const targetFreqRef = useRef<number | null>(null)

  useEffect(() => {
    if (loading) return
    markStageVisited('voice-level-2-practise')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
    return () => { activeRef.current = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const runLoop = useCallback(() => {
    if (!activeRef.current || !analyserRef.current) return
    const freq = detectPitch(analyserRef.current)
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

  const handlePlayNote = (note: typeof SCALE[number]) => {
    playTone(note.freq, 1.5)
    setActiveNote(note)
    targetFreqRef.current = note.freq
    setTimeout(() => setActiveNote(null), 1700)
    if (!micReady) startMic()
  }

  const handlePlayScale = () => {
    SCALE.forEach((n, i) => {
      setTimeout(() => {
        playTone(n.freq, 1.5)
        setActiveNote(n)
        targetFreqRef.current = n.freq
        setTimeout(() => { setActiveNote(null); targetFreqRef.current = null }, 1500)
      }, i * 2000)
    })
    if (!micReady) startMic()
  }

  if (!isPreviewMode && loading) return null

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span><span>Level 2</span><span>/</span>
          <span className="text-text-primary">Practise</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Level 2: Practise</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          Practise the C major scale. Click individual notes to hear them, or play the full scale.
          Sing each note back on "la" and watch the pitch indicator. When you feel confident, move to the demonstration.
        </p>

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Scale notes (click to hear)</p>
          <div className="flex gap-3 flex-wrap mb-4">
            {SCALE.map(n => (
              <button
                key={n.label}
                onClick={() => handlePlayNote(n)}
                className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all font-bold text-xl ${
                  activeNote?.label === n.label
                    ? 'bg-primary border-primary text-white scale-95'
                    : 'bg-white border-surface-border text-text-primary hover:border-primary/50 hover:bg-primary/10'
                }`}
              >
                {n.note}
                <span className="text-[9px] font-normal mt-0.5">{n.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handlePlayScale}
            className="border border-primary/50 text-primary text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            Play full scale (C to G)
          </button>
        </div>

        {micError && (
          <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-4">{micError}</p>
        )}

        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-5">
          {micReady ? (
            <PitchIndicator
              status={pitchStatus}
              label={activeNote ? `Listening for ${activeNote.note} (${activeNote.freq.toFixed(0)} Hz)` : 'Click a note above, then sing it'}
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
            onClick={() => navigate('/voice/level-2/demonstrate')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready to demonstrate
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
