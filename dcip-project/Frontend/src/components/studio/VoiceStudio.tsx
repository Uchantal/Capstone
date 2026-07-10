import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface VoiceStudioHandle {
  captureImage(): string
  getFormat(): { label: string; width: number; height: number }
  captureAudio(): Promise<{ dataUrl: string; mimeType: string } | null>
}

interface Take {
  id: string
  name: string
  blob: Blob
  url: string
  durationSec: number
  mimeType: string
}

interface SongSection {
  id: string
  type: string
  vocalDirection: string
  lyrics: string
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
}
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10]

function getScale(root: string, type: 'major' | 'minor'): string[] {
  const norm = root.replace('Db','C#').replace('Eb','D#').replace('Gb','F#').replace('Ab','G#').replace('Bb','A#')
  const idx = ALL_NOTES.indexOf(norm)
  return (type === 'major' ? MAJOR_STEPS : MINOR_STEPS).map(s => ALL_NOTES[(idx + s) % 12])
}

// Web Audio — pitch pipe tones only
let _ptx: AudioContext | null = null
function getPtx(): AudioContext {
  if (!_ptx) _ptx = new AudioContext()
  if (_ptx.state === 'suspended') _ptx.resume()
  return _ptx
}
function playPitchTone(freq: number) {
  const ctx = getPtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'; osc.frequency.value = freq
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.22, t + 0.04)
  gain.gain.setValueAtTime(0.22, t + 1.05)
  gain.gain.linearRampToValueAtTime(0, t + 1.2)
  osc.start(t); osc.stop(t + 1.2)
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function bestMimeType(): string {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function fileExt(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

// Draws idle animation when inactive, live waveform/spectrum when a mic analyser is connected
type VisualizerMode = 'waveform' | 'spectrum'

interface WaveformCanvasProps {
  analyserRef: React.RefObject<AnalyserNode | null>
  isLive: boolean
  mode: VisualizerMode
}

function WaveformCanvas({ analyserRef, isLive, mode }: WaveformCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const frameRef    = useRef<number>(0)
  const modeRef     = useRef(mode)
  modeRef.current   = mode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    cancelAnimationFrame(frameRef.current)

    if (!isLive) {
      let phase = 0
      const idle = () => {
        frameRef.current = requestAnimationFrame(idle)
        ctx.fillStyle = '#1A1A1A'; ctx.fillRect(0, 0, W, H)
        ctx.strokeStyle = 'rgba(200,150,12,0.06)'; ctx.lineWidth = 1
        for (let y = H / 4; y < H; y += H / 4) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
        }
        phase += 0.015
        ctx.strokeStyle = 'rgba(200,150,12,0.28)'; ctx.lineWidth = 1.5; ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.sin((x / W) * 6 * Math.PI + phase) * 3
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.strokeStyle = 'rgba(200,150,12,0.1)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
      }
      idle()
    } else {
      const draw = () => {
        frameRef.current = requestAnimationFrame(draw)
        const analyser = analyserRef.current
        if (!analyser) return
        const bufLen = analyser.frequencyBinCount
        const data = new Uint8Array(bufLen)

        ctx.fillStyle = '#1A1A1A'; ctx.fillRect(0, 0, W, H)

        if (modeRef.current === 'waveform') {
          analyser.getByteTimeDomainData(data)
          ctx.strokeStyle = 'rgba(200,150,12,0.07)'; ctx.lineWidth = 1
          for (let y = H / 4; y < H; y += H / 4) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
          }
          ctx.strokeStyle = 'rgba(200,150,12,0.15)'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
          ctx.strokeStyle = '#C8960C'; ctx.lineWidth = 2
          ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(200,150,12,0.4)'; ctx.beginPath()
          const sw = W / bufLen; let x = 0
          for (let i = 0; i < bufLen; i++) {
            const y = (data[i] / 128.0) * (H / 2)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            x += sw
          }
          ctx.lineTo(W, H / 2); ctx.stroke(); ctx.shadowBlur = 0
        } else {
          analyser.getByteFrequencyData(data)
          const bars = Math.min(bufLen, 120)
          const bw = (W / bars) - 1
          for (let i = 0; i < bars; i++) {
            const val = data[i] / 255
            const bh = val * H * 0.92
            const r = Math.round(45 + (200 - 45) * val)
            const g = Math.round(106 + (150 - 106) * (1 - val))
            const b = Math.round(79 * (1 - val) + 12 * val)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(i * (bw + 1), H - bh, bw, bh)
          }
        }
      }
      draw()
    }

    return () => cancelAnimationFrame(frameRef.current)
  }, [isLive, analyserRef])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1A1A1A' }}>
      <canvas ref={canvasRef} width={1200} height={200} className="w-full block" style={{ height: 120 }} />
    </div>
  )
}

