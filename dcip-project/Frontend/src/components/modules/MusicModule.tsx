import { useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

const NOTES = [
  { label: 'C', freq: 261.63 },
  { label: 'D', freq: 293.66 },
  { label: 'E', freq: 329.63 },
  { label: 'F', freq: 349.23 },
  { label: 'G', freq: 392.0 },
  { label: 'A', freq: 440.0 },
  { label: 'B', freq: 493.88 },
  { label: 'C2', freq: 523.25 },
]

export default function MusicModule({ step, onAudioReady }: Props) {
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [playedNotes, setPlayedNotes] = useState<string[]>([])
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  const playNote = (freq: number, label: string) => {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
    setPlayedNotes((prev) => [...prev.slice(-6), label])
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const reader = new FileReader()
        reader.onload = () => {
          onAudioReady(reader.result as string)
          setRecorded(true)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      // microphone not available — save a placeholder
      onAudioReady('audio-placeholder')
      setRecorded(true)
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div>
      {/* Keyboard */}
      <div className="mb-6">
        <p className="text-text-secondary text-xs mb-3">Tap the keys to play notes</p>
        <div className="flex gap-2 flex-wrap">
          {NOTES.map((n) => (
            <button
              key={n.label}
              onClick={() => playNote(n.freq, n.label)}
              className="bg-white border-2 border-surface-border hover:border-primary hover:bg-primary/5 rounded-lg px-4 py-5 text-text-primary font-semibold text-sm transition-all active:scale-95"
            >
              {n.label}
            </button>
          ))}
        </div>
        {playedNotes.length > 0 && (
          <p className="text-text-secondary text-xs mt-2">
            Recent: {playedNotes.join(' · ')}
          </p>
        )}
      </div>

      {/* Recording — shown from step 2 */}
      {step >= 2 && (
        <div>
          <p className="text-text-secondary text-xs mb-3">Record your voice or melody</p>
          {!recording && !recorded && (
            <button
              onClick={startRecording}
              className="bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start recording
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm font-medium">Recording...</span>
              </div>
              <button
                onClick={stopRecording}
                className="border border-accent text-accent font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/5 transition-colors"
              >
                Stop
              </button>
            </div>
          )}
          {recorded && (
            <div className="flex items-center gap-2 text-status-synced text-sm">
              <span>✓</span>
              <span>Recording saved</span>
              <button
                onClick={() => { setRecorded(false); setRecording(false) }}
                className="text-text-secondary text-xs underline ml-2"
              >
                Record again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
