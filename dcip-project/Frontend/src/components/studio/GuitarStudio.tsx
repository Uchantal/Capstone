import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface GuitarStudioHandle {
  captureImage(): string
  getFormat(): { label: string; width: number; height: number }
  captureAudio(): Promise<{ dataUrl: string; mimeType: string } | null>
}

// ---- WAV helpers ----

function encodeWavGuitar(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const len = buffer.length
  const dataLen = len * numCh * 2
  const ab = new ArrayBuffer(44 + dataLen)
  const dv = new DataView(ab)
  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); dv.setUint32(4, 36 + dataLen, true)
  str(8, 'WAVE'); str(12, 'fmt ')
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true)
  dv.setUint16(22, numCh, true); dv.setUint32(24, sr, true)
  dv.setUint32(28, sr * numCh * 2, true); dv.setUint16(32, numCh * 2, true); dv.setUint16(34, 16, true)
  str(36, 'data'); dv.setUint32(40, dataLen, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

async function renderProgressionToBlob(progression: ChordEntry[]): Promise<Blob> {
  const origin = progression[0].timestamp
  const lastTs = progression[progression.length - 1].timestamp
  const duration = (lastTs - origin) / 1000 + 1.5
  const sr = 44100
  const offCtx = new OfflineAudioContext(2, Math.ceil(duration * sr), sr)
  progression.forEach(({ chord, timestamp }) => {
    const baseT = (timestamp - origin) / 1000
    chord.freqs.forEach((freq, si) => {
      const t = baseT + si * 0.022
      const osc = offCtx.createOscillator()
      const filter = offCtx.createBiquadFilter()
      const gain = offCtx.createGain()
      osc.connect(filter); filter.connect(gain); gain.connect(offCtx.destination)
      osc.type = 'sawtooth'; osc.frequency.value = freq
      filter.type = 'lowpass'; filter.frequency.value = 2400; filter.Q.value = 1.2
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.22)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
      osc.start(t); osc.stop(t + 1.1)
    })
  })
  const rendered = await offCtx.startRendering()
  // Normalize to prevent clipping from overlapping chords
  const ch0 = rendered.getChannelData(0)
  const ch1 = rendered.getChannelData(1)
  let peak = 0
  for (let i = 0; i < ch0.length; i++) {
    if (Math.abs(ch0[i]) > peak) peak = Math.abs(ch0[i])
    if (Math.abs(ch1[i]) > peak) peak = Math.abs(ch1[i])
  }
  if (peak > 0.9) {
    const scale = 0.9 / peak
    for (let i = 0; i < ch0.length; i++) { ch0[i] *= scale; ch1[i] *= scale }
  }
  return encodeWavGuitar(rendered)
}

