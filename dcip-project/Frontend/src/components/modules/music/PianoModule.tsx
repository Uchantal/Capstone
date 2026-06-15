import { useEffect, useRef, useState } from 'react'

interface Props {
  step: number
  onAudioReady: (data: string) => void
}

// White keys C4–B5, each optionally followed by a black key (sharp)
const WHITE_KEYS = [
  { note: 'C4',  freq: 261.63, sharp: { note: 'C#4', freq: 277.18 } },
  { note: 'D4',  freq: 293.66, sharp: { note: 'D#4', freq: 311.13 } },
  { note: 'E4',  freq: 329.63, sharp: null },
  { note: 'F4',  freq: 349.23, sharp: { note: 'F#4', freq: 369.99 } },
  { note: 'G4',  freq: 392.00, sharp: { note: 'G#4', freq: 415.30 } },
  { note: 'A4',  freq: 440.00, sharp: { note: 'A#4', freq: 466.16 } },
  { note: 'B4',  freq: 493.88, sharp: null },
  { note: 'C5',  freq: 523.25, sharp: { note: 'C#5', freq: 554.37 } },
  { note: 'D5',  freq: 587.33, sharp: { note: 'D#5', freq: 622.25 } },
  { note: 'E5',  freq: 659.25, sharp: null },
  { note: 'F5',  freq: 698.46, sharp: { note: 'F#5', freq: 739.99 } },
  { note: 'G5',  freq: 783.99, sharp: { note: 'G#5', freq: 830.61 } },
  { note: 'A5',  freq: 880.00, sharp: { note: 'A#5', freq: 932.33 } },
  { note: 'B5',  freq: 987.77, sharp: null },
] as const

const C_MAJOR_NOTES = new Set(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])

const SCALE_SEQUENCE = [
  { note: 'C4', freq: 261.63 },
  { note: 'D4', freq: 293.66 },
  { note: 'E4', freq: 329.63 },
  { note: 'F4', freq: 349.23 },
  { note: 'G4', freq: 392.00 },
  { note: 'A4', freq: 440.00 },
  { note: 'B4', freq: 493.88 },
  { note: 'C5', freq: 523.25 },
] as const

const CR_CHORDS = [
  { name: 'C major', freqs: [261.63, 329.63, 392.00] },
  { name: 'F major', freqs: [349.23, 440.00, 523.25] },
  { name: 'G major', freqs: [392.00, 493.88, 587.33] },
] as const

const HINTS: Record<number, string> = {
  1: 'Play C D E F G A B C in order. The highlighted keys form the C major scale.',
  2: 'Listen to each chord, then identify it. Train your ear to recognise major chords.',
  3: 'Explore freely. Try to find a simple melody by ear, starting on C.',
  4: 'Press Start Recording, play your best melody or exercise, then Stop.',
  5: 'Happy with your recording? Give it a title and save it.',
}

