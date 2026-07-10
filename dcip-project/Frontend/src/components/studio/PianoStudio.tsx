import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface PianoStudioHandle {
  captureImage(): string
  getFormat(): { label: string; width: number; height: number }
  captureAudio(): Promise<{ dataUrl: string; mimeType: string } | null>
}

interface PianoNote {
  name: string
  baseName: string
  freq: number
  isBlack: boolean
}

const NOTES: PianoNote[] = [
  { name: 'C3',  baseName: 'C',  freq: 130.81, isBlack: false },
  { name: 'C#3', baseName: 'C#', freq: 138.59, isBlack: true  },
  { name: 'D3',  baseName: 'D',  freq: 146.83, isBlack: false },
  { name: 'D#3', baseName: 'D#', freq: 155.56, isBlack: true  },
  { name: 'E3',  baseName: 'E',  freq: 164.81, isBlack: false },
  { name: 'F3',  baseName: 'F',  freq: 174.61, isBlack: false },
  { name: 'F#3', baseName: 'F#', freq: 185.00, isBlack: true  },
  { name: 'G3',  baseName: 'G',  freq: 196.00, isBlack: false },
  { name: 'G#3', baseName: 'G#', freq: 207.65, isBlack: true  },
  { name: 'A3',  baseName: 'A',  freq: 220.00, isBlack: false },
  { name: 'A#3', baseName: 'A#', freq: 233.08, isBlack: true  },
  { name: 'B3',  baseName: 'B',  freq: 246.94, isBlack: false },
  { name: 'C4',  baseName: 'C',  freq: 261.63, isBlack: false },
  { name: 'C#4', baseName: 'C#', freq: 277.18, isBlack: true  },
  { name: 'D4',  baseName: 'D',  freq: 293.66, isBlack: false },
  { name: 'D#4', baseName: 'D#', freq: 311.13, isBlack: true  },
  { name: 'E4',  baseName: 'E',  freq: 329.63, isBlack: false },
  { name: 'F4',  baseName: 'F',  freq: 349.23, isBlack: false },
  { name: 'F#4', baseName: 'F#', freq: 369.99, isBlack: true  },
  { name: 'G4',  baseName: 'G',  freq: 392.00, isBlack: false },
  { name: 'G#4', baseName: 'G#', freq: 415.30, isBlack: true  },
  { name: 'A4',  baseName: 'A',  freq: 440.00, isBlack: false },
  { name: 'A#4', baseName: 'A#', freq: 466.16, isBlack: true  },
  { name: 'B4',  baseName: 'B',  freq: 493.88, isBlack: false },
  { name: 'C5',  baseName: 'C',  freq: 523.25, isBlack: false },
  { name: 'C#5', baseName: 'C#', freq: 554.37, isBlack: true  },
  { name: 'D5',  baseName: 'D',  freq: 587.33, isBlack: false },
  { name: 'D#5', baseName: 'D#', freq: 622.25, isBlack: true  },
  { name: 'E5',  baseName: 'E',  freq: 659.25, isBlack: false },
  { name: 'F5',  baseName: 'F',  freq: 698.46, isBlack: false },
  { name: 'F#5', baseName: 'F#', freq: 739.99, isBlack: true  },
  { name: 'G5',  baseName: 'G',  freq: 783.99, isBlack: false },
  { name: 'G#5', baseName: 'G#', freq: 830.61, isBlack: true  },
  { name: 'A5',  baseName: 'A',  freq: 880.00, isBlack: false },
  { name: 'A#5', baseName: 'A#', freq: 932.33, isBlack: true  },
  { name: 'B5',  baseName: 'B',  freq: 987.77, isBlack: false },
]

const WHITE_KEYS = NOTES.filter(n => !n.isBlack)
const BLACK_KEYS = NOTES.filter(n => n.isBlack)

// Black key X offset within one octave as fraction of white key width
const BLACK_OFFSETS: Record<string, number> = {
  'C#': 0.60, 'D#': 1.68, 'F#': 3.62, 'G#': 4.65, 'A#': 5.68,
}

const NOTE_COLORS: Record<string, string> = {
  'C': '#C8960C', 'C#': '#8B6508',
  'D': '#D62828', 'D#': '#A01A1A',
  'E': '#2D6A4F',
  'F': '#1A6B8A', 'F#': '#104E6A',
  'G': '#6B3AA8', 'G#': '#4A2080',
  'A': '#1A7A6A', 'A#': '#0F5A4E',
  'B': '#555555',
}

