import { useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

const REFERENCE_TONES = [
  { label: 'C4',  freq: 261.63 },
  { label: 'D4',  freq: 293.66 },
  { label: 'E4',  freq: 329.63 },
  { label: 'F4',  freq: 349.23 },
  { label: 'G4',  freq: 392.0  },
  { label: 'A4',  freq: 440.0  },
]

const WARMUPS = [
  'Breathe in slowly for 4 counts, out for 4 counts. Repeat 3 times.',
  'Hum gently on a comfortable pitch. Feel the vibration in your chest.',
  'Say "Ma-Me-Mi-Mo-Mu" clearly, one syllable per breath.',
  'Slide your voice up and down like a siren — low to high, high to low.',
]

const HINTS: Record<number, string> = {
  1: 'Start with the breathing warm-up below. Good breath control is the foundation of singing.',
  2: 'Click each reference tone and try to hum or sing the same pitch. Match as closely as you can.',
  3: 'Sing the vowel exercise out loud: A – E – I – O – U, going up then back down.',
  4: 'Press Start Recording and sing or hum a short phrase. You can use the tones for reference.',
  5: 'Happy with your take? Give it a title and save it.',
}

export default function VoiceModule({ step, onAudioReady }: Props) {
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [activeTone, setActiveTone] = useState<string | null>(null)
  const [completedWarmups, setCompletedWarmups] = useState<Set<number>>(new Set())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const ac = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const playTone = (freq: number, label: string) => {
    const ctx = ac()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0)
    osc.start()
    osc.stop(ctx.currentTime + 2.0)
    setActiveTone(label)
    setTimeout(() => setActiveTone(null), 2000)
  }

  const toggleWarmup = (i: number) => {
    setCompletedWarmups((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
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
      <p className="text-text-secondary text-xs bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
        💡 {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Warm-up checklist */}
      <div>
        <p className="text-text-secondary text-xs font-medium mb-2">Breathing & warm-up exercises</p>
        <ul className="space-y-2">
          {WARMUPS.map((w, i) => (
            <li key={i}>
              <button
                onClick={() => toggleWarmup(i)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors text-sm
                  ${completedWarmups.has(i)
                    ? 'bg-green-50 border-green-200 text-text-primary'
                    : 'bg-white border-border text-text-secondary hover:border-primary'
                  }`}
              >
                <span className={`mt-0.5 text-base ${completedWarmups.has(i) ? 'text-status-synced' : 'text-border'}`}>
                  {completedWarmups.has(i) ? '✓' : '○'}
                </span>
                <span className="leading-relaxed">{w}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Pitch reference — step 2+ */}
      {step >= 2 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Pitch matching — click a tone and sing it</p>
          <div className="flex gap-2 flex-wrap">
            {REFERENCE_TONES.map((t) => (
              <button
                key={t.label}
                onClick={() => playTone(t.freq, t.label)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all
                  ${activeTone === t.label
                    ? 'bg-purple-600 text-white border-purple-600 scale-95'
                    : 'bg-white border-border text-text-primary hover:border-purple-400 hover:bg-purple-50'
                  }`}
              >
                {t.label}
                {activeTone === t.label && <span className="ml-1 animate-pulse">♪</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vowel exercise — step 3+ */}
      {step >= 3 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-text-secondary text-xs font-medium mb-2">Vowel exercise</p>
          <div className="flex gap-3">
            {['A', 'E', 'I', 'O', 'U'].map((v) => (
              <span key={v} className="text-purple-700 font-bold text-xl">{v}</span>
            ))}
          </div>
          <p className="text-text-secondary text-xs mt-2">
            Sing each vowel on a comfortable note — go up one step between each, then back down.
          </p>
        </div>
      )}

      {/* Recording — step 4+ */}
      {step >= 4 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Record your voice</p>
          {!recording && !recorded && (
            <button onClick={startRecording} className="bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-purple-800 transition-colors">
              🎙 Start Recording
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-purple-700 text-sm font-medium">Recording…</span>
              </div>
              <button onClick={stopRecording} className="border border-purple-400 text-purple-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                Stop
              </button>
            </div>
          )}
          {recorded && (
            <div className="flex items-center gap-2 text-status-synced text-sm">
              <span>✓</span><span>Recording saved</span>
              <button onClick={() => { setRecorded(false); setRecording(false) }} className="text-text-secondary text-xs underline ml-2">
                Record again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