export default function PianoModule({ step, onAudioReady }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [notesPlayed, setNotesPlayed] = useState(0)
  const [lastNote, setLastNote] = useState<string | null>(null)
  const [sessionNum, setSessionNum] = useState(1)

  // Scale exercise (step 1)
  const [scaleIdx, setScaleIdx] = useState(0)
  const [scaleResult, setScaleResult] = useState<'idle' | 'progress' | 'success' | 'wrong'>('idle')

  // Chord recognition (step 2)
  const [crOrder] = useState<number[]>(() => {
    const o = [0, 1, 2]
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [o[i], o[j]] = [o[j], o[i]]
    }
    return o
  })
  const [crIdx, setCrIdx] = useState(0)
  const [crHeard, setCrHeard] = useState(false)
  const [crResult, setCrResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [crScore, setCrScore] = useState(0)

  // Recording
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const n = parseInt(localStorage.getItem('dcip-piano-sessions') || '0')
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

  const playNote = (freq: number, note: string) => {
    const ctx = ensureCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()  // overtone at 2× frequency
    const g1 = ctx.createGain()
    const g2 = ctx.createGain()
    const master = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.value = freq
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2
    g2.gain.value = 0.1  // overtone at 10% volume

    osc1.connect(g1)
    osc2.connect(g2)
    g1.connect(master)
    g2.connect(master)
    master.connect(ctx.destination)
    if (destRef.current) master.connect(destRef.current)

    // ADSR envelope
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(0.5, now + 0.01)      // attack
    master.gain.linearRampToValueAtTime(0.2, now + 0.31)      // decay to sustain
    master.gain.setValueAtTime(0.2, now + 0.4)
    master.gain.linearRampToValueAtTime(0.001, now + 1.3)     // release

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.3)
    osc2.stop(now + 1.3)

    setActiveKey(note)
    setTimeout(() => setActiveKey((p) => (p === note ? null : p)), 150)
    setLastNote(note)
    setNotesPlayed((n) => n + 1)
  }

  const handleKeyPress = (freq: number, note: string) => {
    playNote(freq, note)
    if (step === 1) trackScaleNote(note)
  }

  // Scale tracking: must play C4 D4 E4 F4 G4 A4 B4 C5 in order
  const trackScaleNote = (note: string) => {
    const idx = SCALE_SEQUENCE.findIndex((s) => s.note === note)
    if (idx === -1) return  // black key or out-of-range — ignore for tracking
    if (idx === scaleIdx) {
      if (scaleIdx === SCALE_SEQUENCE.length - 1) {
        setScaleResult('success')
        setScaleIdx(0)
      } else {
        setScaleIdx((i) => i + 1)
        setScaleResult('progress')
      }
    } else if (idx !== scaleIdx) {
      setScaleResult('wrong')
      setScaleIdx(0)
      setTimeout(() => setScaleResult('idle'), 1200)
    }
  }

  const playScale = () => {
    SCALE_SEQUENCE.forEach(({ note, freq }, i) => {
      setTimeout(() => {
        playNote(freq, note)
      }, i * 380)
    })
    setScaleResult('idle')
    setScaleIdx(0)
  }

  const currentCrChord = CR_CHORDS[crOrder[crIdx % 3]]
  const crOptions = ['C major', 'F major', 'G major']

  const hearChord = () => {
    const ctx = ensureCtx()
    const now = ctx.currentTime
    currentCrChord.freqs.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (destRef.current) gain.connect(destRef.current)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
      osc.start(now)
      osc.stop(now + 1.5)
    })
    setCrHeard(true)
    setCrResult('idle')
  }

  const answerChord = (answer: string) => {
    if (answer === currentCrChord.name) {
      setCrResult('correct')
      setCrScore((s) => s + 1)
    } else {
      setCrResult('wrong')
    }
  }

  const nextChordQuestion = () => {
    setCrIdx((i) => i + 1)
    setCrHeard(false)
    setCrResult('idle')
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
        localStorage.setItem('dcip-piano-sessions', String(sessionNum))
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

  // Which notes to highlight on the keyboard
  const highlightNotes = step === 1 ? C_MAJOR_NOTES : new Set<string>()

  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-[11px]">Session {sessionNum} of your piano journey</p>

      <p className="text-text-secondary text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
        💡 {HINTS[step] ?? HINTS[1]}
      </p>

      {/* Piano keyboard */}
      <div>
        <p className="text-text-primary text-xs font-semibold mb-2">Virtual keyboard: C4 to B5</p>
        <div className="overflow-x-auto pb-3">
          <div className="flex">
            {WHITE_KEYS.map((key) => (
              <div key={key.note} className="relative flex-shrink-0">
                {/* White key */}
                <button
                  onMouseDown={() => handleKeyPress(key.freq, key.note)}
                  aria-label={`Play ${key.note}`}
                  className={`w-10 h-32 border border-gray-300 rounded-b-lg flex items-end justify-center pb-1.5 select-none transition-colors duration-75 text-[9px] font-medium
                    ${activeKey === key.note
                      ? 'bg-yellow-100 border-yellow-400'
                      : highlightNotes.has(key.note)
                      ? 'bg-yellow-50 border-primary ring-1 ring-primary ring-inset hover:bg-yellow-100'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <span className="text-gray-300">{key.note.replace(/\d/, '')}</span>
                </button>
                {/* Black key */}
                {key.sharp && (
                  <button
                    onMouseDown={() => handleKeyPress(key.sharp!.freq, key.sharp!.note)}
                    aria-label={`Play ${key.sharp.note}`}
                    className={`absolute left-7 top-0 z-10 w-6 h-20 rounded-b-md select-none transition-colors duration-75
                      ${activeKey === key.sharp.note ? 'bg-gray-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {lastNote && (
          <p className="text-text-secondary text-xs mt-1">
            Last note: <span className="text-primary font-semibold">{lastNote}</span>
            {C_MAJOR_NOTES.has(lastNote) && (
              <span className="text-text-secondary ml-1">(in C major scale)</span>
            )}
          </p>
        )}
      </div>

      {/* Scale exercise — step 1 */}
      {step === 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
          <p className="text-text-primary text-sm font-semibold">C Major Scale exercise</p>
          <p className="text-text-secondary text-xs">
            The highlighted keys show C D E F G A B C. Press{' '}
            <span className="font-semibold">Hear the scale</span> first, then play it back.
          </p>
          <button
            onClick={playScale}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            ▶ Hear the scale
          </button>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="text-text-secondary">Progress:</span>
            <div className="flex gap-1">
              {SCALE_SEQUENCE.map((s, i) => (
                <span
                  key={s.note}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
                    ${i < scaleIdx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                >
                  {s.note.replace(/\d/, '')}
                </span>
              ))}
            </div>
          </div>
          {scaleResult === 'success' && (
            <p className="text-status-synced text-sm font-semibold">✓ Scale complete! Great work.</p>
          )}
          {scaleResult === 'wrong' && (
            <p className="text-accent text-xs">Wrong note, starting over. Try again!</p>
          )}
        </div>
      )}

      {/* Chord recognition — step 2 */}
      {step === 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-text-primary text-sm font-semibold">Chord recognition</p>
            <span className="text-text-secondary text-xs">Score: {crScore} / 3</span>
          </div>
          <p className="text-text-secondary text-xs">
            Question {(crIdx % 3) + 1} of 3: listen to the chord and identify it.
          </p>
          <button
            onClick={hearChord}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            ▶ Hear the chord
          </button>
          {crHeard && crResult === 'idle' && (
            <div>
              <p className="text-text-secondary text-xs mb-2">Which chord was that?</p>
              <div className="flex gap-2">
                {crOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answerChord(opt)}
                    className="px-3 py-1.5 rounded-lg border border-border text-text-primary text-xs font-semibold hover:border-primary hover:bg-yellow-50 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {crResult === 'correct' && (
            <div className="space-y-2">
              <p className="text-status-synced text-sm font-semibold">
                ✓ Correct! It was {currentCrChord.name}.
              </p>
              <button
                onClick={nextChordQuestion}
                className="border border-primary text-primary text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
              >
                Next chord →
              </button>
            </div>
          )}
          {crResult === 'wrong' && (
            <div className="space-y-2">
              <p className="text-accent text-xs">
                Not quite! That was <span className="font-semibold">{currentCrChord.name}</span>. Try again!
              </p>
              <button
                onClick={() => { setCrHeard(false); setCrResult('idle') }}
                className="border border-border text-text-secondary text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try this chord again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Free play indicator — step 3+ */}
      {step >= 3 && (
        <div className="bg-gray-50 border border-border rounded-xl p-4">
          <p className="text-text-primary text-xs font-semibold mb-1">Free play mode</p>
          <p className="text-text-secondary text-xs">
            Explore the keyboard. Try to find a melody by ear, starting on C, and see where it goes.
          </p>
          {notesPlayed > 0 && (
            <p className="text-text-secondary text-xs mt-2">Notes played this session: {notesPlayed}</p>
          )}
        </div>
      )}

      {/* Recording — step 4+ */}
      {step >= 4 && (
        <div className="space-y-3">
          <p className="text-text-primary text-xs font-semibold">Record your session</p>
          <p className="text-text-secondary text-xs">
            Recording captures what you play, not the microphone.
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
                className="border border-accent text-accent font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
                <p className="text-text-primary text-xs font-semibold">Session summary</p>
                <p className="text-text-secondary text-xs">Notes played: {notesPlayed}</p>
                {scaleResult === 'success' && (
                  <p className="text-status-synced text-xs">C major scale completed ✓</p>
                )}
                {crScore > 0 && (
                  <p className="text-text-secondary text-xs">Chord recognition: {crScore} / 3 correct</p>
                )}
                <p className="text-primary text-xs font-medium mt-1.5">
                  {notesPlayed >= 20
                    ? 'Excellent session. You are developing a real feel for the keys.'
                    : notesPlayed >= 8
                    ? 'Good work. Keep coming back and the keys will feel natural.'
                    : 'A solid start. Try the scale or free play more next time.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