// QWERTY: middle row (A-L) = white notes C4-D5; top row (W E T Y U O P) = black notes
const KEY_MAP: Record<string, string> = {
  'a': 'C4',  'w': 'C#4',
  's': 'D4',  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',  't': 'F#4',
  'g': 'G4',  'y': 'G#4',
  'h': 'A4',  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',  'o': 'C#5',
  'l': 'D5',  'p': 'D#5',
}

const NOTE_TO_KEY = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, n]) => [n, k.toUpperCase()])
)

let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playNoteSound(freq: number) {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.18)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 1.4)
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const len = buffer.length
  const dataLen = len * numCh * 2   // 16-bit PCM
  const ab = new ArrayBuffer(44 + dataLen)
  const dv = new DataView(ab)
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  str(0, 'RIFF'); dv.setUint32(4, 36 + dataLen, true)
  str(8, 'WAVE'); str(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true)            // PCM
  dv.setUint16(22, numCh, true)
  dv.setUint32(24, sr, true)
  dv.setUint32(28, sr * numCh * 2, true)
  dv.setUint16(32, numCh * 2, true)
  dv.setUint16(34, 16, true)
  str(36, 'data'); dv.setUint32(40, dataLen, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

async function renderMelodyToBlob(sequence: SequenceEntry[]): Promise<Blob> {
  const origin = sequence[0].timestamp
  const lastTs  = sequence[sequence.length - 1].timestamp
  const duration = (lastTs - origin) / 1000 + 1.8
  const sr = 44100
  const offCtx = new OfflineAudioContext(1, Math.ceil(duration * sr), sr)
  sequence.forEach(({ note, timestamp }) => {
    const t = (timestamp - origin) / 1000
    const osc  = offCtx.createOscillator()
    const gain = offCtx.createGain()
    osc.connect(gain); gain.connect(offCtx.destination)
    osc.type = 'triangle'
    osc.frequency.value = note.freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.35, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.18)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
    osc.start(t); osc.stop(t + 1.4)
  })
  const rendered = await offCtx.startRendering()
  return encodeWav(rendered)
}