interface PitchPipeProps { selectedKey: string; scaleType: 'major' | 'minor' }

function PitchPipe({ selectedKey, scaleType }: PitchPipeProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const scale = getScale(selectedKey, scaleType)
  const degrees = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  const play = useCallback((note: string) => {
    playPitchTone(NOTE_FREQS[`${note}4`] ?? 261.63)
    setActiveNote(note)
    setTimeout(() => setActiveNote(n => n === note ? null : n), 1300)
  }, [])
  return (
    <div className="flex flex-wrap gap-2">
      {scale.map((note, i) => {
        const active = activeNote === note
        return (
          <button key={i} onClick={() => play(note)}
            className="flex flex-col items-center rounded-xl border-2 transition-all duration-100 hover:scale-105 active:scale-95 py-2 px-3"
            style={{ borderColor: active ? '#C8960C' : '#E8E4DC', background: active ? '#C8960C' : '#F9F7F4', color: active ? '#fff' : '#1A1A1A', minWidth: 52 }}>
            <span className="text-lg font-bold leading-none">{note}</span>
            <span className="text-[10px] mt-1 opacity-70">{degrees[i]}</span>
          </button>
        )
      })}
    </div>
  )
}

function renderToCanvas(
  title: string, artist: string, selectedKey: string, scaleType: string,
  genre: string, bpm: string, sections: SongSection[], notes: string,
): string {
  const W = 1920; let H = 280
  for (const s of sections) {
    H += 52
    if (s.vocalDirection) H += 28
    H += s.lyrics.split('\n').length * 26 + 24
  }
  if (notes) H += 60
  H = Math.max(1080, H + 80)
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#F9F7F4'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#2D6A4F'; ctx.fillRect(0, 0, W, 72)
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('DCIP Voice Studio', 40, 46)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px sans-serif'; ctx.fillText('Digital Creative Infrastructure Platform', W - 420, 46)
  ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(title || 'Untitled Vocal Composition', 40, 148)
  let y = 188
  if (artist) { ctx.fillStyle = '#555'; ctx.font = '22px sans-serif'; ctx.fillText(`by ${artist}`, 40, y); y += 34 }
  const meta = [selectedKey && `Key of ${selectedKey} ${scaleType}`, genre, bpm && `${bpm} BPM`].filter(Boolean).join('   |   ')
  if (meta) { ctx.fillStyle = '#888'; ctx.font = '16px sans-serif'; ctx.fillText(meta, 40, y); y += 28 }
  ctx.strokeStyle = '#2D6A4F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, y + 4); ctx.lineTo(W - 40, y + 4); ctx.stroke(); y += 26
  for (const s of sections) {
    ctx.fillStyle = '#2D6A4F'; ctx.fillRect(40, y, 160, 28)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(s.type.toUpperCase(), 50, y + 19); y += 40
    if (s.vocalDirection) { ctx.fillStyle = '#C8960C'; ctx.font = 'italic 14px sans-serif'; ctx.fillText(s.vocalDirection, 40, y); y += 26 }
    ctx.fillStyle = '#1A1A1A'; ctx.font = '16px sans-serif'
    for (const line of s.lyrics.split('\n').slice(0, 12)) { ctx.fillText(line.substring(0, 100), 40, y); y += 26 }
    y += 12; ctx.strokeStyle = '#E8E4DC'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke(); y += 18
  }
  if (notes) { ctx.fillStyle = '#555'; ctx.font = 'italic 14px sans-serif'; ctx.fillText('Notes: ' + notes.substring(0, 180), 40, y + 16) }
  ctx.fillStyle = '#2D6A4F'; ctx.fillRect(0, H - 40, W, 40)
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('Created with DCIP Voice Studio', 40, H - 14)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px sans-serif'; ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - 280, H - 14)
  return canvas.toDataURL('image/png')
}

const SECTION_TYPES = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Post-Chorus', 'Bridge', 'Outro']
const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const GENRES = ['Pop', 'R&B', 'Gospel', 'Jazz', 'Classical', 'Folk', 'Afrobeat', 'Ballad', 'Soul', 'Hip-Hop']

function newSection(type = 'Verse'): SongSection {
  return { id: `${Date.now()}-${Math.random()}`, type, vocalDirection: '', lyrics: '' }
}

