import { useCallback, useEffect, useRef, useState } from 'react'
import { noteToFrequency } from '../../utils/pianoTheory'

interface BlackKey {
  id: string
  note: string
  kb: string | null
}

interface WhiteKey {
  id: string
  note: string
  octave: number
  kb: string | null
  black: BlackKey | null
}

const WHITE_KEYS: WhiteKey[] = [
  { id: 'C4',  note: 'C', octave: 4, kb: 'a', black: { id: 'C#4', note: 'C#', kb: 'w' } },
  { id: 'D4',  note: 'D', octave: 4, kb: 's', black: { id: 'D#4', note: 'D#', kb: 'e' } },
  { id: 'E4',  note: 'E', octave: 4, kb: 'd', black: null },
  { id: 'F4',  note: 'F', octave: 4, kb: 'f', black: { id: 'F#4', note: 'F#', kb: 't' } },
  { id: 'G4',  note: 'G', octave: 4, kb: 'g', black: { id: 'G#4', note: 'G#', kb: 'y' } },
  { id: 'A4',  note: 'A', octave: 4, kb: 'h', black: { id: 'A#4', note: 'A#', kb: 'u' } },
  { id: 'B4',  note: 'B', octave: 4, kb: 'j', black: null },
  { id: 'C5',  note: 'C', octave: 5, kb: 'k', black: { id: 'C#5', note: 'C#', kb: null } },
  { id: 'D5',  note: 'D', octave: 5, kb: null, black: { id: 'D#5', note: 'D#', kb: null } },
  { id: 'E5',  note: 'E', octave: 5, kb: null, black: null },
  { id: 'F5',  note: 'F', octave: 5, kb: null, black: { id: 'F#5', note: 'F#', kb: null } },
  { id: 'G5',  note: 'G', octave: 5, kb: null, black: { id: 'G#5', note: 'G#', kb: null } },
  { id: 'A5',  note: 'A', octave: 5, kb: null, black: { id: 'A#5', note: 'A#', kb: null } },
  { id: 'B5',  note: 'B', octave: 5, kb: null, black: null },
  { id: 'C6',  note: 'C', octave: 6, kb: null, black: null },
]

const KB_MAP: Record<string, string> = {}
WHITE_KEYS.forEach(k => {
  if (k.kb) KB_MAP[k.kb] = k.id
  if (k.black?.kb) KB_MAP[k.black.kb] = k.black.id
})