function blobToDataUrlGuitar(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ---- Types ----

interface Chord {
  name: string
  freqs: number[]
  strings: number[]       // [low E, A, D, G, B, high e]: -1=muted, 0=open, 1-12=fret
  baseFret?: number       // first visible fret row in diagram (default 1)
  barre?: { fret: number; fromString: number; toString: number }
}
interface ChordEntry { chord: Chord; timestamp: number }

// ---- Guitar note data ----
// Strings displayed top (high e) to bottom (low E), as you see a guitar lying flat

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const STRINGS = [
  { name: 'e', openNoteIdx: 4,  openFreq: 329.63, thickness: 1.5 },
  { name: 'B', openNoteIdx: 11, openFreq: 246.94, thickness: 2.0 },
  { name: 'G', openNoteIdx: 7,  openFreq: 196.00, thickness: 2.8 },
  { name: 'D', openNoteIdx: 2,  openFreq: 146.83, thickness: 3.8 },
  { name: 'A', openNoteIdx: 9,  openFreq: 110.00, thickness: 4.8 },
  { name: 'E', openNoteIdx: 4,  openFreq: 82.41,  thickness: 6.2 },
]

// Fret widths decrease toward the body (geometric ratio), frets 1-12
const FRET_WIDTHS = [72, 68, 64, 60, 57, 54, 51, 48, 45, 43, 41, 39]
const OPEN_W = 52
const STRING_H = 48
const FRET_MARKERS = new Set([3, 5, 7, 9, 12])

function noteAt(si: number, fret: number) {
  return ALL_NOTES[(STRINGS[si].openNoteIdx + fret) % 12]
}
function freqAt(si: number, fret: number) {
  return STRINGS[si].openFreq * Math.pow(2, fret / 12)
}

// ---- Chord library ----
// strings: [low E, A, D, G, B, high e]  — -1=muted(X), 0=open(O), 1-12=fret number

const CHORDS: Chord[] = [
  { name: 'Am',  strings: [-1, 0, 2, 2, 1, 0], freqs: [110.00, 164.81, 220.00, 261.63, 329.63] },
  { name: 'A',   strings: [-1, 0, 2, 2, 2, 0], freqs: [110.00, 164.81, 220.00, 277.18, 329.63] },
  { name: 'A7',  strings: [-1, 0, 2, 0, 2, 0], freqs: [110.00, 164.81, 220.00, 261.63, 311.13] },
  { name: 'Bm',  strings: [-1, 2, 4, 4, 3, 2], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 5 }, freqs: [123.47, 185.00, 246.94, 293.66, 369.99] },
  { name: 'B7',  strings: [-1, 2, 1, 2, 0, 2], freqs: [123.47, 246.94, 293.66, 329.63, 369.99] },
  { name: 'C',   strings: [-1, 3, 2, 0, 1, 0], freqs: [130.81, 164.81, 196.00, 261.63, 329.63] },
  { name: 'D',   strings: [-1, -1, 0, 2, 3, 2], freqs: [146.83, 220.00, 293.66, 369.99] },
  { name: 'Dm',  strings: [-1, -1, 0, 2, 3, 1], freqs: [146.83, 220.00, 293.66, 349.23] },
  { name: 'E',   strings: [0, 2, 2, 1, 0, 0],  freqs: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63] },
  { name: 'Em',  strings: [0, 2, 2, 0, 0, 0],  freqs: [82.41, 123.47, 164.81, 196.00, 246.94, 329.63] },
  { name: 'F',   strings: [1, 3, 3, 2, 1, 1],  barre: { fret: 1, fromString: 0, toString: 5 }, freqs: [174.61, 220.00, 261.63, 349.23, 440.00] },
  { name: 'G',   strings: [3, 2, 0, 0, 0, 3],  freqs: [98.00, 123.47, 196.00, 246.94, 392.00] },
  { name: 'G7',  strings: [3, 2, 0, 0, 0, 1],  freqs: [98.00, 123.47, 196.00, 246.94, 349.23] },
]

// ---- Chord Diagram (SVG, matches guitar wood aesthetic) ----

