import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import PianoKeyboard from './PianoKeyboard'
import AskAIHint from '../ai/AskAIHint'
import DcipLogoLink from '../DcipLogoLink'
import { useChordValidation } from '../../hooks/useChordValidation'
import {
  buildChord,
  CHROMATIC_SCALE,
  FLAT_NAMES,
  type ChordType,
} from '../../utils/pianoTheory'

interface ChordDef {
  symbol: string
  root: string
  type: ChordType
  useFlats?: boolean
}

interface Props {
  levelNumber: number
  totalLevels: number
  levelTitle: string
  description: string
  chords: ChordDef[]
  nextPath: string
}

function noteNamesToIds(noteNames: string[]): string[] {
  const normalize = (n: string) => {
    const e = Object.entries(FLAT_NAMES).find(([, flat]) => flat === n)
    return e ? e[0] : n
  }
  const normalized = noteNames.map(normalize)
  let oct = 4
  const result: string[] = []
  let prevIdx = -1
  for (const note of normalized) {
    const idx = CHROMATIC_SCALE.indexOf(note as typeof CHROMATIC_SCALE[number])
    if (idx <= prevIdx && result.length > 0) oct++
    result.push(note + oct)
    prevIdx = idx
  }
  return result
}

export default function ChordLevelScreen({ levelNumber, totalLevels, levelTitle, description, chords, nextPath }: Props) {
  const navigate = useNavigate()
  const [chordIdx, setChordIdx] = useState(0)
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [validState, setValidState] = useState<'idle' | 'holding' | 'correct'>('idle')
  const [completed, setCompleted] = useState(false)

  const currentChord = chords[chordIdx]
  const expectedNoteNames = buildChord(currentChord.root, currentChord.type, currentChord.useFlats)
  const highlightNotes = noteNamesToIds(expectedNoteNames)
  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  const handleMatch = useCallback(() => {
    if (validState === 'correct') return
    setValidState('correct')
    setTimeout(() => {
      if (chordIdx + 1 >= chords.length) {
        setCompleted(true)
      } else {
        setChordIdx(i => i + 1)
        setValidState('idle')
      }
    }, 800)
  }, [validState, chordIdx, chords.length])

  useChordValidation(pressedNoteNames, expectedNoteNames, handleMatch)

  const feedbackClass = validState === 'correct'
    ? 'text-secondary font-semibold'
    : 'text-text-muted'

  const feedbackText = validState === 'correct'
    ? 'Correct! Hold it there.'
    : pressedNoteNames.length > 0
    ? 'Hold steady...'
    : 'Find and press the notes below, hold for a moment.'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AskAIHint discipline="Piano" context={`Piano Level ${levelNumber} — Learn`} side="left" />
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4 gap-3">
        <DcipLogoLink />
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button
            onClick={() => navigate(-1)}
            className="hover:text-text-primary transition-colors flex-shrink-0"
          >
            ← Back
          </button>
          <span className="hidden sm:inline">/</span>
          <span className="hidden sm:block text-text-primary">{levelTitle}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border overflow-y-auto p-3">
          <div className="mb-4">
            <p className="text-text-muted text-xs mb-1.5">Level {levelNumber} of {totalLevels}</p>
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-primary rounded-full transition-all"
                style={{ width: `${(levelNumber / totalLevels) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-text-primary font-bold text-lg mb-1">{levelTitle}</h1>
            <p className="text-text-secondary text-sm">{description}</p>
          </div>

          <div className="bg-white border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs uppercase tracking-wide">
                Chord {chordIdx + 1} of {chords.length}
              </p>
              <div className="flex gap-1.5">
                {chords.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < chordIdx ? 'bg-secondary' : i === chordIdx ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-3">
              <span className="text-5xl font-bold text-text-primary leading-none">
                {currentChord.symbol}
              </span>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notes to play</p>
                <p className="text-text-primary font-semibold text-base">
                  {expectedNoteNames.join(' · ')}
                </p>
              </div>
            </div>

            <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
          </div>
        </div>

        <div className="flex-1 bg-[#E8E4DC] p-2 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm">
            <PianoKeyboard
              onNotesChange={notes => {
                setPressedNotes(notes)
                if (validState === 'correct') return
                setValidState('idle')
              }}
              highlightNotes={validState !== 'correct' ? highlightNotes : []}
              disabled={validState === 'correct'}
            />
          </div>
          <p className="flex-shrink-0 pt-2 text-center text-xs text-text-secondary">
            Keys A-K + W E T Y U for octave 1 | Use mouse or touch for octave 2
          </p>
        </div>
      </div>

      {completed && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete</h2>
            <p className="text-text-secondary text-sm mb-6">
              You played all {chords.length} chords. Well done.
            </p>
            <button
              onClick={() => navigate(nextPath)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Continue to Practice
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
