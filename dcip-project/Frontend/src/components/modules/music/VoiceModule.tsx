import { useEffect, useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

const REFERENCE_TONES = [
  { label: 'C4', freq: 261.63 },
  { label: 'D4', freq: 293.66 },
  { label: 'E4', freq: 329.63 },
  { label: 'F4', freq: 349.23 },
  { label: 'G4', freq: 392.00 },
  { label: 'A4', freq: 440.00 },
] as const

const HINTS: Record<number, string> = {
  1: 'Start with the breathing exercise. Good breath control is the foundation of singing.',
  2: 'Click a reference tone, then sing or hum that note. Watch the pitch meter.',
  3: 'Sing each vowel on a sustained note: A E I O U. Then step up and back down.',
  4: 'Press Start Recording and sing or hum a phrase. The waveform shows your voice in real time.',
  5: 'Happy with a take? Give it a title above and save it to your portfolio.',
}

type BreathPhase = 'idle' | 'in' | 'hold' | 'out' | 'done'
type PitchStatus = 'idle' | 'low' | 'on' | 'high'

function detectPitch(analyser: AnalyserNode): number | null {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  const sampleRate = analyser.context.sampleRate
  const binHz = sampleRate / (2 * analyser.frequencyBinCount)
  const lo = Math.max(1, Math.floor(60 / binHz))
  const hi = Math.min(analyser.frequencyBinCount - 1, Math.ceil(1000 / binHz))
  let maxAmp = 0
  let peak = lo
  for (let i = lo; i <= hi; i++) {
    if (data[i] > maxAmp) { maxAmp = data[i]; peak = i }
  }
  return maxAmp < 25 ? null : peak * binHz
}

function motivationMessage(count: number): string {
  if (count === 1) return 'Great first recording. Come back tomorrow, your voice will feel stronger.'
  if (count <= 3) return `Take ${count} done. Listen back and notice what feels different.`
  return 'You are building real vocal confidence. Every session counts.'
}

const BREATH_INSTRUCTION: Record<BreathPhase, string> = {
  idle: 'Ready to begin?',
  in: 'Breathe in…',
  hold: 'Hold…',
  out: 'Breathe out…',
  done: 'Well done! Your lungs are ready.',
}

export default function VoiceModule({ step, onAudioReady }: Props) {
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle')
  const [breathCount, setBreathCount] = useState(4)
  const [activeTone, setActiveTone] = useState<string | null>(null)
  const [pitchActive, setPitchActive] = useState(false)
  const [pitchStatus, setPitchStatus] = useState<PitchStatus>('idle')
  const [micError, setMicError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordings, setRecordings] = useState<Array<{ url: string; label: string }>>([])
  const [motivation, setMotivation] = useState<string | null>(null)
  const [hasReference, setHasReference] = useState(false)

  const micStreamRef = useRef<MediaStream | null>(null)
  const pitchCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const pitchRafRef = useRef<number>(0)
  const waveRafRef = useRef<number>(0)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const referenceFreqRef = useRef<number | null>(null)
  const pitchActiveRef = useRef(false)
  const recordingActiveRef = useRef(false)
  const recordingCountRef = useRef(0)

  useEffect(() => {
    return () => {
      if (pitchRafRef.current) cancelAnimationFrame(pitchRafRef.current)
      if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current)
      if (breathTimerRef.current) clearInterval(breathTimerRef.current)
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      pitchCtxRef.current?.close()
    }
  }, [])

  const startBreathing = () => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    setBreathPhase('in')
    setBreathCount(4)
    let phase: BreathPhase = 'in'
    let count = 4
    breathTimerRef.current = setInterval(() => {
      count -= 1
      if (count > 0) {
        setBreathCount(count)
      } else {
        if (phase === 'in') {
          phase = 'hold'; count = 4
          setBreathPhase('hold'); setBreathCount(4)
        } else if (phase === 'hold') {
          phase = 'out'; count = 4
          setBreathPhase('out'); setBreathCount(4)
        } else {
          phase = 'done'
          setBreathPhase('done')
          clearInterval(breathTimerRef.current!)
        }
      }
    }, 1000)
  }

  const playReferenceTone = (freq: number, label: string) => {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
    osc.start(now)
    osc.stop(now + 2.0)
    referenceFreqRef.current = freq
    setActiveTone(label)
    setHasReference(true)
    setTimeout(() => { setActiveTone(null); ctx.close() }, 2500)
  }

  const initMic = async (): Promise<boolean> => {
    if (micStreamRef.current) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      micStreamRef.current = stream
      const ctx = new AudioContext()
      pitchCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      return true
    } catch {
      setMicError('Microphone access denied. Please allow microphone in your browser settings.')
      return false
    }
  }

  const runPitchLoop = () => {
    if (!pitchActiveRef.current) return
    if (analyserRef.current && referenceFreqRef.current) {
      const freq = detectPitch(analyserRef.current)
      if (freq !== null) {
        const cents = 1200 * Math.log2(freq / referenceFreqRef.current)
        if (Math.abs(cents) < 50) setPitchStatus('on')
        else if (cents < 0) setPitchStatus('low')
        else setPitchStatus('high')
      } else {
        setPitchStatus('idle')
      }
    }
    pitchRafRef.current = requestAnimationFrame(runPitchLoop)
  }

  const startPitchDetection = async () => {
    const ok = await initMic()
    if (!ok) return
    setMicError(null)
    pitchActiveRef.current = true
    setPitchActive(true)
    runPitchLoop()
  }

  const stopPitchDetection = () => {
    pitchActiveRef.current = false
    setPitchActive(false)
    if (pitchRafRef.current) cancelAnimationFrame(pitchRafRef.current)
    setPitchStatus('idle')
  }

  const runWaveform = () => {
    if (!recordingActiveRef.current) return
    const canvas = waveformRef.current
    const analyser = analyserRef.current
    if (canvas && analyser) {
      const ctx2d = canvas.getContext('2d')
      if (ctx2d) {
        const data = new Uint8Array(analyser.fftSize)
        analyser.getByteTimeDomainData(data)
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
        ctx2d.beginPath()
        ctx2d.strokeStyle = '#C8960C'
        ctx2d.lineWidth = 2
        const sw = canvas.width / data.length
        let x = 0
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] / 128.0) * (canvas.height / 2)
          if (i === 0) ctx2d.moveTo(x, y)
          else ctx2d.lineTo(x, y)
          x += sw
        }
        ctx2d.lineTo(canvas.width, canvas.height / 2)
        ctx2d.stroke()
      }
    }
    waveRafRef.current = requestAnimationFrame(runWaveform)
  }

  const startRecording = async () => {
    const ok = await initMic()
    if (!ok || !micStreamRef.current) return
    setMicError(null)
    const mr = new MediaRecorder(micStreamRef.current)
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      recordingCountRef.current += 1
      const label = `Recording ${recordingCountRef.current}`
      setRecordings((prev) => [...prev, { url, label }])
      setMotivation(motivationMessage(recordingCountRef.current))
      const reader = new FileReader()
      reader.onload = () => onAudioReady(reader.result as string)
      reader.readAsDataURL(blob)
    }
    mr.start()
    mediaRef.current = mr
    recordingActiveRef.current = true
    setRecording(true)
    runWaveform()
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    recordingActiveRef.current = false
    setRecording(false)
  }

  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-xs bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
        {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Breathing warm-up — step 1 */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-text-primary text-sm font-semibold">Breathing warm-up (4 – 4 – 4)</p>
          <div className={`rounded-full border-4 flex items-center justify-center transition-all ease-in-out duration-[2000ms]
            ${breathPhase === 'in' || breathPhase === 'hold'
              ? 'w-36 h-36 bg-purple-100 border-purple-500'
              : 'w-24 h-24 bg-transparent border-purple-400'
            }`}
          >
            {breathPhase !== 'idle' && breathPhase !== 'done' && (
              <span className="text-purple-700 text-2xl font-bold">{breathCount}</span>
            )}
            {breathPhase === 'done' && (
              <span className="text-purple-500 text-2xl">✓</span>
            )}
          </div>
          <p className="text-purple-700 text-sm font-semibold">{BREATH_INSTRUCTION[breathPhase]}</p>
          {breathPhase === 'idle' && (
            <button
              onClick={startBreathing}
              className="bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-800 transition-colors"
            >
              Start warm-up
            </button>
          )}
          {(breathPhase === 'in' || breathPhase === 'hold' || breathPhase === 'out') && (
            <button
              onClick={() => {
                if (breathTimerRef.current) clearInterval(breathTimerRef.current)
                setBreathPhase('done')
              }}
              className="border border-purple-300 text-purple-700 text-sm px-5 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              I'm ready
            </button>
          )}
          {breathPhase === 'done' && (
            <button onClick={() => setBreathPhase('idle')} className="text-text-secondary text-xs underline">
              Do it again
            </button>
          )}
        </div>
      )}

      {/* Pitch matching — step 2+ */}
      {step >= 2 && (
        <div className="space-y-3">
          <p className="text-text-primary text-xs font-semibold">Pitch matching</p>
          <p className="text-text-secondary text-xs">
            Click a reference tone, then sing or hum that note. Watch the meter below.
          </p>
          <div className="flex gap-2 flex-wrap">
            {REFERENCE_TONES.map((t) => (
              <button
                key={t.label}
                onClick={() => playReferenceTone(t.freq, t.label)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all
                  ${activeTone === t.label
                    ? 'bg-purple-600 text-white border-purple-600 scale-95'
                    : 'bg-white border-surface-border text-text-primary hover:border-purple-400 hover:bg-purple-50'
                  }`}
              >
                {t.label}
                {activeTone === t.label && <span className="ml-1 animate-pulse">♪</span>}
              </button>
            ))}
          </div>

          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">{micError}</p>
          )}

          {!pitchActive ? (
            <button
              onClick={startPitchDetection}
              className="border border-purple-400 text-purple-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Start pitch detection
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-purple-700 text-xs font-medium">Listening for your voice…</span>
                <button onClick={stopPitchDetection} className="text-text-secondary text-xs underline ml-1">
                  Stop
                </button>
              </div>
              <p className="text-text-secondary text-[10px]">
                {hasReference ? 'Pitch relative to reference:' : 'Select a reference tone above first'}
              </p>
              <div className="flex rounded-full overflow-hidden border border-gray-200 h-6">
                <div className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-colors duration-100
                  ${pitchStatus === 'low' ? 'bg-text-muted text-white' : 'bg-gray-100 text-gray-400'}`}>
                  Too low
                </div>
                <div className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-colors duration-100
                  ${pitchStatus === 'on' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400'}`}>
                  On pitch
                </div>
                <div className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-colors duration-100
                  ${pitchStatus === 'high' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}>
                  Too high
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vowel exercise — step 3+ */}
      {step >= 3 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-text-primary text-xs font-semibold mb-2">Vowel exercise</p>
          <div className="flex gap-4 mb-2">
            {['A', 'E', 'I', 'O', 'U'].map((v) => (
              <span key={v} className="text-purple-700 font-bold text-2xl">{v}</span>
            ))}
          </div>
          <p className="text-text-secondary text-xs">
            Sing each vowel on a comfortable note, going up one step between each, then back down.
          </p>
        </div>
      )}

      {/* Recording — step 4+ */}
      {step >= 4 && (
        <div className="space-y-3">
          <p className="text-text-primary text-xs font-semibold">Record your voice</p>

          {micError && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">{micError}</p>
          )}

          {!recording && (
            <button
              onClick={startRecording}
              className="bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-purple-800 transition-colors"
            >
              Start Recording
            </button>
          )}

          {recording && (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <span className="text-purple-700 text-sm font-medium">
                    Recording {recordingCountRef.current + 1}…
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="border border-purple-400 text-purple-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Stop
                </button>
              </div>
              <canvas ref={waveformRef} width={800} height={80} className="w-full rounded-lg bg-gray-950" />
            </div>
          )}

          {recordings.length > 0 && !recording && (
            <div className="space-y-2">
              <p className="text-text-secondary text-xs font-medium">
                Your recordings: listen back and compare
              </p>
              {recordings.map((rec) => (
                <div key={rec.url} className="space-y-1">
                  <p className="text-text-secondary text-[11px]">{rec.label}</p>
                  <audio controls src={rec.url} className="w-full h-9" />
                </div>
              ))}
              <button
                onClick={startRecording}
                className="border border-purple-400 text-purple-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Record another take
              </button>
            </div>
          )}

          {motivation && (
            <p className="text-purple-700 text-xs font-medium bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
              {motivation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