function ChordDiagram({ chord, onClick }: { chord: Chord; onClick: () => void }) {
  const W = 80, H = 118
  const numFrets = 4
  const lPad = 10, rPad = 10
  const oxY = 11       // center-y of open/muted indicators
  const fretTop = 22   // fretboard starts here
  const fretH = 72     // total grid height
  const fretSp = fretH / numFrets
  const strSp = (W - lPad - rPad) / 5   // spacing between strings

  const sx = (i: number) => lPad + i * strSp
  const fy = (rel: number) => fretTop + (rel - 0.5) * fretSp   // center of a relative fret row

  const base = chord.baseFret ?? 1
  const showNut = base === 1

  return (
    <button onClick={onClick}
      className="hover:brightness-125 active:scale-95 transition-all duration-100 focus:outline-none"
      title={chord.name}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* Card background — matches guitar wood */}
        <rect width={W} height={H} rx={6} fill="#2A0F00" />

        {/* Nut — thick gold bar when chord starts at fret 1 */}
        {showNut && <rect x={lPad} y={fretTop} width={W - lPad - rPad} height={3.5} rx={1} fill="#C8960C" />}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line key={i}
            x1={lPad} y1={fretTop + i * fretSp}
            x2={W - rPad} y2={fretTop + i * fretSp}
            stroke="rgba(200,150,12,0.28)" strokeWidth={0.8}
          />
        ))}

        {/* String lines — 6 strings, low E on left, high e on right */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i}
            x1={sx(i)} y1={fretTop}
            x2={sx(i)} y2={fretTop + fretH}
            stroke="rgba(200,150,12,0.45)"
            strokeWidth={i === 0 ? 1.8 : i === 5 ? 0.9 : 1.2}
          />
        ))}

        {/* Open (O) and muted (X) indicators at top */}
        {chord.strings.map((fret, i) => {
          const x = sx(i)
          if (fret === -1) return (
            <text key={i} x={x} y={oxY + 3} textAnchor="middle"
              fontSize={7} fontWeight="bold" fill="rgba(255,255,255,0.4)">x</text>
          )
          if (fret === 0) return (
            <circle key={i} cx={x} cy={oxY} r={3.2}
              fill="none" stroke="rgba(200,150,12,0.75)" strokeWidth={1.2} />
          )
          return null
        })}

        {/* Base fret label (when chord starts above fret 1) */}
        {!showNut && (
          <text x={W - 1} y={fretTop + fretSp * 0.6} textAnchor="end"
            fontSize={6.5} fill="rgba(200,150,12,0.65)" fontFamily="sans-serif">
            {base}fr
          </text>
        )}

        {/* Barre bar */}
        {chord.barre && (
          <rect
            x={sx(chord.barre.fromString) - 5}
            y={fy(chord.barre.fret - base + 1) - 6}
            width={sx(chord.barre.toString) - sx(chord.barre.fromString) + 10}
            height={12}
            rx={6}
            fill="#C8960C"
            opacity={0.9}
          />
        )}

        {/* Finger dots */}
        {chord.strings.map((fret, i) => {
          if (fret <= 0) return null
          const rel = fret - base + 1
          if (rel < 1 || rel > numFrets) return null
          // Skip if this position is covered by the barre bar
          if (chord.barre && chord.barre.fret === fret && i >= chord.barre.fromString && i <= chord.barre.toString) return null
          return <circle key={i} cx={sx(i)} cy={fy(rel)} r={5.5} fill="#C8960C" />
        })}

        {/* Chord name */}
        <text x={W / 2} y={H - 5} textAnchor="middle"
          fontSize={10} fontWeight="bold" fill="white" fontFamily="sans-serif">
          {chord.name}
        </text>
      </svg>
    </button>
  )
}

// ---- Web Audio ----

let _ctx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}
function playGuitarNote(freq: number, delay = 0) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  filter.type = 'lowpass'; filter.frequency.value = 2400; filter.Q.value = 1.2
  const t = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.18, t + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.22)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
  osc.start(t); osc.stop(t + 1.1)
}
function strum(chord: Chord) {
  chord.freqs.forEach((f, i) => playGuitarNote(f, i * 0.022))
}

// ---- Physical Fretboard Component ----

interface FretboardProps {
  activeCell: string | null
  onPlay: (freq: number, note: string, si: number, fret: number) => void
}