function parseNoteId(noteId: string): { note: string; octave: number } {
  const match = noteId.match(/^([A-G]#?)(\d)$/)
  if (!match) return { note: 'A', octave: 4 }
  return { note: match[1], octave: parseInt(match[2]) }
}

interface AudioNodes { osc: OscillatorNode; gain: GainNode }

interface Props {
  onNotesChange?: (notes: string[]) => void
  highlightNotes?: string[]
  disabled?: boolean
  externalAudioContext?: AudioContext
  recordingDest?: MediaStreamAudioDestinationNode
}

export default function PianoKeyboard({ onNotesChange, highlightNotes = [], disabled = false, externalAudioContext, recordingDest }: Props) {
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set())
  const pressedRef = useRef<Set<string>>(new Set())
  const onNotesChangeRef = useRef(onNotesChange)
  onNotesChangeRef.current = onNotesChange
  const audioCtxRef = useRef<AudioContext | null>(null)
  const activeNodesRef = useRef<Map<string, AudioNodes>>(new Map())
  const touchNotesRef = useRef<Map<number, string>>(new Map())
  const isMouseDownRef = useRef(false)

  const getAudioCtx = () => {
    if (externalAudioContext) return externalAudioContext
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }

  const pressNote = useCallback((noteId: string) => {
    if (disabled || pressedRef.current.has(noteId)) return
    const { note, octave } = parseNoteId(noteId)
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (recordingDest) gain.connect(recordingDest)
    osc.type = 'triangle'
    osc.frequency.value = noteToFrequency(note, octave)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.01)
    osc.start()
    activeNodesRef.current.set(noteId, { osc, gain })
    const next = new Set(pressedRef.current)
    next.add(noteId)
    pressedRef.current = next
    setPressedNotes(new Set(next))
  }, [disabled, externalAudioContext, recordingDest])

  const releaseNote = useCallback((noteId: string) => {
    if (!pressedRef.current.has(noteId)) return
    const nodes = activeNodesRef.current.get(noteId)
    if (nodes) {
      const ctx = getAudioCtx()
      const { osc, gain } = nodes
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.stop(ctx.currentTime + 0.25)
      activeNodesRef.current.delete(noteId)
    }
    const next = new Set(pressedRef.current)
    next.delete(noteId)
    pressedRef.current = next
    setPressedNotes(new Set(next))
  }, [])

  useEffect(() => {
    onNotesChangeRef.current?.(Array.from(pressedNotes))
  }, [pressedNotes])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const noteId = KB_MAP[e.key.toLowerCase()]
      if (noteId) pressNote(noteId)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const noteId = KB_MAP[e.key.toLowerCase()]
      if (noteId) releaseNote(noteId)
    }
    const onMouseUp = () => {
      isMouseDownRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [pressNote, releaseNote])

  useEffect(() => {
    return () => {
      if (!externalAudioContext) audioCtxRef.current?.close()
    }
  }, [externalAudioContext])

  const highlightSet = new Set(highlightNotes)

  const whiteKeyClass = (id: string) => {
    const pressed = pressedNotes.has(id)
    const highlighted = highlightSet.has(id)
    const base = 'absolute inset-0 border border-surface-border rounded-b-md flex flex-col items-center justify-end pb-2 cursor-pointer select-none transition-colors duration-150 touch-none'
    if (pressed) return `${base} bg-primary border-primary-dark`
    if (highlighted) return `${base} bg-primary/20 border-primary/40`
    return `${base} bg-white hover:bg-gray-50`
  }

  const blackKeyClass = (id: string) => {
    const pressed = pressedNotes.has(id)
    const highlighted = highlightSet.has(id)
    const base = 'absolute z-10 top-0 left-[70%] w-[60%] h-[60%] rounded-b-md cursor-pointer select-none transition-colors duration-150 touch-none'
    if (pressed) return `${base} bg-primary`
    if (highlighted) return `${base} bg-primary/70`
    return `${base} bg-text-primary hover:bg-text-secondary`
  }

  const onTouchStart = (e: React.TouchEvent, noteId: string) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      touchNotesRef.current.set(t.identifier, noteId)
      pressNote(noteId)
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const id = touchNotesRef.current.get(t.identifier)
      if (id) {
        releaseNote(id)
        touchNotesRef.current.delete(t.identifier)
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex select-none overflow-hidden">
        {WHITE_KEYS.map(key => (
          <div key={key.id} className="flex-1 relative min-w-0">
            <div
              className={whiteKeyClass(key.id)}
              onMouseDown={() => { isMouseDownRef.current = true; pressNote(key.id) }}
              onMouseUp={() => releaseNote(key.id)}
              onMouseLeave={() => { if (isMouseDownRef.current) releaseNote(key.id) }}
              onTouchStart={e => onTouchStart(e, key.id)}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
              role="button"
              aria-label={`Play ${key.id}`}
            >
              <span className="text-[8px] text-text-muted leading-none">
                {key.note === 'C' ? key.id : key.note}
              </span>
              {key.kb && (
                <span className="text-[7px] text-text-muted/60 leading-none">{key.kb.toUpperCase()}</span>
              )}
            </div>

            {key.black && (
              <div
                className={blackKeyClass(key.black.id)}
                onMouseDown={e => { e.stopPropagation(); isMouseDownRef.current = true; pressNote(key.black!.id) }}
                onMouseUp={e => { e.stopPropagation(); releaseNote(key.black!.id) }}
                onMouseLeave={() => { if (isMouseDownRef.current) releaseNote(key.black!.id) }}
                onTouchStart={e => { e.stopPropagation(); onTouchStart(e, key.black!.id) }}
                onTouchEnd={e => { e.stopPropagation(); onTouchEnd(e) }}
                onTouchCancel={e => { e.stopPropagation(); onTouchEnd(e) }}
                role="button"
                aria-label={`Play ${key.black.id}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
