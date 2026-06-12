import { useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

// Open string frequencies: E A D G B e
const STRINGS = [
  { name: 'e (high)', frets: [329.63, 349.23, 392.0, 440.0, 493.88, 523.25] },
  { name: 'B',       frets: [246.94, 261.63, 293.66, 329.63, 349.23, 392.0] },
  { name: 'G',       frets: [196.0,  220.0,  246.94, 261.63, 293.66, 329.63] },
  { name: 'D',       frets: [146.83, 164.81, 196.0,  220.0,  246.94, 261.63] },
  { name: 'A',       frets: [110.0,  123.47, 146.83, 164.81, 196.0,  220.0]  },
  { name: 'E (low)', frets: [82.41,  87.31,  98.0,   110.0,  123.47, 146.83] },
]

const CHORDS: Record<string, { label: string; freqs: number[] }> = {
  Em: { label: 'E minor', freqs: [82.41, 123.47, 196.0, 246.94, 329.63, 392.0] },
  Am: { label: 'A minor', freqs: [110.0, 146.83, 220.0, 261.63, 329.63, 349.23] },
  G:  { label: 'G major', freqs: [98.0,  146.83, 196.0, 246.94, 293.66, 392.0] },
  C:  { label: 'C major', freqs: [130.81, 164.81, 196.0, 261.63, 329.63, 392.0] },
}

const HINTS: Record<number, string> = {
  1: 'Tap any fret on any string to hear a note. The top row is the high e string.',
  2: 'Try the chord buttons below — E minor is great for beginners.',
  3: 'Play Em → Am → G → C in sequence. That is a popular 4-chord progression.',
  4: 'Press Start Recording and play your progression or a short melody.',
  5: 'Give your session a title and save it to your portfolio.',
}

export default function GuitarModule({ step, onAudioReady }: Props) {
  const [lastNote, setLastNote] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const ac = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const pluck = (freq: number, label: string) => {
    const ctx = ac()
    // Karplus-Strong-inspired pluck: noise burst → lowpass
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq * 4

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    source.stop(ctx.currentTime + 1.2)
    setLastNote(label)
  }

  const strumChord = (freqs: number[], label: string) => {
    freqs.forEach((freq, i) => {
      setTimeout(() => pluck(freq, label), i * 30)
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
      <p className="text-text-secondary text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
        💡 {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Fretboard */}
      <div>
        <p className="text-text-secondary text-xs font-medium mb-2">Virtual fretboard</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-text-secondary font-normal pr-3 py-1 w-16">String</th>
                {[0, 1, 2, 3, 4, 5].map((f) => (
                  <th key={f} className="text-center text-text-secondary font-normal px-1 py-1">
                    {f === 0 ? 'Open' : `Fret ${f}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STRINGS.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <td className="text-text-secondary pr-3 py-1 whitespace-nowrap">{s.name}</td>
                  {s.frets.map((freq, fi) => (
                    <td key={fi} className="px-1 py-1 text-center">
                      <button
                        onClick={() => pluck(freq, `${s.name} fret ${fi}`)}
                        aria-label={`${s.name} fret ${fi}`}
                        className="w-8 h-8 rounded-full bg-white border border-border text-text-secondary text-xs
                          hover:bg-primary hover:text-white hover:border-primary transition-colors"
                      >
                        ●
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastNote && (
          <p className="text-text-secondary text-xs mt-2">Last played: {lastNote}</p>
        )}
      </div>

      {/* Chords — step 2+ */}
      {step >= 2 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Chord strummer</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CHORDS).map(([key, { label, freqs }]) => (
              <button
                key={key}
                onClick={() => strumChord(freqs, label)}
                className="px-5 py-2.5 rounded-lg border border-border bg-white text-text-primary text-sm font-semibold hover:border-primary hover:bg-yellow-50 transition-colors"
              >
                {key}
                <span className="text-text-secondary font-normal ml-1 text-xs">({label})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording — step 4+ */}
      {step >= 4 && (
        <div>
          <p className="text-text-secondary text-xs font-medium mb-2">Record your session</p>
          {!recording && !recorded && (
            <button onClick={startRecording} className="bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              🎙 Start Recording
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm font-medium">Recording…</span>
              </div>
              <button onClick={stopRecording} className="border border-accent text-accent font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
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
