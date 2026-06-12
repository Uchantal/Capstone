import { useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

const KEYS = [
  { label: 'C', freq: 261.63, black: false },
  { label: 'D', freq: 293.66, black: false },
  { label: 'E', freq: 329.63, black: false },
  { label: 'F', freq: 349.23, black: false },
  { label: 'G', freq: 392.0,  black: false },
  { label: 'A', freq: 440.0,  black: false },
  { label: 'B', freq: 493.88, black: false },
  { label: 'C2', freq: 523.25, black: false },
]

const CHORDS: Record<string, number[]> = {
  'C major': [261.63, 329.63, 392.0],
  'F major': [349.23, 440.0, 523.25],
  'G major': [392.0, 493.88, 587.33],
  'A minor': [440.0, 523.25, 659.25],
}

type StepHint = Record<number, string>
const HINTS: StepHint = {
  1: 'Play C D E F G A B C in order — that is the C major scale.',
  2: 'Try the C major chord button, then F, then G. That is a I–IV–V progression.',
  3: 'Use the keys to find a melody by ear. Try starting on C.',
  4: 'Press Start Recording, play a melody, then press Stop.',
  5: 'Happy with your recording? Give it a title and save it.',
}

export default function PianoModule({ step, onAudioReady }: Props) {
  const [playedNotes, setPlayedNotes] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const ctx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const playFreqs = (freqs: number[], label: string) => {
    const ac = ctx()
    freqs.forEach((freq) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ac.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.0)
      osc.start()
      osc.stop(ac.currentTime + 1.0)
    })
    setActiveKey(label)
    setTimeout(() => setActiveKey(null), 300)
    setPlayedNotes((prev) => [...prev.slice(-7), label])
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
        reader.onload = () => { onAudioReady(reader.result as string); setRecorded(true) }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      onAudioReady('audio-placeholder')
      setRecorded(true)
    }
  }

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false) }

  return (
    <div className="space-y-5">
      {/* Step hint */}
      <p className="text-text-secondary text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
        💡 {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Piano keys */}
      <div>
        <p className="text-text-secondary text-xs font-medium mb-2">Virtual keyboard</p>
        <div className="flex gap-1.5 flex-wrap">
          {KEYS.map((k) => (
            <button
              key={k.label}
              onMouseDown={() => playFreqs([k.freq], k.label)}
              aria-label={`Play note ${k.label}`}
              className={`min-w-[52px] py-6 rounded-lg border-2 text-sm font-semibold transition-all select-none
                ${activeKey === k.label
                  ? 'bg-primary text-white border-primary scale-95'
                  : 'bg-white border-border text-text-primary hover:border-primary hover:bg-yellow-50'
                }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {playedNotes.length > 0 && (
          <p className="text-text-secondary text-xs mt-2">
            Played: {playedNotes.join(' · ')}
          </p>
        )}
      </div>

      {/* Chords — unlocked from step 2 */}
      {step >= 2 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Common chords</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CHORDS).map(([name, freqs]) => (
              <button
                key={name}
                onClick={() => playFreqs(freqs, name)}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all
                  ${activeKey === name
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-text-primary hover:border-primary'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording — unlocked from step 4 */}
      {step >= 4 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Record your session</p>
          {!recording && !recorded && (
            <button
              onClick={startRecording}
              className="bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              🎙 Start Recording
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm font-medium">Recording…</span>
              </div>
              <button
                onClick={stopRecording}
                className="border border-accent text-accent font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
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