const VoiceStudio = forwardRef<VoiceStudioHandle, { onDirty: () => void }>(({ onDirty }, ref) => {
  const [title,       setTitle]       = useState('')
  const [artist,      setArtist]      = useState('')
  const [selectedKey, setSelectedKey] = useState('C')
  const [scaleType,   setScaleType]   = useState<'major' | 'minor'>('major')
  const [genre,       setGenre]       = useState('')
  const [bpm,         setBpm]         = useState('')
  const [notes,       setNotes]       = useState('')
  const [sections,    setSections]    = useState<SongSection[]>([
    newSection('Intro'), newSection('Verse'), newSection('Chorus'), newSection('Bridge'),
  ])
  const [vizMode,     setVizMode]     = useState<VisualizerMode>('waveform')

  const [micState,    setMicState]    = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle')
  const [takes,       setTakes]       = useState<Take[]>([])
  const [playingId,   setPlayingId]   = useState<string | null>(null)
  const [elapsedSec,  setElapsedSec]  = useState(0)

  const streamRef       = useRef<MediaStream | null>(null)
  const audioCtxRef     = useRef<AudioContext | null>(null)
  const analyserRef     = useRef<AnalyserNode | null>(null)
  const recorderRef     = useRef<MediaRecorder | null>(null)
  const chunksRef       = useRef<BlobPart[]>([])
  const recStartRef     = useRef<number>(0)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playingAudioRef = useRef<HTMLAudioElement | null>(null)
  const takeCountRef    = useRef(0)

  async function startRecording() {
    setMicState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

      // Verify the mic track is actually live and unmuted
      const audioTrack = stream.getAudioTracks()[0]
      if (!audioTrack || audioTrack.readyState !== 'live') {
        stream.getTracks().forEach(t => t.stop())
        setMicState('denied')
        return
      }

      streamRef.current = stream

      // AudioContext may start suspended in Chrome — must resume before reading analyser
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      await audioCtx.resume()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)
      analyserRef.current = analyser

      const mime = bestMimeType()
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        // Clean up audio pipeline only after recorder has finished collecting data
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        audioCtxRef.current?.close()
        audioCtxRef.current = null
        analyserRef.current = null

        const usedMime = recorder.mimeType || mime || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: usedMime })
        // Don't save a take if nothing was actually captured
        if (blob.size < 1000) return
        const url = URL.createObjectURL(blob)
        const durationSec = (Date.now() - recStartRef.current) / 1000
        takeCountRef.current += 1
        const take: Take = {
          id: `take-${Date.now()}`,
          name: `Take ${takeCountRef.current}`,
          blob, url, durationSec, mimeType: usedMime,
        }
        setTakes(prev => [...prev, take])
        onDirty()
      }

      recStartRef.current = Date.now()
      recorder.start(200)
      recorderRef.current = recorder

      setElapsedSec(0)
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - recStartRef.current) / 1000))
      }, 1000)

      setMicState('active')
    } catch {
      setMicState('denied')
    }
  }

  function stopRecording() {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    recorderRef.current?.stop()   // triggers onstop, which handles stream/ctx cleanup
    recorderRef.current = null
    setMicState('idle')
    setElapsedSec(0)
  }

  function playTake(take: Take) {
    if (playingId === take.id) {
      playingAudioRef.current?.pause()
      playingAudioRef.current = null
      setPlayingId(null)
      return
    }
    playingAudioRef.current?.pause()
    const audio = new Audio(take.url)
    audio.onended = () => setPlayingId(null)
    audio.play()
    playingAudioRef.current = audio
    setPlayingId(take.id)
  }

  function downloadTake(take: Take) {
    const a = document.createElement('a')
    a.href = take.url
    a.download = `${take.name.replace(/\s+/g, '-')}.${fileExt(take.mimeType)}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  function deleteTake(id: string) {
    if (playingId === id) {
      playingAudioRef.current?.pause()
      playingAudioRef.current = null
      setPlayingId(null)
    }
    setTakes(prev => {
      const t = prev.find(t => t.id === id)
      if (t) URL.revokeObjectURL(t.url)
      return prev.filter(t => t.id !== id)
    })
  }

  function updateSection(id: string, field: keyof SongSection, value: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    onDirty()
  }

  useEffect(() => {
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      audioCtxRef.current?.close()
      playingAudioRef.current?.pause()
      takes.forEach(t => URL.revokeObjectURL(t.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    captureImage: () => renderToCanvas(title, artist, selectedKey, scaleType, genre, bpm, sections, notes),
    getFormat: () => ({ label: 'Vocal Composition', width: 1920, height: 1080 }),
    captureAudio: async () => {
      if (takes.length === 0) return null
      const lastTake = takes[takes.length - 1]
      return new Promise<{ dataUrl: string; mimeType: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve({ dataUrl: reader.result as string, mimeType: lastTake.mimeType })
        reader.onerror = reject
        reader.readAsDataURL(lastTake.blob)
      })
    },
  }), [takes, title, artist, selectedKey, scaleType, genre, bpm, sections, notes])

  const field = 'border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary bg-white focus:outline-none focus:border-secondary'
  const lbl   = 'text-[10px] uppercase tracking-wide text-text-muted font-medium mb-1 block'

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-warm">

      {/* Metadata row */}
      <div className="flex-shrink-0 bg-white border-b border-surface-border px-3 sm:px-6 py-3 flex items-end gap-3 sm:gap-4 flex-wrap">
        <div><label htmlFor="vs-title" className={lbl}>Title</label>
          <input id="vs-title" name="vs-title" className={`${field} w-48`} placeholder="Composition title" value={title} onChange={e => { setTitle(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="vs-artist" className={lbl}>Artist</label>
          <input id="vs-artist" name="vs-artist" className={`${field} w-36`} placeholder="Your name" value={artist} onChange={e => { setArtist(e.target.value); onDirty() }} /></div>
        <div><label htmlFor="vs-key" className={lbl}>Key</label>
          <select id="vs-key" name="vs-key" className={`${field} w-20`} value={selectedKey} onChange={e => { setSelectedKey(e.target.value); onDirty() }}>
            {KEYS.map(k => <option key={k}>{k}</option>)}</select></div>
        <div><label htmlFor="vs-scale" className={lbl}>Scale</label>
          <select id="vs-scale" name="vs-scale" className={`${field} w-24`} value={scaleType} onChange={e => { setScaleType(e.target.value as 'major' | 'minor'); onDirty() }}>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select></div>
        <div><label htmlFor="vs-genre" className={lbl}>Genre</label>
          <select id="vs-genre" name="vs-genre" className={`${field} w-28`} value={genre} onChange={e => { setGenre(e.target.value); onDirty() }}>
            <option value="">Select...</option>
            {GENRES.map(g => <option key={g}>{g}</option>)}</select></div>
        <div><label htmlFor="vs-bpm" className={lbl}>BPM</label>
          <input id="vs-bpm" name="vs-bpm" type="number" min={40} max={300} className={`${field} w-20`} placeholder="120" value={bpm} onChange={e => { setBpm(e.target.value); onDirty() }} /></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

        {/* Recording booth */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-primary font-bold text-sm">Recording Booth</p>
              <p className="text-text-muted text-xs mt-0.5">
                {micState === 'idle'       && 'Press Record Take to start. Your voice will appear as a live waveform while you sing.'}
                {micState === 'requesting' && 'Requesting microphone access...'}
                {micState === 'active'     && `Recording  ${fmtTime(elapsedSec)}  — your voice is being captured`}
                {micState === 'denied'     && 'Microphone access denied — allow microphone in your browser and try again'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {micState === 'active' && (
                <>
                  <button onClick={() => setVizMode(m => m === 'waveform' ? 'spectrum' : 'waveform')}
                    className="text-xs px-3 py-1.5 border border-surface-border rounded-lg text-text-secondary hover:bg-surface-warm transition-colors">
                    {vizMode === 'waveform' ? 'Spectrum' : 'Waveform'}
                  </button>
                  <button onClick={stopRecording}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 transition-opacity">
                    Stop Recording
                  </button>
                </>
              )}
              {(micState === 'idle' || micState === 'denied') && (
                <button onClick={startRecording}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-white hover:opacity-90 transition-opacity">
                  Record Take
                </button>
              )}
              {micState === 'requesting' && (
                <span className="text-xs text-text-muted px-4 py-2">Waiting...</span>
              )}
            </div>
          </div>

          <WaveformCanvas analyserRef={analyserRef} isLive={micState === 'active'} mode={vizMode} />

          <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted">
            <span>
              {vizMode === 'waveform'
                ? 'Oscilloscope — amplitude vs. time'
                : 'Spectrum analyzer — frequency distribution'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full"
                style={{ background: micState === 'active' ? '#D62828' : '#888', boxShadow: micState === 'active' ? '0 0 6px rgba(214,40,40,0.7)' : undefined }} />
              {micState === 'active' ? `REC  ${fmtTime(elapsedSec)}` : 'Standby'}
            </span>
          </div>
        </div>

        {/* Takes library */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <p className="text-text-primary font-bold text-sm mb-1">Takes</p>
          <p className="text-text-muted text-xs mb-4">
            {takes.length === 0
              ? 'Record your first take above. Each take is saved here — play it back, compare, and download the best one to share.'
              : `${takes.length} take${takes.length > 1 ? 's' : ''} recorded. Play each one back to find your best performance.`}
          </p>

          {takes.length === 0 ? (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-surface-border rounded-xl">
              <p className="text-text-muted text-sm">No takes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {takes.map((take, idx) => {
                const isPlaying = playingId === take.id
                return (
                  <div key={take.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface-warm/40 hover:bg-surface-warm transition-colors">
                    <span className="text-text-muted text-xs w-5 text-right">{idx + 1}</span>
                    <span className="text-sm font-semibold text-text-primary flex-1">{take.name}</span>
                    <span className="text-xs text-text-muted">{fmtTime(take.durationSec)}</span>

                    {/* Play / Pause */}
                    <button onClick={() => playTake(take)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        isPlaying
                          ? 'bg-accent text-white hover:opacity-80'
                          : 'border border-secondary text-secondary hover:bg-secondary/5'
                      }`}>
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    {/* Download */}
                    <button onClick={() => downloadTake(take)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors">
                      Download
                    </button>

                    {/* Delete */}
                    <button onClick={() => deleteTake(take.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-text-muted hover:text-accent hover:border-accent transition-colors">
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pitch pipe */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <p className="text-text-primary font-bold text-sm mb-1">Pitch Pipe</p>
          <p className="text-text-muted text-xs mb-4">
            {selectedKey} {scaleType} scale. Click a note to hear the reference pitch — use it to tune your voice before recording.
          </p>
          <PitchPipe selectedKey={selectedKey} scaleType={scaleType} />
        </div>

        {/* Lyrics */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-primary font-bold text-sm">Lyrics and Vocal Arrangement</p>
            <button onClick={() => { setSections(p => [...p, newSection()]); onDirty() }}
              className="text-xs bg-secondary text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              + Add Section
            </button>
          </div>
          <div className="space-y-5">
            {sections.map((section, idx) => (
              <div key={section.id} className="border border-surface-border rounded-xl p-4 bg-surface-warm/30 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-xs w-4">{idx + 1}</span>
                  <select value={section.type} onChange={e => updateSection(section.id, 'type', e.target.value)}
                    className="text-xs font-bold text-secondary border border-surface-border rounded-lg px-2 py-1 bg-white focus:outline-none">
                    {SECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div className="flex-1" />
                  {sections.length > 1 && (
                    <button onClick={() => { setSections(p => p.filter(s => s.id !== section.id)); onDirty() }}
                      className="text-[10px] text-accent hover:opacity-70">Remove</button>
                  )}
                </div>
                <div>
                  <label className="block text-text-muted text-[10px] uppercase tracking-wide mb-1 font-medium">Vocal Direction</label>
                  <input className="w-full border border-surface-border rounded-lg px-3 py-1.5 text-sm italic text-secondary bg-white focus:outline-none focus:border-secondary"
                    placeholder="Soft and breathy, build to belting on the last line..."
                    value={section.vocalDirection} onChange={e => updateSection(section.id, 'vocalDirection', e.target.value)} />
                </div>
                <div>
                  <label className="block text-text-muted text-[10px] uppercase tracking-wide mb-1 font-medium">Lyrics</label>
                  <textarea className="w-full border border-surface-border rounded-lg px-3 py-3 text-base text-text-primary bg-white focus:outline-none focus:border-secondary resize-none leading-relaxed"
                    rows={5} placeholder="Write your lyrics here. Each line is one vocal phrase."
                    value={section.lyrics} onChange={e => updateSection(section.id, 'lyrics', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
          <label htmlFor="vs-notes" className="text-text-primary font-bold text-sm block mb-2">Production Notes</label>
          <textarea id="vs-notes" name="vs-notes"
            className="w-full border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary bg-surface-warm/50 focus:outline-none focus:border-secondary resize-none"
            rows={3} placeholder="Harmonies, key changes, vocal effects, what to improve next session..."
            value={notes} onChange={e => { setNotes(e.target.value); onDirty() }} />
        </div>

      </div>
    </div>
  )
})

VoiceStudio.displayName = 'VoiceStudio'
export default VoiceStudio
