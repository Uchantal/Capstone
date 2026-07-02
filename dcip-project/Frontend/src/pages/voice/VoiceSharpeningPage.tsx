import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import MainLayout from '../../components/MainLayout'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { playTone, drawWaveform, SCALE_NOTES } from '../../utils/voicePitch'
import AskAIHint from '../../components/ai/AskAIHint'

export default function VoiceSharpeningPage() {
  const navigate  = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location  = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { loading, markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micStreamRef, micError, micReady } = useVoiceMic()

  const [recording,    setRecording]    = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [activeNote,   setActiveNote]   = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const rafRef           = useRef<number>(0)
  const waveformRef      = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (loading) return
    markStageVisited('voice-sharpening')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      mediaRecorderRef.current?.stop()
    }
  }, [])

  const drawLoop = () => {
    if (!analyserRef.current || !waveformRef.current) return
    drawWaveform(analyserRef.current, waveformRef.current)
    rafRef.current = requestAnimationFrame(drawLoop)
  }

  const startRecording = async () => {
    if (recording) return
    const ok = await initMic()
    if (!ok || !micStreamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(micStreamRef.current)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setRecordingUrl(URL.createObjectURL(blob))
    }
    mr.start(100)
    mediaRecorderRef.current = mr
    setRecording(true)
    setRecordingUrl(null)
    rafRef.current = requestAnimationFrame(drawLoop)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    cancelAnimationFrame(rafRef.current)
    setRecording(false)
  }

  const handlePlayNote = (note: typeof SCALE_NOTES[number]) => {
    playTone(note.freq, 2.0)
    setActiveNote(note.label)
    setTimeout(() => setActiveNote(null), 2200)
  }

  if (!isPreviewMode && loading) return null

  return (
    <MainLayout>
      <AskAIHint discipline="Voice" context="Voice Sharpening" />
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {lockedMessage && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-5 text-accent text-sm">
            {lockedMessage}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate(-1)} className="hover:text-text-primary transition-colors">← Back</button>
          <span>/</span>
          <span className="text-text-primary">Sharpening Myself</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Sharpening Myself</h1>
        <p className="text-text-secondary text-sm mb-6 max-w-xl leading-relaxed">
          This is your free practice space before the production session. Use the reference notes, review the breathing
          guide, and record yourself to hear your own voice. When you are ready, continue to production.
        </p>

        {/* Reference card */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white border border-surface-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Breathing reminders</p>
            <ul className="text-text-secondary text-sm space-y-2">
              <li>Breathe in slowly for 4 counts using your diaphragm</li>
              <li>Feel your belly expand, not your chest</li>
              <li>Exhale steadily and evenly on "s" for 8 counts</li>
              <li>Relax your shoulders and jaw before each phrase</li>
              <li>Support each note from your core, not your throat</li>
            </ul>
          </div>

          <div className="bg-white border border-surface-border rounded-2xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Reference tones (click to hear)</p>
            <div className="flex flex-wrap gap-2">
              {SCALE_NOTES.map(n => (
                <button
                  key={n.label}
                  onClick={() => handlePlayNote(n)}
                  className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-sm font-bold ${
                    activeNote === n.label
                      ? 'bg-primary border-primary text-white scale-95'
                      : 'bg-white border-surface-border text-text-primary hover:border-primary/50 hover:bg-primary/10'
                  }`}
                >
                  {n.note}
                  <span className="text-[8px] font-normal">{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recording interface */}
        <div className="bg-white border border-surface-border rounded-2xl p-6 mb-8">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Record yourself</p>

          <div className="flex gap-3 mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                className="bg-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-colors text-sm"
              >
                Start recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
              >
                Stop recording
              </button>
            )}
            {recording && (
              <span className="flex items-center gap-2 text-accent text-sm font-medium">
                <span className="w-2 h-2 bg-accent/50 rounded-full animate-pulse" />
                Recording
              </span>
            )}
          </div>

          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mb-3">{micError}</p>
          )}

          {micReady && (
            <div className="mb-4">
              <p className="text-text-muted text-xs mb-2">Live audio input</p>
              <canvas ref={waveformRef} width={800} height={60} className="w-full rounded-lg bg-gray-950" />
            </div>
          )}

          {recordingUrl && (
            <div>
              <p className="text-text-muted text-xs mb-2">Your recording</p>
              <audio controls src={recordingUrl} className="w-full" />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/voice/production')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready, Continue to Production
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