async function exportMelodyAsWav(sequence: SequenceEntry[], title: string): Promise<void> {
  if (sequence.length === 0) return
  const blob = await renderMelodyToBlob(sequence)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(title || 'melody').replace(/\s+/g, '-')}.wav`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function renderToCanvas(
  title: string, composer: string, key: string, bpm: string,
  style: string, sequence: PianoNote[], notes: string,
): string {
  const W = 1920, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#F9F7F4'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(0, 0, W, 72)
  ctx.fillStyle = '#C8960C'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('DCIP Piano Studio', 40, 46)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px sans-serif'
  ctx.fillText('Digital Creative Infrastructure Platform', W - 420, 46)

  ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 44px sans-serif'
  ctx.fillText(title || 'Untitled Composition', 40, 148)

  let y = 188
  if (composer) { ctx.fillStyle = '#555555'; ctx.font = '22px sans-serif'; ctx.fillText(`by ${composer}`, 40, y); y += 34 }

  const meta = [key && `Key of ${key}`, bpm && `${bpm} BPM`, style].filter(Boolean).join('   |   ')
  if (meta) { ctx.fillStyle = '#888888'; ctx.font = '16px sans-serif'; ctx.fillText(meta, 40, y); y += 28 }

  ctx.strokeStyle = '#C8960C'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(40, y + 4); ctx.lineTo(W - 40, y + 4); ctx.stroke(); y += 30

  if (sequence.length > 0) {
    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 15px sans-serif'
    ctx.fillText('Recorded Melody Sequence', 40, y); y += 28
    const nW = 64, nH = 52, gap = 8
    const perRow = Math.floor((W - 80) / (nW + gap))
    sequence.forEach((note, i) => {
      const col = i % perRow, row = Math.floor(i / perRow)
      const nx = 40 + col * (nW + gap), ny = y + row * (nH + gap)
      ctx.fillStyle = NOTE_COLORS[note.baseName] ?? '#888'; ctx.fillRect(nx, ny, nW, nH)
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(note.name, nx + nW / 2, ny + 32); ctx.textAlign = 'left'
    })
    y += Math.ceil(sequence.length / perRow) * (nH + gap) + 20
  } else {
    ctx.fillStyle = '#888888'; ctx.font = 'italic 16px sans-serif'; ctx.fillText('No melody recorded.', 40, y); y += 32
  }

  if (notes) {
    ctx.strokeStyle = '#E8E4DC'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(40, y + 4); ctx.lineTo(W - 40, y + 4); ctx.stroke(); y += 24
    ctx.fillStyle = '#555555'; ctx.font = 'italic 15px sans-serif'
    ctx.fillText('Notes: ' + notes.substring(0, 200), 40, y)
  }

  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(0, H - 40, W, 40)
  ctx.fillStyle = '#C8960C'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('Created with DCIP Piano Studio', 40, H - 14)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px sans-serif'
  ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - 280, H - 14)

  return canvas.toDataURL('image/png')
}

const W_KEY    = 62   // white key width px
const W_HEIGHT = 200  // white key height px
const B_KEY    = 38   // black key width px
const B_HEIGHT = 124  // black key height px

function getBlackKeyLeft(note: PianoNote): number {
  const octave = parseInt(note.name.slice(-1)) - 3
  const offset = BLACK_OFFSETS[note.baseName] ?? 0
  return octave * 7 * W_KEY + offset * W_KEY - B_KEY / 2
}

interface KeyboardProps {
  activeNote: string | null
  onPlay: (note: PianoNote) => void
}

function Keyboard({ activeNote, onPlay }: KeyboardProps) {
  const totalW = WHITE_KEYS.length * W_KEY
  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative" style={{ width: totalW, height: W_HEIGHT }}>

        {/* White keys */}
        {WHITE_KEYS.map((note, i) => {
          const kbKey = NOTE_TO_KEY[note.name]
          const isActive = activeNote === note.name
          return (
            <button
              key={note.name}
              onMouseDown={() => onPlay(note)}
              className={`absolute border border-surface-border rounded-b-xl select-none transition-colors duration-75 ${
                isActive ? 'bg-primary/30' : 'bg-white hover:bg-primary/10 active:bg-primary/30'
              }`}
              style={{ left: i * W_KEY, top: 0, width: W_KEY - 1, height: W_HEIGHT }}
            >
              {kbKey && (
                <span className="absolute top-4 left-0 right-0 text-center text-xs font-bold text-primary/40">
                  {kbKey}
                </span>
              )}
              <span className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-text-muted font-medium">
                {note.name}
              </span>
            </button>
          )
        })}

        {/* Black keys */}
        {BLACK_KEYS.map(note => {
          const kbKey = NOTE_TO_KEY[note.name]
          const isActive = activeNote === note.name
          return (
            <button
              key={note.name}
              onMouseDown={() => onPlay(note)}
              className={`absolute z-10 rounded-b-lg select-none transition-colors duration-75 flex flex-col items-center justify-end pb-2 ${
                isActive ? 'bg-primary' : 'bg-text-primary hover:bg-primary-dark active:bg-primary'
              }`}
              style={{ left: getBlackKeyLeft(note), top: 0, width: B_KEY, height: B_HEIGHT }}
            >
              {kbKey && (
                <span className="text-[9px] font-bold text-white/40">{kbKey}</span>
              )}
            </button>
          )
        })}

      </div>
    </div>
  )
}

const SHORTCUT_LEGEND = [
  { key: 'A', note: 'C4',  isBlack: false },
  { key: 'W', note: 'C#4', isBlack: true  },
  { key: 'S', note: 'D4',  isBlack: false },
  { key: 'E', note: 'D#4', isBlack: true  },
  { key: 'D', note: 'E4',  isBlack: false },
  { key: 'F', note: 'F4',  isBlack: false },
  { key: 'T', note: 'F#4', isBlack: true  },
  { key: 'G', note: 'G4',  isBlack: false },
  { key: 'Y', note: 'G#4', isBlack: true  },
  { key: 'H', note: 'A4',  isBlack: false },
  { key: 'U', note: 'A#4', isBlack: true  },
  { key: 'J', note: 'B4',  isBlack: false },
  { key: 'K', note: 'C5',  isBlack: false },
  { key: 'O', note: 'C#5', isBlack: true  },
  { key: 'L', note: 'D5',  isBlack: false },
  { key: 'P', note: 'D#5', isBlack: true  },
]

const KEYS_LIST   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const STYLES_LIST = ['Classical', 'Jazz', 'Gospel', 'Pop', 'Blues', 'Contemporary', 'Neo-soul', 'Ambient', 'Ragtime', 'Other']
const TIME_SIGS   = ['4/4', '3/4', '6/8', '2/4', '12/8', '5/4', '7/8']

interface SequenceEntry {
  note: PianoNote
  timestamp: number  // ms from the moment recording started
}

const PianoStudio = forwardRef<PianoStudioHandle, { onDirty: () => void }>(({ onDirty }, ref) => {
  const [title,      setTitle]      = useState('')
  const [composer,   setComposer]   = useState('')
  const [key,        setKey]        = useState('C')
  const [bpm,        setBpm]        = useState('')
  const [timeSig,    setTimeSig]    = useState('4/4')
  const [style,      setStyle]      = useState('Classical')
  const [notes,      setNotes]      = useState('')
  const [sequence,   setSequence]   = useState<SequenceEntry[]>([])
  const [recording,  setRecording]  = useState(false)
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [playing,    setPlaying]    = useState(false)
  const [exporting,  setExporting]  = useState(false)

  // Ref so keyboard handler reads current recording state without re-registering on each toggle.
  const recordingRef      = useRef(recording)
  recordingRef.current    = recording
  const recordingStart    = useRef<number>(0)  // wall-clock time when recording began

  const handlePlay = useCallback((note: PianoNote) => {
    playNoteSound(note.freq)
    setActiveNote(note.name)
    setTimeout(() => setActiveNote(n => n === note.name ? null : n), 220)
    if (!recordingRef.current) return
    const timestamp = Date.now() - recordingStart.current
    setSequence(prev => [...prev, { note, timestamp }])
    onDirty()
  }, [onDirty])

  // Bind laptop keyboard keys to piano notes
  useEffect(() => {
    const pressed = new Set<string>()

    function onKeyDown(e: KeyboardEvent) {
      // Do not interfere when the user is typing in a text field
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const noteName = KEY_MAP[e.key.toLowerCase()]
      if (!noteName) return
      if (pressed.has(e.key.toLowerCase())) return  // suppress key-repeat
      e.preventDefault()
      pressed.add(e.key.toLowerCase())
      const note = NOTES.find(n => n.name === noteName)
      if (note) handlePlay(note)
    }

    function onKeyUp(e: KeyboardEvent) {
      pressed.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [handlePlay])

  function playSequence() {
    if (playing || sequence.length === 0) return
    setPlaying(true)
    const origin = sequence[0].timestamp
    sequence.forEach(({ note, timestamp }, i) => {
      const delay = timestamp - origin   // reproduce exact recorded timing
      setTimeout(() => {
        playNoteSound(note.freq)
        setActiveNote(note.name)
        setTimeout(() => setActiveNote(n => n === note.name ? null : n), 200)
        if (i === sequence.length - 1) setTimeout(() => setPlaying(false), 400)
      }, delay)
    })
  }

  useImperativeHandle(ref, () => ({
    captureImage: () => renderToCanvas(title, composer, key, bpm, style, sequence.map(s => s.note), notes),
    getFormat: () => ({ label: 'Piano Composition', width: 1920, height: 1080 }),
    captureAudio: async () => {
      if (sequence.length === 0) return null
      const blob = await renderMelodyToBlob(sequence)
      const dataUrl = await blobToDataUrl(blob)
      return { dataUrl, mimeType: 'audio/wav' }
    },
  }), [sequence, title, composer, key, bpm, style, notes])

  const field = 'border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary bg-white focus:outline-none focus:border-primary'
  const lbl   = 'text-[10px] uppercase tracking-wide text-text-muted font-medium mb-1 block'

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-warm">

      {/* Compact metadata row */}
      <div className="flex-shrink-0 bg-white border-b border-surface-border px-3 sm:px-6 py-3 flex items-end gap-3 sm:gap-4 flex-wrap">
        <div>
          <label htmlFor="ps-title" className={lbl}>Title</label>
          <input id="ps-title" name="ps-title" className={`${field} w-56`} placeholder="Composition title" value={title} onChange={e => { setTitle(e.target.value); onDirty() }} />
        </div>
        <div>
          <label htmlFor="ps-composer" className={lbl}>Composer</label>
          <input id="ps-composer" name="ps-composer" className={`${field} w-40`} placeholder="Your name" value={composer} onChange={e => { setComposer(e.target.value); onDirty() }} />
        </div>
        <div>
          <label htmlFor="ps-key" className={lbl}>Key</label>
          <select id="ps-key" name="ps-key" className={`${field} w-20`} value={key} onChange={e => { setKey(e.target.value); onDirty() }}>
            {KEYS_LIST.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ps-bpm" className={lbl}>BPM</label>
          <input id="ps-bpm" name="ps-bpm" type="number" min={40} max={300} className={`${field} w-20`} placeholder="120" value={bpm} onChange={e => { setBpm(e.target.value); onDirty() }} />
        </div>
        <div>
          <label htmlFor="ps-time" className={lbl}>Time</label>
          <select id="ps-time" name="ps-time" className={`${field} w-20`} value={timeSig} onChange={e => { setTimeSig(e.target.value); onDirty() }}>
            {TIME_SIGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ps-style" className={lbl}>Style</label>
          <select id="ps-style" name="ps-style" className={`${field} w-32`} value={style} onChange={e => { setStyle(e.target.value); onDirty() }}>
            {STYLES_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

        {/* Piano keyboard */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-text-primary font-bold text-sm">Piano Keyboard</p>
              <p className="text-text-muted text-xs mt-1">
                C3 to B5  |  3 octaves  |  click keys with your mouse, or play using your laptop keyboard
              </p>
            </div>
            <div className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              recording
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-surface-warm border-surface-border text-text-muted'
            }`}>
              {recording ? 'Recording' : 'Listening'}
            </div>
          </div>

          <Keyboard activeNote={activeNote} onPlay={handlePlay} />

          {/* Laptop keyboard legend */}
          <div className="mt-5 pt-4 border-t border-surface-border">
            <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-2">
              Laptop keyboard shortcuts  (middle octave  C4 to D5)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SHORTCUT_LEGEND.map(({ key: k, note: n, isBlack }) => (
                <div
                  key={k}
                  className={`flex items-center gap-1 rounded px-2 py-1 border ${
                    isBlack
                      ? 'bg-text-primary border-text-primary'
                      : 'bg-surface-warm border-surface-border'
                  }`}
                >
                  <span className="text-[10px] font-bold text-primary">{k}</span>
                  <span className={`text-[10px] ${isBlack ? 'text-white/60' : 'text-text-muted'}`}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Melody sequence */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-primary font-bold text-sm">Melody Sequence</p>
              <p className="text-text-muted text-xs mt-0.5">
                {sequence.length === 0
                  ? 'Click Start Recording, then play keys with your mouse or keyboard'
                  : `${sequence.length} note${sequence.length > 1 ? 's' : ''} recorded`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!recording) recordingStart.current = Date.now()
                  setRecording(r => !r)
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                  recording
                    ? 'bg-accent text-white hover:bg-accent/80'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button
                onClick={playSequence}
                disabled={sequence.length === 0 || playing}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-surface-border text-text-secondary hover:bg-surface-warm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {playing ? 'Playing...' : 'Play Back'}
              </button>
              <button
                onClick={async () => {
                  setExporting(true)
                  try { await exportMelodyAsWav(sequence, title) }
                  finally { setExporting(false) }
                }}
                disabled={sequence.length === 0 || exporting}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-secondary text-secondary hover:bg-secondary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting ? 'Rendering...' : 'Export Audio (.wav)'}
              </button>
              <button
                onClick={() => { setSequence(prev => prev.slice(0, -1)); onDirty() }}
                disabled={sequence.length === 0}
                className="text-xs px-3 py-2 rounded-lg border border-surface-border text-text-muted hover:bg-surface-warm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={() => { setSequence([]); onDirty() }}
                disabled={sequence.length === 0}
                className="text-xs px-3 py-2 rounded-lg border border-surface-border text-accent hover:bg-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>

          {sequence.length === 0 ? (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-surface-border rounded-xl">
              <p className="text-text-muted text-sm">Click "Start Recording" then play the keyboard above</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 min-h-[80px] p-2">
              {sequence.map((entry, i) => (
                <div
                  key={i}
                  title={`Note ${i + 1}: ${entry.note.name}`}
                  className="flex flex-col items-center justify-center rounded-xl text-white font-bold select-none shadow-sm"
                  style={{ background: NOTE_COLORS[entry.note.baseName] ?? '#888', width: 56, height: 56 }}
                >
                  <span className="text-[9px] opacity-60 font-normal leading-none">{i + 1}</span>
                  <span className="text-sm leading-tight">{entry.note.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composition notes */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <label htmlFor="ps-notes" className="text-text-primary font-bold text-sm block mb-3">
            Composition Notes
          </label>
          <textarea
            id="ps-notes"
            name="ps-notes"
            className="w-full border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary bg-surface-warm/50 focus:outline-none focus:border-primary resize-none"
            rows={4}
            placeholder="Describe your piece -- the feeling, the story, which sections to develop, what inspired you..."
            value={notes}
            onChange={e => { setNotes(e.target.value); onDirty() }}
          />
        </div>

      </div>
    </div>
  )
})

PianoStudio.displayName = 'PianoStudio'
export default PianoStudio