function Fretboard({ activeCell, onPlay }: FretboardProps) {
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)

  // Measure the card width and re-scale whenever it changes
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width))
    obs.observe(el)
    setContainerW(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  const naturalW = OPEN_W + FRET_WIDTHS.reduce((a, b) => a + b, 0)
  const scale     = containerW > 0 ? containerW / naturalW : 1

  const sOpenW      = OPEN_W * scale
  const sFretWidths = FRET_WIDTHS.map(w => w * scale)
  const totalW      = containerW > 0 ? containerW : naturalW
  const boardH      = STRINGS.length * STRING_H
  const headerH     = 28

  const fretLeftX = sFretWidths.map((_, fi) =>
    sOpenW + sFretWidths.slice(0, fi).reduce((a, b) => a + b, 0)
  )

  return (
    <div ref={wrapperRef} className="rounded-xl overflow-hidden w-full">
      {/* Fret numbers row */}
      <div className="relative" style={{ width: totalW, height: headerH, background: '#1E0E03' }}>
        <span className="absolute text-[10px] font-medium" style={{ left: sOpenW / 2, top: 6, transform: 'translateX(-50%)', color: '#6B5030' }}>open</span>
        {sFretWidths.map((fw, fi) => (
          <span key={fi} className="absolute text-[10px] font-medium" style={{
            left: fretLeftX[fi] + fw / 2, top: 6, transform: 'translateX(-50%)', color: '#6B5030'
          }}>
            {fi + 1}
          </span>
        ))}
      </div>

      {/* Fretboard neck */}
      <div className="relative" style={{ width: totalW, height: boardH, background: 'linear-gradient(to bottom, #2B1506 0%, #3A1E08 50%, #2B1506 100%)' }}>

        {/* Nut */}
        <div className="absolute rounded-sm" style={{ left: sOpenW - 6, top: 0, width: 8, height: boardH, background: '#F5F0E0', zIndex: 3 }} />

        {/* Fret wires */}
        {fretLeftX.map((lx, fi) => (
          <div key={fi} className="absolute" style={{ left: lx + sFretWidths[fi] - 2, top: 0, width: 3, height: boardH, background: 'linear-gradient(to bottom, #D4B870, #A08840, #D4B870)', zIndex: 3 }} />
        ))}

        {/* Fret position markers */}
        {sFretWidths.map((fw, fi) => {
          const fret = fi + 1
          if (!FRET_MARKERS.has(fret)) return null
          const mx = fretLeftX[fi] + fw / 2
          return (
            <div key={fi} className="absolute rounded-full" style={{
              left: mx - 7, top: boardH / 2 - 7, width: 14, height: 14,
              background: 'rgba(240,220,160,0.35)', border: '1px solid rgba(240,220,160,0.2)', zIndex: 2,
            }} />
          )
        })}

        {/* Strings and clickable zones */}
        {STRINGS.map((str, si) => {
          const cy = si * STRING_H + STRING_H / 2
          return (
            <div key={si}>
              {/* String line */}
              <div className="absolute" style={{
                left: 0, top: cy - str.thickness / 2, width: totalW, height: str.thickness, zIndex: 4,
                background: si < 3
                  ? `rgba(220,215,195,${0.75 + si * 0.03})`
                  : `rgba(195,185,155,${0.78 + (si - 3) * 0.03})`,
                pointerEvents: 'none',
              }} />

              {/* Open string click zone */}
              <button
                onClick={() => onPlay(str.openFreq, str.name, si, 0)}
                className="absolute flex items-center justify-center z-10 transition-colors"
                style={{ left: 0, top: si * STRING_H, width: sOpenW - 8, height: STRING_H, background: 'transparent' }}
                title={`${str.name} open`}
              >
                <span className="text-xs font-bold" style={{ color: activeCell === `${si}-0` ? '#C8960C' : 'rgba(200,180,120,0.6)' }}>
                  {str.name}
                </span>
              </button>

              {/* Fret click zones */}
              {sFretWidths.map((fw, fi) => {
                const fret = fi + 1
                const cellKey = `${si}-${fret}`
                const isActive = activeCell === cellKey
                return (
                  <button
                    key={fi}
                    onClick={() => onPlay(freqAt(si, fret), noteAt(si, fret), si, fret)}
                    title={`${noteAt(si, fret)} — string ${si + 1}, fret ${fret}`}
                    className="absolute flex items-center justify-center z-10 transition-opacity hover:bg-white/5"
                    style={{ left: fretLeftX[fi], top: si * STRING_H, width: fw, height: STRING_H, background: 'transparent' }}
                  >
                    {isActive && (
                      <div className="rounded-full" style={{
                        width: 24, height: 24, background: '#C8960C',
                        boxShadow: '0 0 10px rgba(200,150,12,0.7)', zIndex: 5,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Canvas export ----

function renderToCanvas(
  title: string, artist: string, key: string, capo: string, bpm: string,
  tuning: string, progression: ChordEntry[], notes: string,
): string {
  const W = 1920
  let H = 300
  if (progression.length > 0) H += 90 + Math.ceil(progression.length / 28) * 58
  if (notes) H += 60
  H = Math.max(1080, H + 80)

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#F9F7F4'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#C8960C'; ctx.fillRect(0, 0, W, 72)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('DCIP Guitar Studio', 40, 46)
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '13px sans-serif'
  ctx.fillText('Digital Creative Infrastructure Platform', W - 420, 46)

  ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 44px sans-serif'
  ctx.fillText(title || 'Untitled Composition', 40, 148)

  let y = 188
  if (artist) { ctx.fillStyle = '#555555'; ctx.font = '22px sans-serif'; ctx.fillText(`by ${artist}`, 40, y); y += 34 }

  const meta = [
    key && `Key of ${key}`,
    capo && capo !== '0' && `Capo ${capo}`,
    bpm && `${bpm} BPM`,
    tuning && tuning.split(' ')[0],
  ].filter(Boolean).join('   |   ')
  if (meta) { ctx.fillStyle = '#888888'; ctx.font = '16px sans-serif'; ctx.fillText(meta, 40, y); y += 28 }

  ctx.strokeStyle = '#C8960C'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(40, y + 4); ctx.lineTo(W - 40, y + 4); ctx.stroke(); y += 28

  if (progression.length > 0) {
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 15px sans-serif'
    ctx.fillText('Chord Progression', 40, y); y += 26
    const cW = 68, cH = 44, gap = 6, perRow = Math.floor((W - 80) / (cW + gap))
    progression.forEach(({ chord }, i) => {
      const col = i % perRow, row = Math.floor(i / perRow)
      const nx = 40 + col * (cW + gap), ny = y + row * (cH + gap)
      ctx.fillStyle = '#2A0F00'; ctx.fillRect(nx, ny, cW, cH)
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(chord.name, nx + cW / 2, ny + 28); ctx.textAlign = 'left'
    })
    y += Math.ceil(progression.length / perRow) * (cH + gap) + 20
  }

  if (notes) { ctx.fillStyle = '#555555'; ctx.font = 'italic 14px sans-serif'; ctx.fillText('Notes: ' + notes.substring(0, 160), 40, y + 16) }

  ctx.fillStyle = '#C8960C'; ctx.fillRect(0, H - 40, W, 40)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('Created with DCIP Guitar Studio', 40, H - 14)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px sans-serif'
  ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - 280, H - 14)

  return canvas.toDataURL('image/png')
}

// ---- Constants ----

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const TUNINGS = ['Standard (EADGBe)', 'Drop D (DADGBe)', 'Open G (DGDGBd)', 'Open D (DADf#Ad)', 'DADGAD', 'Half Step Down']

// ---- Main component ----

const GuitarStudio = forwardRef<GuitarStudioHandle, { onDirty: () => void }>(({ onDirty }, ref) => {
  const [title,       setTitle]       = useState('')
  const [artist,      setArtist]      = useState('')
  const [key,         setKey]         = useState('C')
  const [capo,        setCapo]        = useState('0')
  const [bpm,         setBpm]         = useState('')
  const [tuning,      setTuning]      = useState('Standard (EADGBe)')
  const [notes,       setNotes]       = useState('')
  const [progression, setProgression] = useState<ChordEntry[]>([])
  const [recording,   setRecording]   = useState(false)
  const [playing,     setPlaying]     = useState(false)
  const [activeCell,  setActiveCell]  = useState<string | null>(null)
  const [lastNote,    setLastNote]    = useState<string>('')

  const recordingRef   = useRef(recording)
  recordingRef.current = recording
  const recordingStart = useRef<number>(0)

  function handleNotePlay(freq: number, note: string, si: number, fret: number) {
    playGuitarNote(freq)
    const cellKey = `${si}-${fret}`
    setActiveCell(cellKey)
    setLastNote(`${note} — string ${si + 1}${fret === 0 ? ' (open)' : `, fret ${fret}`}`)
    setTimeout(() => setActiveCell(k => k === cellKey ? null : k), 400)
  }

  const handleChordClick = useCallback((chord: Chord) => {
    strum(chord)
    if (!recordingRef.current) {
      recordingStart.current = Date.now()
      recordingRef.current = true
      setRecording(true)
    }
    const timestamp = Date.now() - recordingStart.current
    setProgression(prev => [...prev, { chord, timestamp }])
    onDirty()
  }, [onDirty])

  function playProgression() {
    if (playing || progression.length === 0) return
    setPlaying(true)
    const origin = progression[0].timestamp
    progression.forEach(({ chord, timestamp }, i) => {
      setTimeout(() => {
        strum(chord)
        if (i === progression.length - 1) setTimeout(() => setPlaying(false), 700)
      }, timestamp - origin)
    })
  }

  useImperativeHandle(ref, () => ({
    captureImage: () => renderToCanvas(title, artist, key, capo, bpm, tuning, progression, notes),
    getFormat: () => ({ label: 'Guitar Composition', width: 1920, height: 1080 }),
    captureAudio: async () => {
      if (progression.length === 0) return null
      const blob = await renderProgressionToBlob(progression)
      const dataUrl = await blobToDataUrlGuitar(blob)
      return { dataUrl, mimeType: 'audio/wav' }
    },
  }), [progression, title, artist, key, capo, bpm, tuning, notes])

  const field = 'border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary bg-white focus:outline-none focus:border-primary'
  const lbl   = 'text-[10px] uppercase tracking-wide text-text-muted font-medium mb-1 block'

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-warm">

      {/* Metadata row */}
      <div className="flex-shrink-0 bg-white border-b border-surface-border px-6 py-3 flex items-end gap-4 flex-wrap">
        <div><label htmlFor="gs-title" className={lbl}>Title</label>
          <input id="gs-title" name="gs-title" className={`${field} w-48`} placeholder="Composition title" value={title} onChange={e => { setTitle(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="gs-artist" className={lbl}>Artist</label>
          <input id="gs-artist" name="gs-artist" className={`${field} w-36`} placeholder="Your name" value={artist} onChange={e => { setArtist(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="gs-key" className={lbl}>Key</label>
          <select id="gs-key" name="gs-key" className={`${field} w-20`} value={key} onChange={e => { setKey(e.target.value); onDirty() }}>
            {KEYS.map(k => <option key={k}>{k}</option>)}</select></div>
        <div><label htmlFor="gs-capo" className={lbl}>Capo</label>
          <input id="gs-capo" name="gs-capo" type="number" min={0} max={12} className={`${field} w-16`} value={capo} onChange={e => { setCapo(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="gs-bpm" className={lbl}>BPM</label>
          <input id="gs-bpm" name="gs-bpm" type="number" min={40} max={300} className={`${field} w-20`} placeholder="120" value={bpm} onChange={e => { setBpm(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="gs-tuning" className={lbl}>Tuning</label>
          <select id="gs-tuning" name="gs-tuning" className={`${field} w-48`} value={tuning} onChange={e => { setTuning(e.target.value); onDirty() }}>
            {TUNINGS.map(t => <option key={t}>{t}</option>)}</select></div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

        {/* Fretboard + Chord Library side by side */}
        <div className="flex gap-5 items-start">

          {/* Physical fretboard */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-text-primary font-bold text-sm">Guitar Fretboard</p>
                <p className="text-text-muted text-xs mt-1">
                  Click any string at any fret to hear that note. String names on the left are open strings.
                </p>
              </div>
              {lastNote && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full flex-shrink-0">
                  {lastNote}
                </span>
              )}
            </div>
            <Fretboard activeCell={activeCell} onPlay={handleNotePlay} />
            <div className="mt-3 flex items-center gap-4 text-[10px] text-text-muted">
              <span>Fret markers at positions 3, 5, 7, 9, 12</span>
              <span>Standard tuning: e B G D A E</span>
            </div>
          </div>

          {/* Chord Library — right panel, always visible beside the neck */}
          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm flex-shrink-0" style={{ width: 256 }}>
            <p className="text-text-primary font-bold text-sm mb-1">Chord Library</p>
            <p className="text-text-muted text-[10px] mb-4 leading-relaxed">
              Click a chord to strum it. Turn Recording on to add each chord to your progression.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CHORDS.map(chord => (
                <ChordDiagram key={chord.name} chord={chord} onClick={() => handleChordClick(chord)} />
              ))}
            </div>
          </div>

        </div>

        {/* Chord progression recorder */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-primary font-bold text-sm">Chord Progression</p>
              <p className="text-text-muted text-xs mt-0.5">
                {progression.length === 0
                  ? 'Start Recording then click chords to build your progression'
                  : `${progression.length} chord${progression.length > 1 ? 's' : ''} — playback preserves your recorded timing`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (!recording) recordingStart.current = Date.now(); setRecording(r => !r) }}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${recording ? 'bg-accent text-white' : 'bg-primary text-white hover:bg-primary-dark'}`}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button onClick={playProgression} disabled={progression.length === 0 || playing}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-surface-border text-text-secondary hover:bg-surface-warm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {playing ? 'Playing...' : 'Play Back'}
              </button>
              <button onClick={() => { setProgression(p => p.slice(0, -1)); onDirty() }} disabled={progression.length === 0}
                className="text-xs px-3 py-2 rounded-lg border border-surface-border text-text-muted hover:bg-surface-warm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Undo
              </button>
              <button onClick={() => { setProgression([]); onDirty() }} disabled={progression.length === 0}
                className="text-xs px-3 py-2 rounded-lg border border-surface-border text-accent hover:bg-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Clear
              </button>
            </div>
          </div>
          {progression.length === 0 ? (
            <div className="h-16 flex items-center justify-center border-2 border-dashed border-surface-border rounded-xl">
              <p className="text-text-muted text-sm">Click "Start Recording" then click chord buttons above</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-2 min-h-[52px]">
              {progression.map((entry, i) => (
                <div key={i} className="flex flex-col items-center justify-center rounded-xl text-white font-bold select-none shadow-sm"
                  style={{ background: '#2A0F00', border: '1px solid rgba(200,150,12,0.4)', width: 56, height: 52 }}>
                  <span className="text-[9px] font-normal leading-none" style={{ color: 'rgba(200,150,12,0.7)' }}>{i + 1}</span>
                  <span className="text-sm leading-tight" style={{ color: '#C8960C' }}>{entry.chord.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session notes */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
          <label htmlFor="gs-notes" className="text-text-primary font-bold text-sm block mb-2">Session Notes</label>
          <textarea id="gs-notes" name="gs-notes"
            className="w-full border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary bg-surface-warm/50 focus:outline-none focus:border-primary resize-none"
            rows={2} placeholder="Ideas, feel, tempo notes..."
            value={notes} onChange={e => { setNotes(e.target.value); onDirty() }} />
        </div>

      </div>
    </div>
  )
})

GuitarStudio.displayName = 'GuitarStudio'
export default GuitarStudio
