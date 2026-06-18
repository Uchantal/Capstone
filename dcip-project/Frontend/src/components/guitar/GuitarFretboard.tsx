import { useRef, useState } from 'react'

// Visual order: high e on top, low E on bottom — matches GuitarModule
export const STRING_DATA = [
  { name: 'e4', open: 329.63, lineClass: 'border-b border-amber-200/50' },
  { name: 'B3', open: 246.94, lineClass: 'border-b border-amber-200/60' },
  { name: 'G3', open: 196.00, lineClass: 'border-b-2 border-amber-300/60' },
  { name: 'D3', open: 146.83, lineClass: 'border-b-2 border-amber-300/70' },
  { name: 'A2', open: 110.00, lineClass: 'border-b-[3px] border-amber-400/80' },
  { name: 'E2', open: 82.41,  lineClass: 'border-b-4 border-amber-400' },
] as const

export const CHORD_DATA = [
  { id: 'Em', fullName: 'E minor', positions: [0, 0, 0, 2, 2, 0] },
  { id: 'Am', fullName: 'A minor', positions: [0, 1, 2, 2, 0, -1] },
  { id: 'G',  fullName: 'G major', positions: [3, 0, 0, 0, 2, 3] },
  { id: 'C',  fullName: 'C major', positions: [0, 1, 0, 2, 3, -1] },
] as const

function makeDistortionCurve(amount: number) {
  const n = 256
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

interface HighlightPosition {
  stringIdx: number
  fret: number
  label?: string
}

interface GuitarFretboardProps {
  onNotePlay?: (stringIdx: number, fret: number) => void
  onChordPlay?: (chordId: string) => void
  highlightPositions?: HighlightPosition[]
  showChords?: boolean
}

function ChordDiagram({
  id, fullName, positions, onPlay,
}: {
  id: string; fullName: string; positions: readonly number[]; onPlay: () => void
}) {
  return (
    <button
      onClick={onPlay}
      className="flex flex-col items-center bg-amber-950 border border-amber-800 rounded-xl p-3 hover:border-amber-400 transition-colors w-16"
      aria-label={`Play ${fullName} chord`}
    >
      <div className="flex justify-around w-full mb-0.5">
        {positions.map((pos, i) => (
          <span key={i} className="text-amber-300 text-[9px] w-2.5 text-center">
            {pos === -1 ? 'x' : pos === 0 ? 'o' : ''}
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

const FRET_LABELS = ['Open', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const DOT_FRETS = new Set([3, 5, 7, 9, 12])

export default function GuitarFretboard({ onNotePlay, onChordPlay, highlightPositions = [], showChords = true }: GuitarFretboardProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
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

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4)
    osc.start(now)
    osc.stop(now + 1.4)

    const key = `${stringIdx}-${fret}`
    setActiveCell(key)
    setTimeout(() => setActiveCell(p => (p === key ? null : p)), 300)

    onNotePlay?.(stringIdx, fret)
  }

  const strumChord = (chord: typeof CHORD_DATA[number]) => {
    chord.positions.forEach((fret, si) => {
      if (fret === -1) return
      setTimeout(() => playFret(si, fret), si * 30)
    })
    onChordPlay?.(chord.id)
  }

  return (
    <div className="space-y-5">
      {/* Fretboard — full 0-12 */}
      <div className="overflow-x-auto">
        <div className="bg-amber-900 rounded-xl min-w-[640px]">
          {/* Column headers */}
          <div className="flex px-3 pt-2.5 pb-1">
            <div className="w-10 shrink-0" />
            {FRET_LABELS.map((label) => (
              <div key={label} className="flex-1 text-center text-amber-300 text-[9px] min-w-[36px]">{label}</div>
            ))}
          </div>
          {/* Position dots */}
          <div className="flex px-3 pb-2">
            <div className="w-10 shrink-0" />
            {FRET_LABELS.map((_, f) => (
              <div key={f} className="flex-1 flex justify-center min-w-[36px]">
                {DOT_FRETS.has(f) && (
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
              {FRET_LABELS.map((_, fret) => {
                const cellKey = `${si}-${fret}`
                const active = activeCell === cellKey
                const highlight = highlightPositions.find(p => p.stringIdx === si && p.fret === fret)
                return (
                  <button
                    key={fret}
                    onClick={() => playFret(si, fret)}
                    aria-label={`${str.name} ${fret === 0 ? 'open' : `fret ${fret}`}`}
                    className="flex-1 flex justify-center py-2 group min-w-[36px]"
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150
                      ${active
                        ? 'bg-amber-400 scale-110'
                        : highlight
                        ? 'bg-primary scale-105'
                        : 'bg-amber-800/50 group-hover:bg-amber-600'}`}
                    >
                      {highlight && !active ? (
                        <span className="text-white text-[8px] font-bold leading-none">
                          {highlight.label ?? ''}
                        </span>
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full block
                          ${active ? 'bg-amber-900' : 'bg-amber-300/60 group-hover:bg-amber-200'}`}
                        />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Chord library */}
      {showChords && (
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
    </div>
  )
}
