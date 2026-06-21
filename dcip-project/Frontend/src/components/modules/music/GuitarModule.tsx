import { useEffect, useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

// Visual order: high e on top, low E on bottom
const STRING_DATA = [
  { name: 'e4', open: 329.63, lineClass: 'border-b border-amber-200/50' },
  { name: 'B3', open: 246.94, lineClass: 'border-b border-amber-200/60' },
  { name: 'G3', open: 196.00, lineClass: 'border-b-2 border-amber-300/60' },
  { name: 'D3', open: 146.83, lineClass: 'border-b-2 border-amber-300/70' },
  { name: 'A2', open: 110.00, lineClass: 'border-b-[3px] border-amber-400/80' },
  { name: 'E2', open: 82.41,  lineClass: 'border-b-4 border-amber-400' },
] as const

// Positions in string order [e4, B3, G3, D3, A2, E2], -1 = muted
const CHORD_DATA = [
  { id: 'Em', fullName: 'E minor', positions: [0, 0, 0, 2, 2, 0] },
  { id: 'Am', fullName: 'A minor', positions: [0, 1, 2, 2, 0, -1] },
  { id: 'G',  fullName: 'G major', positions: [3, 0, 0, 0, 2, 3] },
  { id: 'C',  fullName: 'C major', positions: [0, 1, 0, 2, 3, -1] },
] as const

const HINTS: Record<number, string> = {
  1: 'Tap any position on the fretboard to hear a note.',
  2: 'Use the chord buttons below. Em (E minor) is a great starting point.',
  3: 'Try Em → Am → G → C in sequence, one of the most popular progressions in music.',
  4: 'Press Start Recording, play freely, then Stop to capture your session.',
  5: 'Give your session a title above and save it to your portfolio.',
}

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

interface ChordDiagramProps {
  id: string
  fullName: string
  positions: readonly number[]
  onPlay: () => void
}

function ChordDiagram({ id, fullName, positions, onPlay }: ChordDiagramProps) {
  return (
    <button
      onClick={onPlay}
      className="flex flex-col items-center bg-amber-950 border border-amber-800 rounded-xl p-3 hover:border-amber-400 transition-colors w-16"
      aria-label={`Play ${fullName} chord`}
    >
      <div className="flex justify-around w-full mb-0.5">
        {positions.map((pos, i) => (
          <span key={i} className="text-amber-300 text-[9px] w-2.5 text-center">
            {pos === -1 ? '✕' : pos === 0 ? '○' : ''}
          </span>
        ))}
      </div>
      <div className="h-0.5 w-full bg-amber-300" />
      {[1, 2, 3, 4].map((fret) => (
        <div key={fret} className="flex justify-around w-full border-b border-amber-800 py-0.5">
          {positions.map((pos, si) => (
            <div key={si} className="w-2.5 h-2.5 flex items-center justify-center">
              {pos === fret && <span className="w-2 h-2 rounded-full bg-amber-400 block" />}
            </div>
          ))}
        </div>
      ))}
      <p className="text-amber-100 font-bold text-sm mt-1.5">{id}</p>
    </button>
  )
}

function motivationMessage(notes: number, chords: number): string {
  if (notes === 0 && chords === 0) return 'Start by tapping the fretboard above.'
  if (chords >= 4) return 'Excellent! You played the full 4-chord progression!'
  if (chords >= 1) return 'Great session. You are building real guitar feel.'
  if (notes >= 10) return 'Good note exploration. Try one of the chords next.'
  return 'Good start. Keep exploring the strings.'
}

export default function GuitarModule({ step, onAudioReady }: Props) {
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [notesPlayed, setNotesPlayed] = useState(0)
  const [chordsPlayed, setChordsPlayed] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [sessionNum, setSessionNum] = useState(1)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const n = parseInt(localStorage.getItem('dcip-guitar-sessions') || '0')
    setSessionNum(n + 1)
    return () => { audioCtxRef.current?.close() }
  }, [])

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      destRef.current = ctx.createMediaStreamDestination()
    }
    return audioCtxRef.current
  }

  const playFret = (stringIdx: number, fret: number) => {
    const ctx = ensureCtx()
    const freq = STRING_DATA[stringIdx].open * Math.pow(2, fret / 12)
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const dist = ctx.createWaveShaper()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = freq
    dist.curve = makeDistortionCurve(30)
    dist.oversample = '2x'

    osc.connect(dist)
    dist.connect(gain)
    gain.connect(ctx.destination)
    if (destRef.current) gain.connect(destRef.current)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4)
    osc.start(now)
    osc.stop(now + 1.4)

    const key = `${stringIdx}-${fret}`
    setActiveCell(key)
    setTimeout(() => setActiveCell((p) => (p === key ? null : p)), 250)
    setNotesPlayed((n) => n + 1)
  }

  const strumChord = (chord: (typeof CHORD_DATA)[number]) => {
    chord.positions.forEach((fret, si) => {
      if (fret === -1) return
      setTimeout(() => playFret(si, fret), si * 30)
    })
    setChordsPlayed((n) => n + 1)
  }

  const startRecording = () => {
    ensureCtx()
    if (!destRef.current) return
    const mr = new MediaRecorder(destRef.current.stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedUrl(url)
      const reader = new FileReader()
      reader.onload = () => {
        onAudioReady(reader.result as string)
        localStorage.setItem('dcip-guitar-sessions', String(sessionNum))
      }
      reader.readAsDataURL(blob)
    }
    mr.start()
    mediaRef.current = mr
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-[11px]">Session {sessionNum} of your guitar journey</p>

      <p className="text-text-secondary text-xs bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Fretboard */}
      <div>
        <p className="text-text-primary text-xs font-semibold mb-2">Fretboard</p>
        <div className="bg-amber-900 rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="flex px-3 pt-2.5 pb-1">
            <div className="w-10 shrink-0" />
            {['Open', 'I', 'II', 'III', 'IV', 'V'].map((label) => (
              <div key={label} className="flex-1 text-center text-amber-300 text-[10px]">{label}</div>
            ))}
          </div>
          {/* Position dot markers */}
          <div className="flex px-3 pb-2">
            <div className="w-10 shrink-0" />
            {[0, 1, 2, 3, 4, 5].map((f) => (
              <div key={f} className="flex-1 flex justify-center">
                {(f === 3 || f === 5) && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400/60" />
                )}
              </div>
            ))}
          </div>
          {/* String rows */}
          {STRING_DATA.map((str, si) => (
            <div key={str.name} className={`flex items-center px-3 py-0.5 ${str.lineClass}`}>
              <div className="w-10 text-amber-200/70 text-[10px] text-right pr-2.5 font-mono shrink-0">
                {str.name}
              </div>
              {[0, 1, 2, 3, 4, 5].map((fret) => {
                const cellKey = `${si}-${fret}`
                const active = activeCell === cellKey
                return (
                  <button
                    key={fret}
                    onClick={() => playFret(si, fret)}
                    aria-label={`${str.name} fret ${fret === 0 ? 'open' : fret}`}
                    className="flex-1 flex justify-center py-2 group"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150
                      ${active ? 'bg-amber-400 scale-110' : 'bg-amber-800/50 group-hover:bg-amber-600'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full block
                        ${active ? 'bg-amber-900' : 'bg-amber-300/60 group-hover:bg-amber-200'}`}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Chord library — step 2+ */}
      {step >= 2 && (
        <div>
          <p className="text-text-primary text-xs font-semibold mb-2">Chord library: click to strum</p>
          <div className="flex gap-3 flex-wrap">
            {CHORD_DATA.map((chord) => (
              <ChordDiagram
                key={chord.id}
                id={chord.id}
                fullName={chord.fullName}
                positions={chord.positions}
                onPlay={() => strumChord(chord)}
              />
            ))}
          </div>
        </div>
      )}

      {(notesPlayed > 0 || chordsPlayed > 0) && (
        <p className="text-text-secondary text-xs">
          Notes played: {notesPlayed} · Chords strummed: {chordsPlayed}
        </p>
      )}

      {/* Recording — step 4+ */}
      {step >= 4 && (
        <div className="space-y-3">
          <p className="text-text-primary text-xs font-semibold">Record your session</p>
          <p className="text-text-secondary text-xs">
            This recording captures the notes you play, not the microphone.
          </p>

          {!recording && !recordedUrl && (
            <button
              onClick={startRecording}
              className="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Start Recording
            </button>
          )}

          {recording && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm font-medium">Recording: play your notes</span>
              </div>
              <button
                onClick={stopRecording}
                className="border border-accent text-accent font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/5 transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {recordedUrl && !recording && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-status-synced text-sm font-medium">✓ Recording captured</span>
                <button
                  onClick={() => setRecordedUrl(null)}
                  className="text-text-secondary text-xs underline"
                >
                  Record again
                </button>
              </div>
              <audio controls src={recordedUrl} className="w-full h-10" />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                <p className="text-text-primary text-xs font-semibold">Session summary</p>
                <p className="text-text-secondary text-xs">Notes played: {notesPlayed}</p>
                <p className="text-text-secondary text-xs">Chords strummed: {chordsPlayed}</p>
                <p className="text-primary text-xs font-medium mt-1.5">
                  {motivationMessage(notesPlayed, chordsPlayed)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
